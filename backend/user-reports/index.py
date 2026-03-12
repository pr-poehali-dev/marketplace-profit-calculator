"""Сохранение и загрузка отчётов пользователей."""
import json
import os

import jwt
import psycopg2


def get_user_id_from_token(headers):
    """Извлекает user_id из JWT токена."""
    auth = headers.get('X-Authorization', headers.get('Authorization', ''))
    if not auth.startswith('Bearer '):
        return None
    token = auth[7:]
    try:
        payload = jwt.decode(token, os.environ['JWT_SECRET'], algorithms=['HS256'])
        return payload.get('user_id')
    except Exception:
        return None


def handler(event: dict, context) -> dict:
    """Управление отчётами пользователей: сохранение, загрузка, удаление"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    headers = event.get('headers', {})
    user_id = get_user_id_from_token(headers)
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Необходима авторизация'}, ensure_ascii=False),
        }

    dsn = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'list')

    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {schema}")

    if method == 'GET' and action == 'list':
        cur.execute(
            "SELECT id, product_data, calculation_result, created_at FROM user_reports WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,)
        )
        rows = cur.fetchall()
        reports = []
        for row in rows:
            reports.append({
                'id': row[0],
                'productData': row[1],
                'calculationResult': row[2],
                'createdAt': row[3].isoformat() if row[3] else None,
            })
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'reports': reports}, ensure_ascii=False, default=str),
        }

    if method == 'POST' and action == 'save':
        body = json.loads(event.get('body') or '{}')
        products = body.get('products', [])
        calculations = body.get('calculations', [])
        if not products or not calculations:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Нет данных для сохранения'}, ensure_ascii=False),
            }

        cur.execute(
            "SELECT product_data->>'id' FROM user_reports WHERE user_id = %s",
            (user_id,)
        )
        existing_ids = set(row[0] for row in cur.fetchall() if row[0])

        saved = 0
        for prod, calc in zip(products, calculations):
            product_id = prod.get('id', '')
            if product_id and product_id in existing_ids:
                continue
            cur.execute(
                "INSERT INTO user_reports (user_id, product_data, calculation_result) VALUES (%s, %s, %s)",
                (user_id, json.dumps(prod, ensure_ascii=False), json.dumps(calc, ensure_ascii=False))
            )
            saved += 1

        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'ok': True, 'saved': saved}, ensure_ascii=False),
        }

    cur.close()
    conn.close()
    return {
        'statusCode': 400,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Неизвестное действие'}, ensure_ascii=False),
    }
