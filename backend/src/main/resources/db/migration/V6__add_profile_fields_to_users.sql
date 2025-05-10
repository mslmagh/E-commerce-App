-- Add new profile fields to users table
ALTER TABLE users
ADD COLUMN first_name VARCHAR(50) NULL,
ADD COLUMN last_name VARCHAR(50) NULL,
ADD COLUMN phone_number VARCHAR(20) NULL;

-- Consider adding unique constraint for phone_number if needed
-- ALTER TABLE users ADD CONSTRAINT uk_phone_number UNIQUE (phone_number); 