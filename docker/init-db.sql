-- Initialize the database
-- This script runs when the PostgreSQL container starts for the first time

-- Create the main database (already created by POSTGRES_DB env var)
-- CREATE DATABASE saas_member_system;

-- Create a test database for running tests
CREATE DATABASE saas_member_system_test;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE saas_member_system TO postgres;
GRANT ALL PRIVILEGES ON DATABASE saas_member_system_test TO postgres;