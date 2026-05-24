"""
Общие утилиты для финансовых функций FlowBox.
"""
import os
import re
import smtplib
import ssl
from datetime import date, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import psycopg2


def get_db():
    return psycopg2.connect(
        os.environ["DATABASE_URL"],
        options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}",
    )


def add_business_days(start, days):
    d = start
    added = 0
    while added < days:
        d += timedelta(days=1)
        if d.weekday() < 5:
            added += 1
    return d


def business_days_diff(d1, d2):
    sign = 1 if d1 >= d2 else -1
    lo, hi = (d2, d1) if d1 >= d2 else (d1, d2)
    count = 0
    cur = lo
    while cur < hi:
        cur += timedelta(days=1)
        if cur.weekday() < 5:
            count += 1
    return sign * count


def notify(cur, user_id, event_type, text, link_type=None, link_id=None):
    cur.execute(
        """INSERT INTO notification (user_id, event_type, channel, text, link_type, link_id)
           VALUES (%s, %s, 'in_app', %s, %s, %s)""",
        (user_id, event_type, text, link_type, link_id),
    )


def notify_users_by_role(cur, role, event_type, text, link_type=None, link_id=None):
    cur.execute('SELECT id FROM "user" WHERE role = %s AND archived_at IS NULL', (role,))
    for row in cur.fetchall():
        notify(cur, str(row[0]), event_type, text, link_type, link_id)


def notify_company_users(cur, company_id, event_type, text, link_type=None, link_id=None):
    cur.execute(
        'SELECT id FROM "user" WHERE company_id = %s AND archived_at IS NULL',
        (company_id,),
    )
    for row in cur.fetchall():
        notify(cur, str(row[0]), event_type, text, link_type, link_id)


def send_email(to, subject, body_html, body_text="", attachment_bytes=None, attachment_name=None):
    host = os.environ.get("SMTP_HOST", "")
    port = int(os.environ.get("SMTP_PORT", "465"))
    user = os.environ.get("SMTP_USER", "")
    pwd  = os.environ.get("SMTP_PASSWORD", "")
    if not host or not user or not pwd:
        return

    msg = MIMEMultipart("mixed")
    msg["Subject"] = subject
    msg["From"]    = f"FlowBox <{user}>"
    msg["To"]      = to

    alt = MIMEMultipart("alternative")
    if body_text:
        alt.attach(MIMEText(body_text, "plain", "utf-8"))
    alt.attach(MIMEText(body_html, "html", "utf-8"))
    msg.attach(alt)

    if attachment_bytes and attachment_name:
        from email.mime.base import MIMEBase
        from email import encoders
        part = MIMEBase("application", "octet-stream")
        part.set_payload(attachment_bytes)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f'attachment; filename="{attachment_name}"')
        msg.attach(part)

    ctx = ssl.create_default_context()
    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=ctx) as s:
                s.login(user, pwd)
                s.sendmail(user, to, msg.as_string())
        else:
            with smtplib.SMTP(host, port) as s:
                s.starttls(context=ctx)
                s.login(user, pwd)
                s.sendmail(user, to, msg.as_string())
    except Exception:
        pass


INVOICE_RE = re.compile(r"СЧ[-\u2013]?\s*(\d+)", re.IGNORECASE)


def extract_invoice_number(payment_purpose):
    m = INVOICE_RE.search(payment_purpose)
    if m:
        return f"СЧ-{m.group(1).zfill(6)}"
    return None


def create_transaction(cur, company_id, tx_type, amount, doc_type, doc_id, balance_after, comment="", created_by="system"):
    cur.execute(
        """INSERT INTO transaction
           (company_id, type, amount, linked_doc_type, linked_doc_id,
            status, created_by, comment, balance_after)
           VALUES (%s, %s, %s, %s, %s, 'confirmed', %s, %s, %s)""",
        (company_id, tx_type, amount, doc_type, doc_id, created_by, comment, balance_after),
    )
