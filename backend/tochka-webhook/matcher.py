from decimal import Decimal
from utils import (
    notify, notify_users_by_role, notify_company_users,
    extract_invoice_number, create_transaction,
)


def run_matching(cur, bank_tx_id, company_id, amount, payment_purpose):
    if not company_id:
        notify_users_by_role(
            cur, "admin", "payment_needs_distribution",
            f"Платёж {amount} руб. не сопоставлен: компания не найдена по ИНН. "
            f"Назначение: {payment_purpose[:120]}",
            "bank_transaction", bank_tx_id,
        )
        return "unmatched"

    invoice_number = extract_invoice_number(payment_purpose)
    invoice_row = None

    if invoice_number:
        cur.execute(
            """SELECT id, invoice_number, total_vat, status, balance_applied
               FROM invoice
               WHERE company_id = %s AND invoice_number = %s
               ORDER BY created_at DESC LIMIT 1""",
            (company_id, invoice_number),
        )
        invoice_row = cur.fetchone()

    if not invoice_row:
        cur.execute(
            """SELECT id, invoice_number, total_vat, status, balance_applied
               FROM invoice
               WHERE company_id = %s AND status = 'pending'
               ORDER BY created_at DESC""",
            (company_id,),
        )
        open_invoices = cur.fetchall()

        if len(open_invoices) == 0:
            _add_to_balance(cur, company_id, amount, bank_tx_id, payment_purpose)
            return "overpayment"

        matches = [r for r in open_invoices if abs(float(r[2]) - float(amount)) < 0.01]

        if len(matches) == 1:
            invoice_row = matches[0]
        elif len(matches) > 1 or len(open_invoices) > 1:
            notify_users_by_role(
                cur, "manager", "payment_needs_distribution",
                f"Платёж {amount} руб. требует ручного распределения: "
                f"несколько открытых счетов у клиента.",
                "bank_transaction", bank_tx_id,
            )
            return "needs_distribution"
        else:
            invoice_row = open_invoices[0]

    inv_id     = str(invoice_row[0])
    inv_number = invoice_row[1]
    inv_total  = Decimal(str(invoice_row[2]))
    inv_status = invoice_row[3]

    if inv_status == "paid":
        _add_to_balance(cur, company_id, amount, bank_tx_id, payment_purpose)
        return "overpayment"

    diff = amount - inv_total

    if abs(diff) < Decimal("0.01"):
        _pay_invoice(cur, inv_id, inv_number, company_id, amount, bank_tx_id, Decimal("0"))
        return "auto_matched"
    elif diff > 0:
        _pay_invoice(cur, inv_id, inv_number, company_id, inv_total, bank_tx_id, diff)
        return "overpayment"
    else:
        notify_users_by_role(
            cur, "manager", "payment_needs_distribution",
            f"Недоплата по счёту {inv_number}: получено {amount} руб., ожидалось {inv_total} руб.",
            "invoice", inv_id,
        )
        return "underpayment"


def _pay_invoice(cur, inv_id, inv_number, company_id, amount, bank_tx_id, overpayment):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    cur.execute(
        """UPDATE invoice SET status = 'paid', paid_at = %s,
              bank_transaction_id = %s, overpayment_amount = %s
           WHERE id = %s""",
        (now, bank_tx_id, float(overpayment), inv_id),
    )
    cur.execute(
        "UPDATE bank_transaction SET matched_invoice_id = %s, matched_at = %s WHERE id = %s",
        (inv_id, now, bank_tx_id),
    )
    cur.execute(
        "UPDATE \"order\" SET payment_status = 'paid' WHERE invoice_id = %s",
        (inv_id,),
    )

    cur.execute("SELECT balance FROM company WHERE id = %s", (company_id,))
    balance = Decimal(str(cur.fetchone()[0]))

    create_transaction(
        cur, company_id, "payment_received", float(amount),
        "invoice", inv_id, float(balance),
        comment=f"Оплата счёта {inv_number}",
    )

    if overpayment > Decimal("0"):
        new_balance = balance + overpayment
        cur.execute("UPDATE company SET balance = %s WHERE id = %s", (float(new_balance), company_id))
        create_transaction(
            cur, company_id, "balance_used", float(overpayment),
            "invoice", inv_id, float(new_balance),
            comment=f"Переплата по счёту {inv_number} зачислена на баланс",
        )
        notify_company_users(
            cur, company_id, "invoice_paid",
            f"Счёт {inv_number} оплачен. Переплата {overpayment} руб. зачислена на ваш баланс.",
            "invoice", inv_id,
        )
    else:
        notify_company_users(
            cur, company_id, "invoice_paid",
            f"Счёт {inv_number} оплачен. Спасибо!",
            "invoice", inv_id,
        )

    cur.execute("SELECT manager_id FROM company WHERE id = %s", (company_id,))
    row = cur.fetchone()
    if row and row[0]:
        notify(cur, str(row[0]), "invoice_paid",
               f"Счёт {inv_number} оплачен клиентом на сумму {amount} руб.",
               "invoice", inv_id)

    cur.execute(
        "UPDATE company SET status = 'active', blocked_system_at = NULL WHERE id = %s AND status = 'blocked'",
        (company_id,),
    )

    cur.execute(
        """SELECT DISTINCT logist_id FROM delivery d
           JOIN "order" o ON o.delivery_id = d.id
           WHERE o.invoice_id = %s AND d.logist_id IS NOT NULL AND d.status = 'new' LIMIT 1""",
        (inv_id,),
    )
    logist_row = cur.fetchone()
    if logist_row and logist_row[0]:
        notify(cur, str(logist_row[0]), "logist_task",
               f"Счёт {inv_number} оплачен — можно отгружать заказы.", "invoice", inv_id)


def _add_to_balance(cur, company_id, amount, bank_tx_id, payment_purpose):
    cur.execute("SELECT balance FROM company WHERE id = %s", (company_id,))
    row = cur.fetchone()
    if not row:
        return
    old_balance = Decimal(str(row[0]))
    new_balance = old_balance + amount
    cur.execute("UPDATE company SET balance = %s WHERE id = %s", (float(new_balance), company_id))
    create_transaction(
        cur, company_id, "payment_received", float(amount),
        "bank_transaction", bank_tx_id, float(new_balance),
        comment=f"Входящий платёж зачислен на баланс.",
    )
    notify_company_users(cur, company_id, "invoice_paid", f"Платёж {amount} руб. зачислен на ваш баланс.")
