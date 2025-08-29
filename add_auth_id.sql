-- Add auth_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id VARCHAR(255) UNIQUE;