import json
import os
import psycopg2


def get_db():
    return psycopg2.connect(
        os.environ["DATABASE_URL"],
        options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}",
    )


def handler(event: dict, context) -> dict:
    """Активация компании после завершения онбординга. Меняет статус на active, создаёт уведомления."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    body = json.loads(event.get("body") or "{}")
    company_id = body.get("company_id")

    if not company_id:
        return {
            "statusCode": 400,
            "headers": cors,
            "body": json.dumps({"error": "company_id обязателен"}, ensure_ascii=False),
        }

    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, name, onboarding_step, status, email, manager_id FROM company WHERE id = %s",
        (company_id,),
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return {
            "statusCode": 404,
            "headers": cors,
            "body": json.dumps({"error": "Компания не найдена"}, ensure_ascii=False),
        }

    cid, cname, step, status, cemail, manager_id = row

    if status == "active":
        cur.close(); conn.close()
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"ok": True, "already_active": True}, ensure_ascii=False),
        }

    if step < 7:
        cur.close(); conn.close()
        return {
            "statusCode": 422,
            "headers": cors,
            "body": json.dumps(
                {"error": f"Не все шаги заполнены. Текущий шаг: {step}"},
                ensure_ascii=False,
            ),
        }

    cur.execute(
        "UPDATE company SET status = 'active', onboarding_step = 8, activated_at = NOW() WHERE id = %s",
        (company_id,),
    )

    cur.execute(
        """SELECT id FROM "user" WHERE id IS NOT NULL LIMIT 1"""
    )
    admin_row = cur.fetchone()

    if manager_id:
        cur.execute(
            """INSERT INTO notification (user_id, event_type, channel, text, link_type, link_id)
               VALUES (%s, 'new_claim', 'in_app', %s, 'company', %s)""",
            (
                str(manager_id),
                f"Новый клиент прошёл онбординг: {cname}",
                str(cid),
            ),
        )

    conn.commit()
    cur.close(); conn.close()

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps(
            {"ok": True, "company_id": str(cid), "status": "active"},
            ensure_ascii=False,
        ),
    }
