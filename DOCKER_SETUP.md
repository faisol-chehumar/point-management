# Docker Database Setup Guide

## Overview

This project uses Docker to provide a consistent PostgreSQL database environment for local development. This eliminates the need to install PostgreSQL locally and ensures all developers work with the same database configuration.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

### 1. Start the Database
```bash
npm run docker:db:start
```

This will:
- Start a PostgreSQL 15 container
- Create the `saas_member_system` database
- Make it available on `localhost:5432`

### 2. Set up the Database Schema
```bash
npm run db:setup
```

This will:
- Generate Prisma client
- Run database migrations
- Seed the database with test data

### 3. Start Development
```bash
npm run dev
```

Or use the combined command:
```bash
npm run dev:full
```

## Available Commands

### Database Management
```bash
# Start database
npm run docker:db:start

# Stop database
npm run docker:db:stop

# Restart database
npm run docker:db:restart

# Check database status
npm run docker:db:status

# View database logs
npm run docker:db:logs

# Connect to database via psql
npm run docker:db:connect

# Create database backup
npm run docker:db:backup

# Reset database (WARNING: deletes all data)
npm run docker:db:reset
```

### Database Admin UI (Adminer)
```bash
# Start Adminer web interface
npm run docker:adminer
```

Then visit: http://localhost:8080

**Login credentials:**
- Server: `postgres`
- Username: `postgres`
- Password: `postgres123`
- Database: `saas_member_system`

## Configuration

### Database Connection
The database is configured in `.env.local`:
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/saas_member_system"
```

### Docker Compose Services

#### PostgreSQL Database
- **Image**: `postgres:15-alpine`
- **Port**: `5432`
- **Database**: `saas_member_system`
- **Username**: `postgres`
- **Password**: `postgres123`

#### Adminer (Database Admin)
- **Image**: `adminer:4.8.1`
- **Port**: `8080`
- **URL**: http://localhost:8080

## Data Persistence

Database data is persisted in a Docker volume named `postgres_data`. This means:
- Data survives container restarts
- Data is preserved when updating the container
- Use `npm run docker:db:reset` to completely reset data

## Troubleshooting

### Database Won't Start
1. Check if Docker is running:
   ```bash
   docker info
   ```

2. Check if port 5432 is already in use:
   ```bash
   lsof -i :5432
   ```

3. View database logs:
   ```bash
   npm run docker:db:logs
   ```

### Connection Issues
1. Ensure database is running:
   ```bash
   npm run docker:db:status
   ```

2. Test database connection:
   ```bash
   npm run db:test
   ```

3. Check environment variables in `.env.local`

### Reset Everything
If you encounter persistent issues:
```bash
# Stop all containers and remove volumes
docker-compose down -v

# Remove any orphaned containers
docker system prune

# Start fresh
npm run docker:db:start
npm run db:setup
```

## Development Workflow

### Daily Development
```bash
# Start your development session
npm run docker:db:start
npm run dev

# When done (optional - containers can stay running)
npm run docker:db:stop
```

### Database Changes
```bash
# After modifying prisma/schema.prisma
npm run db:generate
npm run db:migrate

# Or push changes directly (development only)
npm run db:push
```

### Testing
```bash
# Run authentication system tests
npx tsx scripts/test-auth-system.ts

# Run database connection test
npm run db:test
```

## Production Notes

This Docker setup is designed for **development only**. For production:

1. Use a managed database service (AWS RDS, Google Cloud SQL, etc.)
2. Use proper environment variables and secrets management
3. Configure proper backup and monitoring
4. Use connection pooling for better performance

## File Structure

```
├── docker-compose.yml          # Docker services configuration
├── docker/
│   └── init-db.sql            # Database initialization script
├── scripts/
│   └── docker-db.sh           # Database management script
├── .env.local                 # Local environment variables
└── .env.example               # Environment variables template
```

## Security Notes

The default credentials (`postgres:postgres123`) are for development only. Never use these in production environments.

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Docker and database logs
3. Ensure all prerequisites are installed
4. Try resetting the database completely