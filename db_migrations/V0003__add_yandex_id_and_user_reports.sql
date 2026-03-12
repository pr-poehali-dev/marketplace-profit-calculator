ALTER TABLE users ADD COLUMN IF NOT EXISTS yandex_id VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_users_yandex_id ON users(yandex_id);

CREATE TABLE IF NOT EXISTS user_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    product_data JSONB NOT NULL,
    calculation_result JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_reports_user_id ON user_reports(user_id);