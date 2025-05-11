-- Add active column to addresses table with default value true
ALTER TABLE addresses ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE; 