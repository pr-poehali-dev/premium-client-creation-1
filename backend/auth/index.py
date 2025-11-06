import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'register':
                email = body_data.get('email', '').strip()
                username = body_data.get('username', '').strip()
                password = body_data.get('password', '')
                
                if not email or not username or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заполните все поля'})
                    }
                
                cursor.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
                if cursor.fetchone():
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь уже существует'})
                    }
                
                cursor.execute("SELECT COUNT(*) as count FROM users")
                count_result = cursor.fetchone()
                user_uid = str(count_result['count'] + 1)
                
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                cursor.execute(
                    "INSERT INTO users (uid, email, username, password_hash) VALUES (%s, %s, %s, %s) RETURNING id, uid",
                    (user_uid, email, username, password_hash)
                )
                user = cursor.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'uid': user['uid'],
                        'username': username
                    })
                }
            
            elif action == 'login':
                username = body_data.get('username', '').strip()
                password = body_data.get('password', '')
                
                if not username or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заполните все поля'})
                    }
                
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                cursor.execute(
                    "SELECT id, uid, email, username FROM users WHERE username = %s AND password_hash = %s",
                    (username, password_hash)
                )
                user = cursor.fetchone()
                
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный логин или пароль'})
                    }
                
                cursor.execute(
                    "SELECT plan_type, expires_at FROM subscriptions WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
                    (user['id'],)
                )
                subscription = cursor.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'uid': user['uid'],
                        'email': user['email'],
                        'username': user['username'],
                        'subscription': {
                            'plan': subscription['plan_type'] if subscription else None,
                            'expiresAt': subscription['expires_at'].isoformat() if subscription and subscription['expires_at'] else None
                        } if subscription else None
                    })
                }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }