CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(64),
    first_name VARCHAR(128) NOT NULL,
    age INTEGER NOT NULL CHECK (age BETWEEN 18 AND 80),
    gender VARCHAR(8) NOT NULL,
    interests TEXT[] NOT NULL DEFAULT '{}',
    goal TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    activity_type VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    time_type VARCHAR(16) NOT NULL,
    scheduled_at TIMESTAMPTZ,
    looking_gender VARCHAR(8) DEFAULT 'any',
    looking_goal TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(16) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);

CREATE TABLE IF NOT EXISTS responses (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES requests(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(16) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(request_id, user_id)
);

CREATE TABLE IF NOT EXISTS matches (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES requests(id),
    user_id_1 BIGINT NOT NULL REFERENCES users(id),
    user_id_2 BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
