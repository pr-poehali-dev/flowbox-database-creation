import json
import os
import urllib.request
import urllib.error


def handler(event: dict, context) -> dict:
    """Поиск компании по ИНН через Дадата. Возвращает реквизиты для автозаполнения."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    params = event.get("queryStringParameters") or {}
    inn = (params.get("inn") or "").strip()

    if not inn or len(inn) not in (10, 12) or not inn.isdigit():
        return {
            "statusCode": 400,
            "headers": cors,
            "body": json.dumps({"error": "Введите корректный ИНН (10 или 12 цифр)"}, ensure_ascii=False),
        }

    api_key = os.environ.get("DADATA_API_KEY", "")
    url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party"
    payload = json.dumps({"query": inn, "count": 1}).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Token {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {
            "statusCode": 502,
            "headers": cors,
            "body": json.dumps({"error": f"Ошибка Дадата: {e.code}"}, ensure_ascii=False),
        }

    suggestions = data.get("suggestions", [])
    if not suggestions:
        return {
            "statusCode": 404,
            "headers": cors,
            "body": json.dumps({"error": "Компания с таким ИНН не найдена"}, ensure_ascii=False),
        }

    s = suggestions[0]
    d = s.get("data", {})

    state = d.get("state", {})
    if state.get("status") == "LIQUIDATED":
        return {
            "statusCode": 422,
            "headers": cors,
            "body": json.dumps({"error": "Компания ликвидирована и не может быть зарегистрирована"}, ensure_ascii=False),
        }

    management = d.get("management") or {}
    address = d.get("address") or {}

    opf_type = d.get("opf", {}).get("type", "")
    entity_type = "individual" if inn and len(inn) == 12 else "legal"

    result = {
        "inn": d.get("inn", inn),
        "kpp": d.get("kpp"),
        "ogrn": d.get("ogrn"),
        "full_name": d.get("name", {}).get("full_with_opf") or s.get("value"),
        "short_name": d.get("name", {}).get("short_with_opf") or s.get("value"),
        "legal_address": address.get("unrestricted_value"),
        "director_name": management.get("name"),
        "entity_type": entity_type,
        "status": state.get("status"),
    }

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps(result, ensure_ascii=False),
    }
