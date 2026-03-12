"""
AI-консультант для калькулятора маркетплейса.
Отвечает на вопросы о стоимости доставки, хранения, габаритах товаров и ценообразовании.
"""
import json
import os
import urllib.request
import urllib.error


SYSTEM_PROMPT = """Ты — эксперт по продажам на российских маркетплейсах (Wildberries, Ozon, Яндекс Маркет).
Помогаешь продавцам разобраться с:
- стоимостью доставки и логистики (FBO/FBS)
- тарифами хранения на складе
- требованиями к упаковке и габаритам
- ценообразованием и рекомендуемой розничной ценой
- комиссиями маркетплейсов
- выкупаемостью и возвратами

Отвечай кратко и по делу. Указывай конкретные цифры и диапазоны, когда это возможно.
Если вопрос не связан с маркетплейсами — вежливо перенаправь к теме."""


def handler(event: dict, context) -> dict:
    """Обработчик запросов к AI-консультанту по маркетплейсам"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    api_key = os.environ.get('OPENAI_API_KEY', '')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'API ключ не настроен'}, ensure_ascii=False),
        }

    body = json.loads(event.get('body') or '{}')
    messages = body.get('messages', [])
    product_context = body.get('productContext', '')

    if not messages:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Нет сообщений'}, ensure_ascii=False),
        }

    system_content = SYSTEM_PROMPT
    if product_context:
        system_content += f"\n\nКонтекст текущего товара пользователя:\n{product_context}"

    chat_messages = [{'role': 'system', 'content': system_content}] + messages

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': chat_messages,
        'max_tokens': 800,
        'temperature': 0.7,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
        },
        method='POST',
    )

    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.loads(resp.read().decode('utf-8'))

    reply = result['choices'][0]['message']['content']

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'reply': reply}, ensure_ascii=False),
    }
