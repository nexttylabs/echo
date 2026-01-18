-- db/init/01-init.sql
-- This script runs automatically when the PostgreSQL container starts for the first time

\echo 'Initializing Echo database...'

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE echo TO echo;

\echo 'Echo database initialized successfully!'
