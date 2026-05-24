import json
import os
import uuid
from datetime import datetime, timezone, timedelta

import psycopg2
import boto3

from utils import get_db, notify, notify_users_by_role

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": CORS,
            "body": json.dumps(body, ensure_ascii=False, default=str)}


def build_commerce_ml(inv: dict, orders: list[dict],
                       company: dict, our: dict) -> str:
    """
    Формирует XML в формате CommerceML 2.08 (УПД / накладная).
    """
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    doc_id  = str(uuid.uuid4())

    items_xml = ""
    for o in orders:
        total_with_vat = round(float(o["unit_price"]) * o["quantity"] * 1.22, 2)
        vat_per_unit   = round(float(o["unit_price"]) * 0.22, 2)
        items_xml += f"""
        <Товар>
            <Ид>{o["product_id"]}</Ид>
            <Наименование>{_esc(o["product_name"])}</Наименование>
            <БазоваяЕдиница>796</БазоваяЕдиница>
            <Количество>{o["quantity"]}</Количество>
            <ЦенаЗаЕдиницу>{o["unit_price"]:.2f}</ЦенаЗаЕдиницу>
            <Сумма>{total_with_vat:.2f}</Сумма>
            <СтавкаНДС>НДС20</СтавкаНДС>
            <СуммаНДС>{vat_per_unit * o["quantity"]:.2f}</СуммаНДС>
        </Товар>"""

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<КоммерческаяИнформация ВерсияСхемы="2.08" ДатаФормирования="{now_str}">
    <Документ>
        <Ид>{doc_id}</Ид>
        <Номер>{_esc(inv["invoice_number"])}</Номер>
        <Дата>{inv["operational_day"]}</Дата>
        <ХозяйственнаяОперация>Реализация товаров</ХозяйственнаяОперация>
        <Роль>Продавец</Роль>
        <Валюта>RUB</Валюта>
        <Курс>1</Курс>
        <Сумма>{inv["total_vat"]:.2f}</Сумма>
        <НДС>20</НДС>
        <Контрагенты>
            <Контрагент>
                <Ид>{our.get("inn", "")}</Ид>
                <Наименование>{_esc(our.get("name", "FlowBox"))}</Наименование>
                <ИНН>{our.get("inn", "")}</ИНН>
                <КПП>{our.get("kpp", "")}</КПП>
                <Роль>Продавец</Роль>
            </Контрагент>
            <Контрагент>
                <Ид>{company.get("inn", "")}</Ид>
                <Наименование>{_esc(company.get("full_name") or company.get("name", ""))}</Наименование>
                <ИНН>{company.get("inn", "")}</ИНН>
                <КПП>{company.get("kpp", "")}</КПП>
                <ЮридическийАдрес>{_esc(company.get("legal_address", ""))}</ЮридическийАдрес>
                <Роль>Покупатель</Роль>
            </Контрагент>
        </Контрагенты>
        <Товары>{items_xml}
        </Товары>
        <ЗначенияРеквизитов>
            <ЗначениеРеквизита>
                <Наименование>НомерСчета</Наименование>
                <Значение>{_esc(inv["invoice_number"])}</Значение>
            </ЗначениеРеквизита>
        </ЗначенияРеквизитов>
    </Документ>
</КоммерческаяИнформация>"""


def _esc(s: str) -> str:
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def upload_xml_to_s3(xml_content: str, invoice_number: str) -> str:
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    key = f"1c_exchange/{invoice_number}.xml"
    s3.put_object(
        Bucket="files", Key=key,
        Body=xml_content.encode("utf-8"),
        ContentType="application/xml; charset=utf-8",
    )
    project_id = os.environ["AWS_ACCESS_KEY_ID"]
    return f"https://cdn.poehali.dev/projects/{project_id}/bucket/{key}"


def handler(event: dict, context) -> dict:
    """
    Формирует CommerceML XML и выгружает в S3 после отгрузки.

    POST / body { invoice_id } — для одного счёта.
    POST / body { action: "batch" } — для всех неотправленных с delivered-доставкой.
    GET /?action=check_overdue — проверить давно неподписанные.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    conn = get_db()
    cur  = conn.cursor()
    results = []

    try:
        our_company = {}
        cur.execute("SELECT key, value FROM platform_setting WHERE key LIKE 'our_%'")
        for k, v in cur.fetchall():
            our_company[k.replace("our_", "")] = v

        if action == "check_overdue":
            # Счета, отправленные >5 р.д. назад без подписи
            cur.execute(
                """SELECT i.id, i.invoice_number, i.company_id, c.manager_id
                   FROM invoice i
                   JOIN company c ON c.id = i.company_id
                   WHERE i.upd_status = 'sent'
                     AND i.upd_sent_at < NOW() - INTERVAL '7 days'""",
            )
            for row in cur.fetchall():
                inv_id, inv_number, company_id, manager_id = row
                if manager_id:
                    notify(
                        cur, str(manager_id), "edo_unsigned",
                        f"УПД по счёту {inv_number} не подписан более 5 рабочих дней. "
                        f"Проверьте ЭДО.",
                        "invoice", str(inv_id),
                    )
                results.append({"invoice_number": inv_number, "status": "reminded"})
            conn.commit()
            return resp(200, {"ok": True, "reminded": len(results)})

        # Определить счета для выгрузки
        body = json.loads(event.get("body") or "{}")
        invoice_id_filter = body.get("invoice_id")

        if invoice_id_filter:
            cur.execute(
                "SELECT i.id, i.invoice_number, i.operational_day, i.subtotal_net, "
                "i.vat_amount, i.delivery_total, i.total_vat, i.company_id "
                "FROM invoice i WHERE i.id = %s",
                (invoice_id_filter,),
            )
        else:
            # batch: все оплаченные/pending счета с доставленными заказами, upd_status = not_sent
            cur.execute(
                """SELECT DISTINCT i.id, i.invoice_number, i.operational_day, i.subtotal_net,
                          i.vat_amount, i.delivery_total, i.total_vat, i.company_id
                   FROM invoice i
                   JOIN "order" o ON o.invoice_id = i.id
                   JOIN delivery d ON d.id = o.delivery_id
                   WHERE i.upd_status = 'not_sent'
                     AND d.status IN ('delivered', 'handed_to_tc')""",
            )

        invoice_rows = cur.fetchall()
        cols = ["id", "invoice_number", "operational_day", "subtotal_net",
                "vat_amount", "delivery_total", "total_vat", "company_id"]

        for row in invoice_rows:
            inv = dict(zip(cols, row))
            inv_id     = str(inv["id"])
            company_id = str(inv["company_id"])

            # Компания
            cur.execute(
                "SELECT id, name, full_name, inn, kpp, legal_address FROM company WHERE id = %s",
                (company_id,),
            )
            c_row = cur.fetchone()
            company = dict(zip(["id", "name", "full_name", "inn", "kpp", "legal_address"], c_row))

            # Заказы
            cur.execute(
                """SELECT o.id, o.quantity, o.unit_price, o.product_id,
                          p.accounting_name
                   FROM "order" o
                   LEFT JOIN product p ON p.id = o.product_id
                   WHERE o.invoice_id = %s AND o.archived_at IS NULL""",
                (inv_id,),
            )
            orders = [
                {
                    "product_id": str(r[3]) if r[3] else "",
                    "product_name": r[4] or "Товар",
                    "quantity": r[1],
                    "unit_price": float(r[2]),
                }
                for r in cur.fetchall()
            ]

            xml_content = build_commerce_ml(inv, orders, company, our_company)
            xml_url = upload_xml_to_s3(xml_content, inv["invoice_number"])

            now = datetime.now(timezone.utc)
            cur.execute(
                "UPDATE invoice SET upd_status = 'sent', upd_sent_at = %s WHERE id = %s",
                (now, inv_id),
            )

            results.append({
                "invoice_number": inv["invoice_number"],
                "xml_url": xml_url,
                "status": "sent",
            })

        conn.commit()

    finally:
        cur.close()
        conn.close()

    return resp(200, {"ok": True, "exported": len(results), "results": results})
