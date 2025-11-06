import json
import os
from typing import Dict, Any
import urllib.parse

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Generate payment links with prefilled amount and description
    Args: event - dict with httpMethod, body containing payment_method, amount, plan_name
          context - object with request_id attribute
    Returns: HTTP response with payment URL
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        payment_method = body_data.get('payment_method', '')
        amount = body_data.get('amount', 0)
        plan_name = body_data.get('plan_name', '')
        user_id = body_data.get('user_id', '')
        
        description = f"AstrixClient - {plan_name}"
        
        payment_url = ''
        
        if payment_method == 'yoomoney':
            receiver = '4100118286472489'
            quickpay_form = 'shop'
            targets = urllib.parse.quote(description)
            sum_param = str(amount)
            label = f"user_{user_id}_plan_{plan_name}"
            
            payment_url = f"https://yoomoney.ru/quickpay/confirm.xml?receiver={receiver}&quickpay-form={quickpay_form}&targets={targets}&sum={sum_param}&label={label}&successURL=https://astrixclient.ru/success"
            
        elif payment_method == 'yookassa':
            payment_url = f"https://yookassa.ru/integration/simplepay/payment?shopId=YOUR_SHOP_ID&sum={amount}&customerNumber={user_id}&purpose={urllib.parse.quote(description)}"
            
        elif payment_method == 'sber':
            payment_url = f"https://securepayments.sberbank.ru/payment/merchants/sbersafe/payment_ru.html?mdOrder=YOUR_ORDER&amount={amount * 100}"
            
        elif payment_method == 'tbank':
            payment_url = f"https://securepay.tinkoff.ru/v2/Init?TerminalKey=YOUR_TERMINAL&Amount={amount * 100}&Description={urllib.parse.quote(description)}"
            
        elif payment_method == 'psp':
            payment_url = f"https://psp.ru/pay?amount={amount}&description={urllib.parse.quote(description)}"
            
        elif payment_method == 'crypto':
            payment_url = f"https://www.binance.com/en/buy-sell-crypto"
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'payment_url': payment_url,
                'amount': amount,
                'description': description
            })
        }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'})
    }