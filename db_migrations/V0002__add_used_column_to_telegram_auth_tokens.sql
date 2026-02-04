-- Добавляем колонку used для отслеживания использованных токенов
ALTER TABLE telegram_auth_tokens 
ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT FALSE;