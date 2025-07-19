#!/bin/bash

# Docker Database Management Script for SaaS Member System

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to start the database
start_db() {
    print_status "Starting PostgreSQL database with Docker Compose..."
    check_docker
    
    if docker-compose ps | grep -q "saas-member-system-db.*Up"; then
        print_warning "Database is already running"
        return 0
    fi
    
    docker-compose up -d postgres
    
    print_status "Waiting for database to be ready..."
    timeout=60
    counter=0
    
    while [ $counter -lt $timeout ]; do
        if docker-compose exec -T postgres pg_isready -U postgres -d saas_member_system > /dev/null 2>&1; then
            print_success "Database is ready!"
            return 0
        fi
        sleep 2
        counter=$((counter + 2))
        echo -n "."
    done
    
    print_error "Database failed to start within $timeout seconds"
    exit 1
}

# Function to stop the database
stop_db() {
    print_status "Stopping database..."
    check_docker
    docker-compose down
    print_success "Database stopped"
}

# Function to restart the database
restart_db() {
    print_status "Restarting database..."
    stop_db
    start_db
}

# Function to show database status
status_db() {
    check_docker
    print_status "Database status:"
    docker-compose ps
}

# Function to show database logs
logs_db() {
    check_docker
    print_status "Database logs:"
    docker-compose logs -f postgres
}

# Function to connect to database
connect_db() {
    check_docker
    print_status "Connecting to database..."
    docker-compose exec postgres psql -U postgres -d saas_member_system
}

# Function to backup database
backup_db() {
    check_docker
    backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    print_status "Creating database backup: $backup_file"
    docker-compose exec -T postgres pg_dump -U postgres saas_member_system > "$backup_file"
    print_success "Backup created: $backup_file"
}

# Function to restore database
restore_db() {
    if [ -z "$1" ]; then
        print_error "Please provide backup file path"
        print_status "Usage: $0 restore <backup_file.sql>"
        exit 1
    fi
    
    check_docker
    print_status "Restoring database from: $1"
    docker-compose exec -T postgres psql -U postgres -d saas_member_system < "$1"
    print_success "Database restored from: $1"
}

# Function to reset database
reset_db() {
    check_docker
    print_warning "This will delete all data in the database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting database..."
        docker-compose down -v
        docker-compose up -d postgres
        print_status "Waiting for database to be ready..."
        sleep 10
        print_success "Database reset complete"
    else
        print_status "Database reset cancelled"
    fi
}

# Function to start Adminer (database admin UI)
start_adminer() {
    check_docker
    print_status "Starting Adminer (Database Admin UI)..."
    docker-compose up -d adminer
    print_success "Adminer is running at http://localhost:8080"
    print_status "Login with:"
    print_status "  Server: postgres"
    print_status "  Username: postgres"
    print_status "  Password: postgres123"
    print_status "  Database: saas_member_system"
}

# Function to show help
show_help() {
    echo "Docker Database Management Script"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  start     - Start the PostgreSQL database"
    echo "  stop      - Stop the database"
    echo "  restart   - Restart the database"
    echo "  status    - Show database status"
    echo "  logs      - Show database logs"
    echo "  connect   - Connect to database via psql"
    echo "  backup    - Create database backup"
    echo "  restore   - Restore database from backup file"
    echo "  reset     - Reset database (WARNING: deletes all data)"
    echo "  adminer   - Start Adminer (database admin UI)"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 backup"
    echo "  $0 restore backup_20240101_120000.sql"
}

# Main script logic
case "$1" in
    start)
        start_db
        ;;
    stop)
        stop_db
        ;;
    restart)
        restart_db
        ;;
    status)
        status_db
        ;;
    logs)
        logs_db
        ;;
    connect)
        connect_db
        ;;
    backup)
        backup_db
        ;;
    restore)
        restore_db "$2"
        ;;
    reset)
        reset_db
        ;;
    adminer)
        start_adminer
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac