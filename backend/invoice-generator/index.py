import json
import os
import io
import textwrap
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

import psycopg2
import boto3

from utils import (
    get_db, add_business_days, notify_company_users,
    notify_users_by_role, create_transaction, send_email,
)

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": CORS,
            "body": json.dumps(body, ensure_ascii=False, default=str)}


# ── PDF-генератор (plaintext в формате UTF-8, без внешних библиотек) ─────────
def generate_invoice_pdf_bytes(inv: dict, orders: list[dict], company: dict,
                                 our_company: dict) -> bytes:
    """
    Генерирует текстовый PDF-эквивалент счёта.
    Без reportlab — используем простой текстовый формат.
    """
    lines = [
        "═" * 72,
        f"{'СЧЁТ НА ОПЛАТУ':^72}",
        f"{'№ ' + inv['invoice_number']:^72}",
        f"{'от ' + inv['operational_day']:^72}",
        "═" * 72,
        "",
        f"ПОСТАВЩИК: {our_company.get('name', 'FlowBox')}",
        f"ИНН/КПП: {our_company.get('inn', '—')}/{our_company.get('kpp', '—')}",
        f"Адрес: {our_company.get('legal_address', '—')}",
        f"Банк: {our_company.get('bank_name', '—')}",
        f"Р/сч: {our_company.get('bank_account', '—')}",
        f"БИК: {our_company.get('bik', '—')}",
        "",
        f"ПОКУПАТЕЛЬ: {company.get('full_name') or company.get('name', '—')}",
        f"ИНН/КПП: {company.get('inn', '—')}/{company.get('kpp', '—')}",
        f"Адрес: {company.get('legal_address', '—')}",
        "",
        "─" * 72,
        f"{'№':>3}  {'Наименование':<36}  {'Кол':>4}  {'Цена':>8}  {'Сумма':>10}",
        "─" * 72,
    ]

    for i, o in enumerate(orders, 1):
        name = textwrap.shorten(o.get("product_name", "Товар"), 36)
        lines.append(
            f"{i:>3}  {name:<36}  {o['quantity']:>4}  "
            f"{o['unit_price']:>8.2f}  {o['line_total']:>10.2f}"
        )

    lines += [
        "─" * 72,
        f"{'Итого без НДС:':>60}  {float(inv['subtotal_net']):>10.2f}",
        f"{'НДС 22%:':>60}  {float(inv['vat_amount']):>10.2f}",
        f"{'Доставка:':>60}  {float(inv['delivery_total']):>10.2f}",
        "─" * 72,
        f"{'ИТОГО К ОПЛАТЕ:':>60}  {float(inv['total_vat']):>10.2f}",
        "═" * 72,
        "",
        f"Срок оплаты: {inv['due_date']}",
        "",
        "Назначение платежа:",
        f"  Оплата по счёту {inv['invoice_number']} за товары. НДС 22% включён.",
        "",
        "═" * 72,
    ]
    return "\n".join(lines).encode("utf-8")


def upload_pdf_to_s3(pdf_bytes: bytes, invoice_number: str) -> str:
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    key = f"invoices/{invoice_number}.txt"
    s3.put_object(
        Bucket="files", Key=key,
        Body=pdf_bytes, ContentType="text/plain; charset=utf-8",
    )
    project_id = os.environ["AWS_ACCESS_KEY_ID"]
    return f"https://cdn.poehali.dev/projects/{project_id}/bucket/{key}"


def next_invoice_number(cur) -> str:
    cur.execute("SELECT COUNT(*) FROM invoice")
    n = cur.fetchone()[0] + 1
    return f"СЧ-{str(n).zfill(6)}"


def handler(event: dict, context) -> dict:
    """
    Генерация счетов при закрытии операционного дня.
    Для каждого клиента с неоплаченными подтверждёнными заказами:
      — собирает заказы → формирует Invoice → PDF → email → уведомление.

    POST / — запускает генерацию вручную (из планировщика или вручную).
    GET /?action=preview&company_id=... — превью без записи.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "run")
    today  = date.today()

    conn = get_db()
    cur  = conn.cursor()

    results = []

    try:
        # Реквизиты нашей компании (из platform_setting)
        our_company = {}
        cur.execute("SELECT key, value FROM platform_setting WHERE key LIKE 'our_%'")
        for k, v in cur.fetchall():
            our_company[k.replace("our_", "")] = v

        # Найти всех клиентов с неоплаченными подтверждёнными заказами за сегодня
        target_company_id = params.get("company_id")
        if target_company_id:
            cur.execute(
                """SELECT DISTINCT o.company_id
                   FROM "order" o
                   WHERE o.order_status = 'confirmed'
                     AND o.payment_status = 'unpaid'
                     AND o.invoice_id IS NULL
                     AND o.archived_at IS NULL
                     AND o.operational_day = %s
                     AND o.company_id = %s""",
                (today.isoformat(), target_company_id),
            )
        else:
            cur.execute(
                """SELECT DISTINCT o.company_id
                   FROM "order" o
                   WHERE o.order_status = 'confirmed'
                     AND o.payment_status = 'unpaid'
                     AND o.invoice_id IS NULL
                     AND o.archived_at IS NULL
                     AND o.operational_day = %s""",
                (today.isoformat(),),
            )
        company_ids = [str(r[0]) for r in cur.fetchall()]

        if not company_ids:
            return resp(200, {"ok": True, "message": "Нет заказов для выставления счетов",
                               "invoices_created": 0})

        # Настройки
        cur.execute("SELECT value FROM platform_setting WHERE key = 'business_days_due'")
        row = cur.fetchone()
        due_days = int(row[0]) if row else 5

        for company_id in company_ids:
            cur.execute(
                "SELECT id, name, full_name, inn, kpp, legal_address, email, balance FROM company WHERE id = %s",
                (company_id,),
            )
            company = dict(zip(
                ["id", "name", "full_name", "inn", "kpp", "legal_address", "email", "balance"],
                cur.fetchone()
            ))

            # Заказы компании за операционный день
            cur.execute(
                """SELECT o.id, o.order_number, o.quantity, o.unit_price,
                          o.delivery_cost, o.total_amount, p.accounting_name
                   FROM "order" o
                   LEFT JOIN product p ON p.id = o.product_id
                   WHERE o.company_id = %s
                     AND o.order_status = 'confirmed'
                     AND o.payment_status = 'unpaid'
                     AND o.invoice_id IS NULL
                     AND o.archived_at IS NULL
                     AND o.operational_day = %s""",
                (company_id, today.isoformat()),
            )
            order_rows = cur.fetchall()
            if not order_rows:
                continue

            order_ids = [str(r[0]) for r in order_rows]
            orders = [
                {
                    "id": str(r[0]),
                    "order_number": r[1],
                    "quantity": r[2],
                    "unit_price": float(r[3]),
                    "delivery_cost": float(r[4]),
                    "total_amount": float(r[5]),
                    "product_name": r[6] or "Товар",
                    "line_total": float(r[3]) * r[2],
                }
                for r in order_rows
            ]

            # Суммы
            gross = sum(Decimal(str(o["line_total"])) for o in orders)
            subtotal_net = (gross / Decimal("1.22")).quantize(Decimal("0.01"), ROUND_HALF_UP)
            vat_amount   = (gross - subtotal_net).quantize(Decimal("0.01"), ROUND_HALF_UP)
            delivery_total = sum(Decimal(str(o["delivery_cost"])) for o in orders)
            total_vat    = subtotal_net + vat_amount + delivery_total

            # Применить баланс
            company_balance = Decimal(str(company["balance"]))
            balance_applied = Decimal("0")
            if company_balance > 0:
                balance_applied = min(company_balance, total_vat)
                total_vat -= balance_applied

            due_date     = add_business_days(today, due_days)
            inv_number   = next_invoice_number(cur)

            if action == "preview":
                results.append({
                    "company_id": company_id,
                    "company_name": company["name"],
                    "invoice_number": inv_number,
                    "subtotal_net": float(subtotal_net),
                    "vat_amount": float(vat_amount),
                    "delivery_total": float(delivery_total),
                    "balance_applied": float(balance_applied),
                    "total_vat": float(total_vat),
                    "due_date": due_date.isoformat(),
                    "orders_count": len(orders),
                })
                continue

            # Создать Invoice
            cur.execute(
                """INSERT INTO invoice
                   (invoice_number, company_id, operational_day, subtotal_net,
                    vat_amount, delivery_total, total_vat, due_date, balance_applied)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                   RETURNING id""",
                (inv_number, company_id, today.isoformat(),
                 float(subtotal_net), float(vat_amount),
                 float(delivery_total), float(total_vat),
                 due_date.isoformat(), float(balance_applied)),
            )
            inv_id = str(cur.fetchone()[0])

            # Привязать заказы к счёту
            cur.execute(
                f"UPDATE \"order\" SET invoice_id = %s WHERE id = ANY(%s::uuid[])",
                (inv_id, order_ids),
            )

            # Списать баланс компании
            if balance_applied > 0:
                new_balance = company_balance - balance_applied
                cur.execute(
                    "UPDATE company SET balance = %s WHERE id = %s",
                    (float(new_balance), company_id),
                )
                create_transaction(
                    cur, company_id, "balance_used", float(balance_applied),
                    "invoice", inv_id, float(new_balance),
                    comment=f"Списание аванса в счёт оплаты {inv_number}",
                )

            # Транзакция invoice_issued
            cur.execute("SELECT balance FROM company WHERE id = %s", (company_id,))
            balance_now = float(cur.fetchone()[0])
            create_transaction(
                cur, company_id, "invoice_issued", float(total_vat),
                "invoice", inv_id, balance_now,
                comment=f"Выставлен счёт {inv_number}",
            )

            # PDF
            inv_data = {
                "invoice_number": inv_number,
                "operational_day": today.isoformat(),
                "due_date": due_date.isoformat(),
                "subtotal_net": subtotal_net,
                "vat_amount": vat_amount,
                "delivery_total": delivery_total,
                "total_vat": total_vat,
            }
            pdf_bytes = generate_invoice_pdf_bytes(inv_data, orders, company, our_company)

            pdf_url = None
            try:
                pdf_url = upload_pdf_to_s3(pdf_bytes, inv_number)
                cur.execute("UPDATE invoice SET pdf_url = %s WHERE id = %s", (pdf_url, inv_id))
            except Exception:
                pass

            # Email клиенту
            if company.get("email"):
                send_email(
                    to=company["email"],
                    subject=f"Счёт на оплату {inv_number} — FlowBox",
                    body_html=f"""
                        <p>Здравствуйте!</p>
                        <p>Выставлен счёт <strong>{inv_number}</strong> на сумму
                        <strong>{total_vat:.2f} ₽</strong>.</p>
                        <p>Срок оплаты: <strong>{due_date}</strong>.</p>
                        {f'<p><a href="{pdf_url}">Скачать счёт (TXT)</a></p>' if pdf_url else ''}
                        <p>При оплате укажите в назначении платежа номер счёта:
                        <strong>{inv_number}</strong>.</p>
                    """,
                    body_text=f"Счёт {inv_number} на {total_vat:.2f} ₽. Оплатить до {due_date}.",
                    attachment_bytes=pdf_bytes,
                    attachment_name=f"{inv_number}.txt",
                )

            # Уведомления
            notify_company_users(
                cur, company_id, "invoice_issued",
                f"Выставлен счёт {inv_number} на сумму {total_vat:.2f} ₽. "
                f"Оплатить до {due_date}.",
                "invoice", inv_id,
            )

            conn.commit()

            results.append({
                "company_id": company_id,
                "company_name": company["name"],
                "invoice_id": inv_id,
                "invoice_number": inv_number,
                "total_vat": float(total_vat),
                "due_date": due_date.isoformat(),
                "pdf_url": pdf_url,
            })

    finally:
        cur.close()
        conn.close()

    return resp(200, {
        "ok": True,
        "invoices_created": len(results),
        "results": results,
    })