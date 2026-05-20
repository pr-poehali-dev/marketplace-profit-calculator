"""Единая функция для раздела WB Аналитика: подключение, синхронизация, аналитика, прогноз, инсайты."""
import json
import os
import time
import random
import hashlib
import hmac
import re
import secrets
from datetime import datetime, timedelta, date, timezone

import jwt
import psycopg2
import psycopg2.extras
import urllib.request
import urllib.error
from cryptography.fernet import Fernet


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
    'Access-Control-Max-Age': '86400',
}


def json_resp(status, body):
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def get_user_id(headers):
    auth = headers.get('X-Authorization', headers.get('Authorization', ''))
    if not auth.startswith('Bearer '):
        return None
    try:
        payload = jwt.decode(auth[7:], os.environ['JWT_SECRET'], algorithms=['HS256'])
        return payload.get('user_id')
    except Exception:
        return None


def get_fernet():
    """Возвращает Fernet. Использует WB_TOKEN_ENCRYPTION_KEY если он валиден (32 байта base64),
    иначе выводит ключ из JWT_SECRET (стабильно и не требует ручной настройки)."""
    import base64
    raw = os.environ.get('WB_TOKEN_ENCRYPTION_KEY', '').strip()
    if raw:
        try:
            return Fernet(raw.encode() if isinstance(raw, str) else raw)
        except Exception:
            pass  # fallback ниже
    seed = os.environ.get('JWT_SECRET', 'fallback-secret-please-set-jwt-secret').encode()
    digest = hashlib.sha256(seed + b'|wb-fernet-v1').digest()
    derived = base64.urlsafe_b64encode(digest)
    return Fernet(derived)


def hash_password(password: str, salt: str = None) -> str:
    """PBKDF2 хеш пароля. Формат: pbkdf2$<iterations>$<salt>$<hash>."""
    if salt is None:
        salt = secrets.token_hex(16)
    iterations = 100_000
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), iterations)
    return f'pbkdf2${iterations}${salt}${dk.hex()}'


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iters, salt, hash_hex = stored.split('$')
        expected = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), int(iters))
        return hmac.compare_digest(expected.hex(), hash_hex)
    except Exception:
        return False


def create_jwt(user_id: int) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=30),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, os.environ['JWT_SECRET'], algorithm='HS256')


EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def decrypt_token(encrypted: str) -> str:
    return get_fernet().decrypt(encrypted.encode()).decode()


def verify_wb_token(token: str) -> dict:
    url = 'https://common-api.wildberries.ru/api/v1/seller-info'
    req = urllib.request.Request(url, headers={'Authorization': token})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                return {'valid': True}
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            return {'valid': False, 'error': 'Токен недействителен или нет нужных прав'}
    except Exception:
        pass
    return {'valid': True, 'warning': 'Проверка не удалась — сохранили как есть'}


def wb_get(url: str, token: str, params: dict = None):
    if params:
        qs = '&'.join(f'{k}={v}' for k, v in params.items())
        url = f'{url}?{qs}'
    req = urllib.request.Request(url, headers={'Authorization': token})
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        if e.code == 429:
            time.sleep(3)
        raise


def generate_demo_data(cur, user_id):
    random.seed(user_id)
    products = [
        (100001, 'ART-001', 'Футболка', 'Одежда', 'Brand A', 890, 1290),
        (100002, 'ART-002', 'Джинсы', 'Одежда', 'Brand A', 1990, 2990),
        (100003, 'ART-003', 'Кроссовки', 'Обувь', 'Brand B', 2490, 3990),
        (100004, 'ART-004', 'Рюкзак', 'Аксессуары', 'Brand B', 1290, 1990),
        (100005, 'ART-005', 'Куртка', 'Одежда', 'Brand C', 3490, 5990),
        (100006, 'ART-006', 'Худи', 'Одежда', 'Brand C', 1590, 2490),
        (100007, 'ART-007', 'Сумка', 'Аксессуары', 'Brand A', 990, 1490),
        (100008, 'ART-008', 'Шапка', 'Аксессуары', 'Brand B', 490, 890),
    ]
    warehouses = ['Коледино', 'Электросталь', 'Казань', 'Краснодар']
    regions = ['Москва', 'СПб', 'Екатеринбург', 'Казань', 'Новосибирск', 'Ростов']

    today = date.today()
    cur.execute('DELETE FROM wb_orders WHERE user_id = %s', (user_id,))
    cur.execute('DELETE FROM wb_sales WHERE user_id = %s', (user_id,))
    cur.execute('DELETE FROM wb_stocks WHERE user_id = %s', (user_id,))
    cur.execute('DELETE FROM wb_ads WHERE user_id = %s', (user_id,))

    orders_batch = []
    sales_batch = []
    for days_ago in range(90, -1, -1):
        d = today - timedelta(days=days_ago)
        trend = 1.0 + (90 - days_ago) * 0.008
        weekday_boost = 1.2 if d.weekday() in (5, 6) else 1.0
        base_orders = int(18 * trend * weekday_boost * random.uniform(0.7, 1.3))
        for _ in range(base_orders):
            p = random.choice(products)
            w = random.choice(warehouses)
            r = random.choice(regions)
            dt = datetime.combine(d, datetime.min.time()) + timedelta(hours=random.randint(0, 23))
            price = p[6] * random.uniform(0.85, 1.0)
            commission = random.uniform(15, 22)
            for_pay = price * (1 - commission / 100)
            is_cancel = random.random() < 0.08
            srid = f'{user_id}-{p[0]}-{d.isoformat()}-{random.randint(1000, 9999)}'
            orders_batch.append((user_id, d, dt, p[0], p[1], p[2], p[3], p[4], w, r, round(price, 2), is_cancel, srid))
            if not is_cancel and random.random() < 0.85:
                sales_batch.append((user_id, d, dt, p[0], p[1], p[2], p[3], p[4], w, r,
                                    round(price, 2), round(for_pay, 2), round(price, 2), round(commission, 2), False, srid))

    psycopg2.extras.execute_batch(
        cur,
        """INSERT INTO wb_orders (user_id, order_date, order_dt, nm_id, supplier_article, subject, category, brand, warehouse, region, price_with_disc, is_cancel, srid)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        orders_batch, page_size=200,
    )
    psycopg2.extras.execute_batch(
        cur,
        """INSERT INTO wb_sales (user_id, sale_date, sale_dt, nm_id, supplier_article, subject, category, brand, warehouse, region, price_with_disc, for_pay, finished_price, commission_percent, is_return, srid)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        sales_batch, page_size=200,
    )

    stocks_batch = []
    for p in products:
        for w in warehouses:
            qty = random.randint(15, 200)
            stocks_batch.append((user_id, today, p[0], p[1], p[2], p[3], p[4], w, qty, qty, p[6], round((p[6] - p[5]) / p[6] * 100, 1)))
    psycopg2.extras.execute_batch(
        cur,
        """INSERT INTO wb_stocks (user_id, snapshot_date, nm_id, supplier_article, subject, category, brand, warehouse, quantity, quantity_full, price, discount)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        stocks_batch, page_size=100,
    )

    campaigns = [
        (901, 'Авто-Футболка', 'auto', 100001),
        (902, 'Авто-Джинсы', 'auto', 100002),
        (903, 'Поиск-Кроссовки', 'search', 100003),
        (904, 'Авто-Рюкзак', 'auto', 100004),
        (905, 'Поиск-Куртка', 'search', 100005),
        (906, 'Авто-Худи', 'auto', 100006),
    ]
    ads_batch = []
    for days_ago in range(30, -1, -1):
        d = today - timedelta(days=days_ago)
        for c in campaigns:
            views = random.randint(800, 3500)
            clicks = int(views * random.uniform(0.03, 0.09))
            ctr = clicks / views * 100 if views else 0
            cpc = random.uniform(3.5, 12.0)
            sum_spent = clicks * cpc
            orders_count = int(clicks * random.uniform(0.02, 0.1))
            orders_sum = orders_count * random.uniform(900, 3500)
            ads_batch.append((user_id, d, c[0], c[1], c[2], c[3], views, clicks, round(ctr, 4), round(cpc, 2),
                              round(sum_spent, 2), orders_count, round(orders_sum, 2)))
    psycopg2.extras.execute_batch(
        cur,
        """INSERT INTO wb_ads (user_id, ad_date, campaign_id, campaign_name, campaign_type, nm_id, views, clicks, ctr, cpc, sum_spent, orders_count, orders_sum)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        ads_batch, page_size=200,
    )


def sync_real_wb(cur, user_id, token):
    total = 0
    date_from = (date.today() - timedelta(days=90)).isoformat()
    try:
        data = wb_get('https://statistics-api.wildberries.ru/api/v1/supplier/orders', token, {'dateFrom': date_from})
        if isinstance(data, list) and data:
            cur.execute('DELETE FROM wb_orders WHERE user_id = %s', (user_id,))
            batch = []
            for o in data:
                try:
                    dt = datetime.fromisoformat(o.get('date', '').replace('Z', ''))
                    batch.append((user_id, dt.date(), dt, o.get('nmId'), o.get('supplierArticle'), o.get('subject'),
                                  o.get('category'), o.get('brand'), o.get('warehouseName'), o.get('oblastOkrugName'),
                                  o.get('priceWithDisc'), bool(o.get('isCancel')), o.get('srid')))
                except Exception:
                    continue
            psycopg2.extras.execute_batch(
                cur,
                """INSERT INTO wb_orders (user_id, order_date, order_dt, nm_id, supplier_article, subject, category, brand, warehouse, region, price_with_disc, is_cancel, srid)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                batch, page_size=200,
            )
            total += len(batch)
    except Exception:
        pass
    return total


# ===== Аналитика =====

def parse_period(params):
    days = int(params.get('days', 30))
    today = date.today()
    date_from = today - timedelta(days=days - 1)
    prev_to = date_from - timedelta(days=1)
    prev_from = prev_to - timedelta(days=days - 1)
    return date_from, today, prev_from, prev_to, days


def pct_delta(curr, prev):
    if not prev:
        return 0.0
    return round((curr - prev) / prev * 100, 2)


def block_kpi(cur, user_id, a, b):
    cur.execute(
        """SELECT COALESCE(SUM(price_with_disc),0) AS rev, COALESCE(SUM(for_pay),0) AS pay, COUNT(*) AS orders
           FROM wb_sales WHERE user_id=%s AND sale_date BETWEEN %s AND %s AND is_return=FALSE""",
        (user_id, a, b),
    )
    r = cur.fetchone()
    cur.execute(
        "SELECT COALESCE(SUM(sum_spent),0) AS spent FROM wb_ads WHERE user_id=%s AND ad_date BETWEEN %s AND %s",
        (user_id, a, b),
    )
    s = cur.fetchone()
    revenue = float(r['rev']); for_pay = float(r['pay']); ad = float(s['spent']); orders = int(r['orders'])
    cogs = revenue * 0.4
    profit = for_pay - ad - cogs
    margin = (profit / revenue * 100) if revenue else 0
    drr = (ad / revenue * 100) if revenue else 0
    avg = (revenue / orders) if orders else 0
    return {
        'revenue': round(revenue, 2), 'profit': round(profit, 2), 'margin': round(margin, 2),
        'orders': orders, 'avgCheck': round(avg, 2), 'drr': round(drr, 2), 'adSpent': round(ad, 2),
    }


def kpi_with_delta(cur, user_id, df, dt, pf, pt):
    curr = block_kpi(cur, user_id, df, dt)
    prev = block_kpi(cur, user_id, pf, pt)
    return {k: {'value': v, 'delta': pct_delta(v, prev.get(k, 0))} for k, v in curr.items()}


def series_by_day(cur, user_id, df, dt):
    cur.execute(
        """SELECT sale_date, COALESCE(SUM(price_with_disc),0) AS rev, COALESCE(SUM(for_pay),0) AS pay, COUNT(*) AS orders
           FROM wb_sales WHERE user_id=%s AND sale_date BETWEEN %s AND %s AND is_return=FALSE
           GROUP BY sale_date ORDER BY sale_date""",
        (user_id, df, dt),
    )
    sales = {r['sale_date'].isoformat(): r for r in cur.fetchall()}
    cur.execute(
        """SELECT ad_date, COALESCE(SUM(sum_spent),0) AS spent FROM wb_ads
           WHERE user_id=%s AND ad_date BETWEEN %s AND %s GROUP BY ad_date""",
        (user_id, df, dt),
    )
    ads = {r['ad_date'].isoformat(): float(r['spent']) for r in cur.fetchall()}
    out = []
    d = df
    while d <= dt:
        key = d.isoformat()
        s = sales.get(key)
        rev = float(s['rev']) if s else 0
        pay = float(s['pay']) if s else 0
        orders = int(s['orders']) if s else 0
        ad = ads.get(key, 0)
        cogs = rev * 0.4
        profit = pay - ad - cogs
        out.append({'date': key, 'revenue': round(rev, 2), 'profit': round(profit, 2), 'orders': orders, 'adSpent': round(ad, 2)})
        d += timedelta(days=1)
    return out


def expense_breakdown(cur, user_id, df, dt):
    cur.execute(
        """SELECT COALESCE(SUM(price_with_disc),0) AS rev, COALESCE(SUM(for_pay),0) AS pay
           FROM wb_sales WHERE user_id=%s AND sale_date BETWEEN %s AND %s AND is_return=FALSE""",
        (user_id, df, dt),
    )
    r = cur.fetchone()
    rev = float(r['rev']); pay = float(r['pay'])
    commission = rev - pay
    cur.execute(
        "SELECT COALESCE(SUM(sum_spent),0) AS spent FROM wb_ads WHERE user_id=%s AND ad_date BETWEEN %s AND %s",
        (user_id, df, dt),
    )
    ad = float(cur.fetchone()['spent'])
    return [
        {'name': 'Комиссия WB', 'value': round(commission, 2)},
        {'name': 'Логистика', 'value': round(rev * 0.08, 2)},
        {'name': 'Хранение', 'value': round(rev * 0.02, 2)},
        {'name': 'Реклама', 'value': round(ad, 2)},
        {'name': 'Себестоимость', 'value': round(rev * 0.4, 2)},
    ]


def top_products(cur, user_id, df, dt, limit=10):
    cur.execute(
        """SELECT nm_id, MAX(supplier_article) AS art, MAX(subject) AS subj, MAX(brand) AS brand,
                  COALESCE(SUM(price_with_disc),0) AS rev, COALESCE(SUM(for_pay),0) AS pay, COUNT(*) AS orders
           FROM wb_sales WHERE user_id=%s AND sale_date BETWEEN %s AND %s AND is_return=FALSE
           GROUP BY nm_id ORDER BY rev DESC LIMIT %s""",
        (user_id, df, dt, limit),
    )
    out = []
    for r in cur.fetchall():
        rev = float(r['rev']); pay = float(r['pay']); cogs = rev * 0.4
        profit = pay - cogs
        margin = (profit / rev * 100) if rev else 0
        out.append({'nmId': r['nm_id'], 'article': r['art'], 'subject': r['subj'], 'brand': r['brand'],
                    'revenue': round(rev, 2), 'profit': round(profit, 2), 'margin': round(margin, 2), 'orders': int(r['orders'])})
    return out


def products_full(cur, user_id, df, dt):
    cur.execute(
        """SELECT nm_id, MAX(supplier_article) AS art, MAX(subject) AS subj, MAX(brand) AS brand,
                  COALESCE(SUM(price_with_disc),0) AS rev, COALESCE(SUM(for_pay),0) AS pay, COUNT(*) AS orders
           FROM wb_sales WHERE user_id=%s AND sale_date BETWEEN %s AND %s AND is_return=FALSE GROUP BY nm_id""",
        (user_id, df, dt),
    )
    sales_map = {r['nm_id']: r for r in cur.fetchall()}
    cur.execute(
        """SELECT nm_id, SUM(sum_spent) AS spent FROM wb_ads
           WHERE user_id=%s AND ad_date BETWEEN %s AND %s AND nm_id IS NOT NULL GROUP BY nm_id""",
        (user_id, df, dt),
    )
    ad_map = {r['nm_id']: float(r['spent'] or 0) for r in cur.fetchall()}
    cur.execute(
        """SELECT nm_id, SUM(quantity) AS qty FROM wb_stocks
           WHERE user_id=%s AND snapshot_date=(SELECT MAX(snapshot_date) FROM wb_stocks WHERE user_id=%s) GROUP BY nm_id""",
        (user_id, user_id),
    )
    stock_map = {r['nm_id']: int(r['qty'] or 0) for r in cur.fetchall()}
    out = []
    days = (dt - df).days + 1
    for nm, r in sales_map.items():
        rev = float(r['rev']); pay = float(r['pay']); cogs = rev * 0.4
        ad = ad_map.get(nm, 0)
        profit = pay - cogs - ad
        margin = (profit / rev * 100) if rev else 0
        drr = (ad / rev * 100) if rev else 0
        stock = stock_map.get(nm, 0)
        daily = r['orders'] / days if days else 0
        turnover = (stock / daily) if daily else 0
        status = 'star' if margin > 25 and r['orders'] > 0 else ('warn' if margin < 10 else 'ok')
        out.append({'nmId': nm, 'article': r['art'], 'subject': r['subj'], 'brand': r['brand'],
                    'revenue': round(rev, 2), 'profit': round(profit, 2), 'margin': round(margin, 2),
                    'orders': int(r['orders']), 'drr': round(drr, 2), 'stock': stock,
                    'turnover': round(turnover, 1), 'status': status})
    out.sort(key=lambda x: x['revenue'], reverse=True)
    return out


def sales_calendar(cur, user_id, df, dt):
    cur.execute(
        """SELECT sale_date, COUNT(*) AS c, COALESCE(SUM(price_with_disc),0) AS rev
           FROM wb_sales WHERE user_id=%s AND sale_date BETWEEN %s AND %s AND is_return=FALSE GROUP BY sale_date""",
        (user_id, df, dt),
    )
    return [{'date': r['sale_date'].isoformat(), 'orders': int(r['c']), 'revenue': float(r['rev'])} for r in cur.fetchall()]


def sales_regions(cur, user_id, df, dt):
    cur.execute(
        """SELECT region, COUNT(*) AS orders, COALESCE(SUM(price_with_disc),0) AS rev
           FROM wb_sales WHERE user_id=%s AND sale_date BETWEEN %s AND %s AND is_return=FALSE AND region IS NOT NULL
           GROUP BY region ORDER BY rev DESC""",
        (user_id, df, dt),
    )
    return [{'region': r['region'], 'orders': int(r['orders']), 'revenue': float(r['rev'])} for r in cur.fetchall()]


def warehouses_breakdown(cur, user_id, df, dt):
    cur.execute(
        """SELECT warehouse, COUNT(*) AS orders, COALESCE(SUM(price_with_disc),0) AS rev
           FROM wb_sales WHERE user_id=%s AND sale_date BETWEEN %s AND %s AND is_return=FALSE AND warehouse IS NOT NULL
           GROUP BY warehouse ORDER BY rev DESC""",
        (user_id, df, dt),
    )
    return [{'warehouse': r['warehouse'], 'orders': int(r['orders']), 'revenue': float(r['rev'])} for r in cur.fetchall()]


def ads_analytics(cur, user_id, df, dt):
    cur.execute(
        """SELECT COALESCE(SUM(sum_spent),0) AS spent, COALESCE(SUM(orders_count),0) AS oc,
                  COALESCE(SUM(orders_sum),0) AS os, COALESCE(SUM(views),0) AS v, COALESCE(SUM(clicks),0) AS c
           FROM wb_ads WHERE user_id=%s AND ad_date BETWEEN %s AND %s""",
        (user_id, df, dt),
    )
    r = cur.fetchone()
    spent = float(r['spent']); oc = int(r['oc']); os_ = float(r['os'])
    views = int(r['v']); clicks = int(r['c'])
    drr = (spent / os_ * 100) if os_ else 0
    cpo = (spent / oc) if oc else 0
    ctr = (clicks / views * 100) if views else 0
    roi = ((os_ - spent) / spent * 100) if spent else 0

    cur.execute(
        """SELECT ad_date, SUM(sum_spent) AS spent, SUM(orders_count) AS oc, SUM(orders_sum) AS os
           FROM wb_ads WHERE user_id=%s AND ad_date BETWEEN %s AND %s GROUP BY ad_date ORDER BY ad_date""",
        (user_id, df, dt),
    )
    series = [{'date': r['ad_date'].isoformat(), 'spent': float(r['spent'] or 0),
               'orders': int(r['oc'] or 0), 'revenue': float(r['os'] or 0)} for r in cur.fetchall()]

    cur.execute(
        """SELECT campaign_id, MAX(campaign_name) AS name, MAX(campaign_type) AS type,
                  SUM(sum_spent) AS spent, SUM(orders_count) AS oc, SUM(orders_sum) AS os,
                  SUM(views) AS v, SUM(clicks) AS cl
           FROM wb_ads WHERE user_id=%s AND ad_date BETWEEN %s AND %s GROUP BY campaign_id ORDER BY spent DESC""",
        (user_id, df, dt),
    )
    campaigns = []
    for row in cur.fetchall():
        sp = float(row['spent'] or 0); rv = float(row['os'] or 0)
        cdrr = (sp / rv * 100) if rv else 0
        croi = ((rv - sp) / sp * 100) if sp else 0
        campaigns.append({'id': row['campaign_id'], 'name': row['name'], 'type': row['type'],
                          'spent': round(sp, 2), 'orders': int(row['oc'] or 0), 'revenue': round(rv, 2),
                          'drr': round(cdrr, 2), 'roi': round(croi, 2),
                          'views': int(row['v'] or 0), 'clicks': int(row['cl'] or 0)})
    return {
        'kpi': {'spent': round(spent, 2), 'adOrders': oc, 'adRevenue': round(os_, 2),
                'drr': round(drr, 2), 'cpo': round(cpo, 2), 'ctr': round(ctr, 2), 'roi': round(roi, 2)},
        'series': series,
        'campaigns': campaigns,
    }


# ===== Прогноз =====

def holt_winters(series, season_len=7, horizon=30, alpha=0.4, beta=0.1, gamma=0.3):
    n = len(series)
    if n < 2 * season_len:
        avg = sum(series) / len(series) if series else 0
        trend = (series[-1] - series[0]) / (len(series) - 1) if len(series) >= 2 else 0
        return [max(0, avg + trend * (i + 1)) for i in range(horizon)]
    level = sum(series[:season_len]) / season_len
    trend = (sum(series[season_len:2*season_len]) - sum(series[:season_len])) / (season_len * season_len)
    seasonals = [series[i] - level for i in range(season_len)]
    for i in range(1, n):
        si = i % season_len
        prev_level = level
        level = alpha * (series[i] - seasonals[si]) + (1 - alpha) * (level + trend)
        trend = beta * (level - prev_level) + (1 - beta) * trend
        seasonals[si] = gamma * (series[i] - level) + (1 - gamma) * seasonals[si]
    out = []
    for h in range(horizon):
        si = (n + h) % season_len
        out.append(max(0, level + (h + 1) * trend + seasonals[si]))
    return out


def build_forecast(cur, user_id, horizon, ad_mult=1.0, price_mult=1.0):
    today = date.today()
    history_from = today - timedelta(days=90)
    cur.execute(
        """SELECT sale_date, COUNT(*) AS orders, COALESCE(SUM(price_with_disc),0) AS rev, COALESCE(SUM(for_pay),0) AS pay
           FROM wb_sales WHERE user_id=%s AND sale_date BETWEEN %s AND %s AND is_return=FALSE
           GROUP BY sale_date ORDER BY sale_date""",
        (user_id, history_from, today),
    )
    rows = cur.fetchall()
    if not rows:
        return None
    day_map = {r['sale_date']: r for r in rows}
    rev_s, prof_s, ord_s, hist = [], [], [], []
    d = history_from
    while d <= today:
        r = day_map.get(d)
        rev = float(r['rev']) if r else 0
        pay = float(r['pay']) if r else 0
        orders = int(r['orders']) if r else 0
        profit = pay - rev * 0.4 - rev * 0.05
        rev_s.append(rev); prof_s.append(profit); ord_s.append(orders)
        hist.append({'date': d.isoformat(), 'revenue': round(rev, 2), 'profit': round(profit, 2), 'orders': orders})
        d += timedelta(days=1)

    rb = holt_winters(rev_s, horizon=horizon)
    pb = holt_winters(prof_s, horizon=horizon)
    ob = holt_winters(ord_s, horizon=horizon)

    ro = [v * 1.18 for v in rb]; rc = [v * 0.85 for v in rb]
    po = [v * 1.18 for v in pb]; pc = [v * 0.85 for v in pb]
    oo = [v * 1.18 for v in ob]; oc = [v * 0.85 for v in ob]

    rb = [v * price_mult for v in rb]; ro = [v * price_mult for v in ro]; rc = [v * price_mult for v in rc]
    avg_rev = sum(rev_s) / max(len(rev_s), 1)
    ad_adjust = (ad_mult - 1) * avg_rev * 0.05
    pb = [v - ad_adjust for v in pb]; po = [v - ad_adjust for v in po]; pc = [v - ad_adjust for v in pc]

    forecast = []
    for i in range(horizon):
        d = today + timedelta(days=i + 1)
        forecast.append({
            'date': d.isoformat(),
            'revenueBase': round(rb[i], 2), 'revenueOpt': round(ro[i], 2), 'revenueCaut': round(rc[i], 2),
            'profitBase': round(pb[i], 2), 'profitOpt': round(po[i], 2), 'profitCaut': round(pc[i], 2),
            'ordersBase': round(ob[i], 1), 'ordersOpt': round(oo[i], 1), 'ordersCaut': round(oc[i], 1),
        })

    return {
        'horizon': horizon,
        'history': hist,
        'forecast': forecast,
        'scenarios': {
            'base': {'revenue': round(sum(rb), 2), 'profit': round(sum(pb), 2), 'orders': round(sum(ob)),
                     'description': 'Продолжение текущего тренда и сезонности без изменений.'},
            'optimistic': {'revenue': round(sum(ro), 2), 'profit': round(sum(po), 2), 'orders': round(sum(oo)),
                           'description': 'Рост спроса, успешные акции, увеличение конверсии на 15–20%.'},
            'cautious': {'revenue': round(sum(rc), 2), 'profit': round(sum(pc), 2), 'orders': round(sum(oc)),
                         'description': 'Сезонный спад, снижение активности, консервативная оценка.'},
        },
        'factors': [
            {'name': 'Сезонность', 'weight': 35},
            {'name': 'Тренд', 'weight': 28},
            {'name': 'Остатки', 'weight': 18},
            {'name': 'Рекламный бюджет', 'weight': 12},
            {'name': 'Цена', 'weight': 7},
        ],
        'whatIf': {'adMultiplier': ad_mult, 'priceMultiplier': price_mult},
    }


# ===== Инсайты =====

def build_insights(cur, user_id):
    today = date.today()
    p1_from = today - timedelta(days=13); p1_to = today
    p2_from = today - timedelta(days=27); p2_to = today - timedelta(days=14)

    def rev_map(a, b):
        cur.execute(
            """SELECT nm_id, MAX(subject) AS subj, MAX(supplier_article) AS art, COALESCE(SUM(price_with_disc),0) AS rev
               FROM wb_sales WHERE user_id=%s AND sale_date BETWEEN %s AND %s AND is_return=FALSE GROUP BY nm_id""",
            (user_id, a, b),
        )
        return {r['nm_id']: r for r in cur.fetchall()}

    curr = rev_map(p1_from, p1_to); prev = rev_map(p2_from, p2_to)
    growth, decline = [], []
    for nm, c in curr.items():
        p = prev.get(nm)
        if not p:
            continue
        pc = float(p['rev']); cc = float(c['rev'])
        if pc < 100:
            continue
        delta = (cc - pc) / pc * 100
        if delta > 25:
            growth.append((nm, c, delta))
        elif delta < -20:
            decline.append((nm, c, delta))
    growth.sort(key=lambda x: -x[2]); decline.sort(key=lambda x: x[2])

    insights = []
    for nm, c, d in growth[:3]:
        insights.append({'tag': 'Рост', 'severity': 'success',
                         'title': f'Товар {c["subj"]} ({c["art"]}) вырос на +{round(d, 1)}%',
                         'description': 'Выручка за 14 дней выросла относительно предыдущих двух недель. Рассмотрите увеличение бюджета рекламы и пополнение остатков.',
                         'linkPath': '/wb/products', 'metricDelta': round(d, 2)})
    for nm, c, d in decline[:3]:
        insights.append({'tag': 'Падение', 'severity': 'danger',
                         'title': f'Товар {c["subj"]} ({c["art"]}) теряет выручку: {round(d, 1)}%',
                         'description': 'Проверьте цену, остатки, рекламные кампании и отзывы.',
                         'linkPath': '/wb/products', 'metricDelta': round(d, 2)})

    cur.execute(
        """SELECT campaign_id, MAX(campaign_name) AS name, SUM(sum_spent) AS spent, SUM(orders_sum) AS rev
           FROM wb_ads WHERE user_id=%s AND ad_date >= %s GROUP BY campaign_id""",
        (user_id, p1_from),
    )
    for r in cur.fetchall():
        sp = float(r['spent'] or 0); rv = float(r['rev'] or 0)
        if sp < 500:
            continue
        drr = (sp / rv * 100) if rv else 999
        if drr > 30:
            insights.append({'tag': 'Риск', 'severity': 'danger',
                             'title': f'Кампания «{r["name"]}»: ДРР {round(drr, 1)}%',
                             'description': 'Рекламные расходы не окупаются. Рекомендуется снизить ставки или поставить на паузу.',
                             'linkPath': '/wb/ads', 'metricDelta': round(drr, 2)})

    cur.execute(
        """WITH latest AS (SELECT MAX(snapshot_date) AS d FROM wb_stocks WHERE user_id=%s),
                stock AS (SELECT nm_id, MAX(subject) AS subj, MAX(supplier_article) AS art, SUM(quantity) AS qty
                          FROM wb_stocks, latest WHERE user_id=%s AND snapshot_date=latest.d GROUP BY nm_id),
                daily AS (SELECT nm_id, COUNT(*)::NUMERIC / 14 AS rate
                          FROM wb_sales WHERE user_id=%s AND sale_date >= %s AND is_return=FALSE GROUP BY nm_id)
           SELECT s.nm_id, s.subj, s.art, s.qty, COALESCE(d.rate, 0) AS rate
           FROM stock s LEFT JOIN daily d USING (nm_id) WHERE s.qty > 0 AND COALESCE(d.rate, 0) > 0.5""",
        (user_id, user_id, user_id, p1_from),
    )
    for r in cur.fetchall():
        qty = int(r['qty']); rate = float(r['rate'])
        days_left = qty / rate if rate else 999
        if days_left < 10:
            insights.append({'tag': 'Риск', 'severity': 'warning',
                             'title': f'Товар {r["subj"]} ({r["art"]}) закончится через {round(days_left)} дн.',
                             'description': f'Остаток {qty} шт., средний расход {round(rate, 1)} шт/день. Пополните склад, чтобы не потерять позиции.',
                             'linkPath': '/wb/products', 'metricValue': round(days_left, 1)})

    cur.execute(
        """SELECT nm_id, SUM(sum_spent) AS spent, SUM(orders_sum) AS rev
           FROM wb_ads WHERE user_id=%s AND ad_date >= %s AND nm_id IS NOT NULL GROUP BY nm_id HAVING SUM(sum_spent) > 300""",
        (user_id, p1_from),
    )
    for r in cur.fetchall():
        sp = float(r['spent'] or 0); rv = float(r['rev'] or 0)
        if sp <= 0:
            continue
        roi = (rv - sp) / sp * 100
        if roi > 200 and sp < 5000:
            insights.append({'tag': 'Возможность', 'severity': 'success',
                             'title': f'Точка роста: товар nm {r["nm_id"]} — ROI {round(roi)}%',
                             'description': 'Рекламный бюджет невелик, но отдача высокая. Увеличение бюджета может дать пропорциональный рост выручки.',
                             'linkPath': '/wb/ads', 'metricValue': round(roi, 1)})

    return insights


# ===== Основной роутер =====

def handler(event: dict, context) -> dict:
    """WB API: единая точка входа для раздела аналитики Wildberries."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'status')

    dsn = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', '').strip()
    conn = psycopg2.connect(dsn, options=f'-c search_path={schema}' if schema else None)
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        # Публичные эндпоинты email-авторизации
        if action in ('email-register', 'email-login') and method == 'POST':
            body = json.loads(event.get('body') or '{}')
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            if not EMAIL_RE.match(email):
                return json_resp(400, {'error': 'Некорректный email'})
            if len(password) < 6:
                return json_resp(400, {'error': 'Пароль должен быть от 6 символов'})

            if action == 'email-register':
                cur.execute('SELECT id, password_hash FROM users WHERE email = %s', (email,))
                row = cur.fetchone()
                if row and row['password_hash']:
                    return json_resp(400, {'error': 'Email уже зарегистрирован. Войдите.'})
                ph = hash_password(password)
                if row:
                    cur.execute('UPDATE users SET password_hash = %s, last_login_at = CURRENT_TIMESTAMP WHERE id = %s', (ph, row['id']))
                    uid = row['id']
                else:
                    name = (body.get('name') or email.split('@')[0])[:100]
                    cur.execute(
                        "INSERT INTO users (email, name, email_verified, password_hash, last_login_at) VALUES (%s, %s, TRUE, %s, CURRENT_TIMESTAMP) RETURNING id",
                        (email, name, ph),
                    )
                    uid = cur.fetchone()['id']
                token = create_jwt(uid)
                cur.execute('SELECT id, email, name, avatar_url FROM users WHERE id = %s', (uid,))
                u = cur.fetchone()
                return json_resp(200, {
                    'access_token': token,
                    'expires_in': 30 * 24 * 3600,
                    'user': {'id': u['id'], 'email': u['email'], 'name': u['name'], 'avatar_url': u['avatar_url'], 'yandex_id': ''},
                })

            # email-login
            cur.execute('SELECT id, email, name, avatar_url, password_hash FROM users WHERE email = %s', (email,))
            row = cur.fetchone()
            if not row or not row['password_hash'] or not verify_password(password, row['password_hash']):
                return json_resp(401, {'error': 'Неверный email или пароль'})
            cur.execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = %s', (row['id'],))
            token = create_jwt(row['id'])
            return json_resp(200, {
                'access_token': token,
                'expires_in': 30 * 24 * 3600,
                'user': {'id': row['id'], 'email': row['email'], 'name': row['name'], 'avatar_url': row['avatar_url'], 'yandex_id': ''},
            })

        user_id = get_user_id(event.get('headers', {}))
        if not user_id:
            return json_resp(401, {'error': 'Требуется авторизация'})
        # Статус подключения
        if action == 'status' and method == 'GET':
            cur.execute(
                "SELECT status, token_last4, last_sync_at, sync_progress, created_at FROM wb_accounts WHERE user_id = %s",
                (user_id,),
            )
            row = cur.fetchone()
            if not row:
                return json_resp(200, {'connected': False})
            return json_resp(200, {
                'connected': True,
                'status': row['status'], 'tokenLast4': row['token_last4'],
                'lastSyncAt': row['last_sync_at'].isoformat() if row['last_sync_at'] else None,
                'syncProgress': row['sync_progress'] or 0,
                'createdAt': row['created_at'].isoformat() if row['created_at'] else None,
            })

        # Подключить токен
        if action == 'connect' and method == 'POST':
            body = json.loads(event.get('body') or '{}')
            token = (body.get('token') or '').strip()
            if len(token) < 20:
                return json_resp(400, {'error': 'Токен слишком короткий'})
            check = verify_wb_token(token)
            if not check.get('valid'):
                return json_resp(400, {'error': check.get('error', 'Токен недействителен')})
            fernet = get_fernet()
            encrypted = fernet.encrypt(token.encode()).decode()
            last4 = token[-4:]
            cur.execute(
                """INSERT INTO wb_accounts (user_id, token_encrypted, token_last4, status, updated_at)
                   VALUES (%s, %s, %s, 'connected', CURRENT_TIMESTAMP)
                   ON CONFLICT (user_id) DO UPDATE SET
                     token_encrypted = EXCLUDED.token_encrypted, token_last4 = EXCLUDED.token_last4,
                     status = 'connected', updated_at = CURRENT_TIMESTAMP""",
                (user_id, encrypted, last4),
            )
            return json_resp(200, {'success': True, 'tokenLast4': last4, 'warning': check.get('warning')})

        # Отключить
        if action == 'disconnect' and method == 'DELETE':
            for t in ('wb_accounts', 'wb_orders', 'wb_sales', 'wb_stocks', 'wb_ads', 'wb_insights', 'wb_forecast_cache'):
                cur.execute(f'DELETE FROM {t} WHERE user_id = %s', (user_id,))
            return json_resp(200, {'success': True})

        # Синхронизация
        if action == 'sync' and method == 'POST':
            cur.execute('SELECT token_encrypted FROM wb_accounts WHERE user_id = %s', (user_id,))
            row = cur.fetchone()
            if not row:
                return json_resp(400, {'error': 'Кабинет не подключён'})
            cur.execute("UPDATE wb_accounts SET status='syncing', sync_progress=10 WHERE user_id=%s", (user_id,))
            try:
                token = decrypt_token(row['token_encrypted'])
                real_count = sync_real_wb(cur, user_id, token)
            except Exception as e:
                cur.execute("UPDATE wb_accounts SET status='error', sync_progress=0 WHERE user_id=%s", (user_id,))
                return json_resp(500, {'error': f'Ошибка синхронизации: {e}'})
            cur.execute(
                "UPDATE wb_accounts SET status='connected', sync_progress=100, last_sync_at=CURRENT_TIMESTAMP WHERE user_id=%s",
                (user_id,),
            )
            return json_resp(200, {'success': True, 'rows': real_count})

        # Проверка что данные есть
        cur.execute('SELECT COUNT(*) AS c FROM wb_sales WHERE user_id=%s', (user_id,))
        if cur.fetchone()['c'] == 0 and action in ('dashboard', 'sales', 'products', 'ads', 'forecast', 'insights'):
            return json_resp(200, {'empty': True})

        df, dt, pf, pt, days = parse_period(params)

        if action == 'dashboard':
            return json_resp(200, {
                'period': {'from': df.isoformat(), 'to': dt.isoformat(), 'days': days},
                'kpi': kpi_with_delta(cur, user_id, df, dt, pf, pt),
                'series': series_by_day(cur, user_id, df, dt),
                'expenses': expense_breakdown(cur, user_id, df, dt),
                'topProducts': top_products(cur, user_id, df, dt, 5),
            })

        if action == 'sales':
            return json_resp(200, {
                'period': {'from': df.isoformat(), 'to': dt.isoformat(), 'days': days},
                'series': series_by_day(cur, user_id, df, dt),
                'calendar': sales_calendar(cur, user_id, df, dt),
                'regions': sales_regions(cur, user_id, df, dt),
                'warehouses': warehouses_breakdown(cur, user_id, df, dt),
                'kpi': kpi_with_delta(cur, user_id, df, dt, pf, pt),
            })

        if action == 'products':
            return json_resp(200, {
                'period': {'from': df.isoformat(), 'to': dt.isoformat(), 'days': days},
                'products': products_full(cur, user_id, df, dt),
            })

        if action == 'product':
            nm = int(params.get('nmId', 0))
            cur.execute(
                """SELECT sale_date, COUNT(*) AS orders, COALESCE(SUM(price_with_disc),0) AS rev, COALESCE(SUM(for_pay),0) AS pay
                   FROM wb_sales WHERE user_id=%s AND nm_id=%s AND sale_date BETWEEN %s AND %s AND is_return=FALSE
                   GROUP BY sale_date ORDER BY sale_date""",
                (user_id, nm, df, dt),
            )
            series = [{'date': r['sale_date'].isoformat(), 'orders': int(r['orders']),
                       'revenue': float(r['rev']), 'forPay': float(r['pay'])} for r in cur.fetchall()]
            cur.execute(
                """SELECT warehouse, SUM(quantity) AS qty FROM wb_stocks
                   WHERE user_id=%s AND nm_id=%s AND snapshot_date=(SELECT MAX(snapshot_date) FROM wb_stocks WHERE user_id=%s)
                   GROUP BY warehouse""",
                (user_id, nm, user_id),
            )
            stocks = [{'warehouse': r['warehouse'], 'qty': int(r['qty'] or 0)} for r in cur.fetchall()]
            return json_resp(200, {'nmId': nm, 'series': series, 'stocks': stocks})

        if action == 'ads':
            return json_resp(200, {
                'period': {'from': df.isoformat(), 'to': dt.isoformat(), 'days': days},
                **ads_analytics(cur, user_id, df, dt),
            })

        if action == 'forecast':
            horizon = max(7, min(int(params.get('horizon', 30)), 90))
            body = json.loads(event.get('body') or '{}') if event.get('body') else {}
            ad_mult = float(body.get('adMultiplier', 1.0))
            price_mult = float(body.get('priceMultiplier', 1.0))
            result = build_forecast(cur, user_id, horizon, ad_mult, price_mult)
            if result is None:
                return json_resp(200, {'empty': True})
            return json_resp(200, result)

        if action == 'insights':
            ins = build_insights(cur, user_id)
            cur.execute('DELETE FROM wb_insights WHERE user_id = %s', (user_id,))
            for i in ins:
                cur.execute(
                    """INSERT INTO wb_insights (user_id, tag, severity, title, description, metric_value, metric_delta, link_path)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (user_id, i['tag'], i['severity'], i['title'], i.get('description'),
                     i.get('metricValue'), i.get('metricDelta'), i.get('linkPath')),
                )
            return json_resp(200, {'insights': ins, 'count': len(ins)})

        return json_resp(400, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()