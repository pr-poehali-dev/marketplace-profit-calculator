CREATE TABLE IF NOT EXISTS wb_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_encrypted TEXT NOT NULL,
    token_last4 VARCHAR(8) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'connected',
    last_sync_at TIMESTAMP,
    sync_progress INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_wb_accounts_user ON wb_accounts(user_id);

CREATE TABLE IF NOT EXISTS wb_orders (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    order_dt TIMESTAMP NOT NULL,
    nm_id BIGINT NOT NULL,
    supplier_article VARCHAR(128),
    subject VARCHAR(256),
    category VARCHAR(256),
    brand VARCHAR(256),
    warehouse VARCHAR(128),
    region VARCHAR(128),
    price_with_disc NUMERIC(12,2),
    is_cancel BOOLEAN DEFAULT FALSE,
    srid VARCHAR(128),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wb_orders_user_date ON wb_orders(user_id, order_date);
CREATE INDEX IF NOT EXISTS idx_wb_orders_nm ON wb_orders(user_id, nm_id);
CREATE INDEX IF NOT EXISTS idx_wb_orders_srid ON wb_orders(srid);

CREATE TABLE IF NOT EXISTS wb_sales (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    sale_date DATE NOT NULL,
    sale_dt TIMESTAMP NOT NULL,
    nm_id BIGINT NOT NULL,
    supplier_article VARCHAR(128),
    subject VARCHAR(256),
    category VARCHAR(256),
    brand VARCHAR(256),
    warehouse VARCHAR(128),
    region VARCHAR(128),
    price_with_disc NUMERIC(12,2),
    for_pay NUMERIC(12,2),
    finished_price NUMERIC(12,2),
    commission_percent NUMERIC(6,2),
    is_return BOOLEAN DEFAULT FALSE,
    srid VARCHAR(128),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wb_sales_user_date ON wb_sales(user_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_wb_sales_nm ON wb_sales(user_id, nm_id);
CREATE INDEX IF NOT EXISTS idx_wb_sales_srid ON wb_sales(srid);

CREATE TABLE IF NOT EXISTS wb_stocks (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    snapshot_date DATE NOT NULL,
    nm_id BIGINT NOT NULL,
    supplier_article VARCHAR(128),
    subject VARCHAR(256),
    category VARCHAR(256),
    brand VARCHAR(256),
    warehouse VARCHAR(128),
    quantity INTEGER DEFAULT 0,
    quantity_full INTEGER DEFAULT 0,
    in_way_to_client INTEGER DEFAULT 0,
    in_way_from_client INTEGER DEFAULT 0,
    price NUMERIC(12,2),
    discount NUMERIC(6,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wb_stocks_user ON wb_stocks(user_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_wb_stocks_nm ON wb_stocks(user_id, nm_id);

CREATE TABLE IF NOT EXISTS wb_ads (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ad_date DATE NOT NULL,
    campaign_id BIGINT,
    campaign_name VARCHAR(256),
    campaign_type VARCHAR(64),
    nm_id BIGINT,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr NUMERIC(8,4),
    cpc NUMERIC(12,2),
    sum_spent NUMERIC(12,2) DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    orders_sum NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wb_ads_user_date ON wb_ads(user_id, ad_date);
CREATE INDEX IF NOT EXISTS idx_wb_ads_campaign ON wb_ads(user_id, campaign_id);

CREATE TABLE IF NOT EXISTS wb_insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    tag VARCHAR(32) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'info',
    title VARCHAR(512) NOT NULL,
    description TEXT,
    metric_value NUMERIC(14,4),
    metric_delta NUMERIC(14,4),
    nm_id BIGINT,
    link_path VARCHAR(256),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wb_insights_user ON wb_insights(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS wb_forecast_cache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    horizon_days INTEGER NOT NULL,
    metric VARCHAR(32) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, horizon_days, metric)
);

CREATE INDEX IF NOT EXISTS idx_wb_forecast_user ON wb_forecast_cache(user_id);