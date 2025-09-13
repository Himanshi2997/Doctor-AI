-- SQL to create a table for storing chat conversations as JSON
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    messages JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
