CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT PRIMARY KEY,
    wallet_address VARCHAR(128) NOT NULL,
    asset VARCHAR(20) NOT NULL,
    amount NUMERIC(30, 18) NOT NULL CHECK (amount > 0),
    direction VARCHAR(3) NOT NULL CHECK (direction IN ('IN', 'OUT'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_address
    ON transactions (wallet_address);

INSERT INTO transactions (id, wallet_address, asset, amount, direction) VALUES
    (1, '0xabc', 'ETH', 1.25, 'IN'),
    (2, '0xabc', 'USDT', 30.50, 'OUT'),
    (3, '0xdef', 'ETH', 2.00, 'IN'),
    (4, '0xabc', 'ETH', 0.75, 'OUT')
ON CONFLICT (id) DO NOTHING;
