# Makefile

.PHONY: help dev build up down restart logs db-migrate db-backup

help:  ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev:  ## Start development environment
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development environment started!"
	@echo "App: http://localhost:3000"
	@echo "Database: postgresql://echo:echo@localhost:5432/echo_dev"

build:  ## Build production images
	docker-compose build

up:  ## Start production environment
	docker-compose up -d
	@echo "Production environment started!"
	@echo "App: http://localhost:3000"

down:  ## Stop all containers
	docker-compose down

restart:  ## Restart all containers
	docker-compose restart

logs:  ## Show logs from all containers
	docker-compose logs -f

logs-app:  ## Show logs from app container
	docker-compose logs -f app

logs-db:  ## Show logs from database container
	docker-compose logs -f postgres

db-migrate:  ## Run database migrations
	docker-compose exec app bunx drizzle-kit migrate

db-backup:  ## Backup database (Docker)
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U echo echo > backups/backup-$$(date +%Y%m%d-%H%M%S).sql
	@echo "Backup completed!"

db-restore:  ## Restore database (usage: make db-restore FILE=backups/backup.sql)
	docker-compose exec -T postgres psql -U echo echo < $(FILE)

backup:  ## Create database backup (local)
	@echo "Creating backup..."
	./scripts/backup-db.sh

backup-ts:  ## Create database backup using TypeScript
	bun run scripts/backup-db.ts

restore:  ## Restore database (usage: make restore FILE=backups/echo-20240101-020000.sql.gz)
	./scripts/restore-db.sh $(FILE)

list-backups:  ## List all backups
	@echo "Available backups:"
	@ls -lh backups/echo-*.sql.gz 2>/dev/null || echo "No backups found"

db-shell:  ## Open database shell
	docker-compose exec postgres psql -U echo echo

shell:  ## Open app container shell
	docker-compose exec app sh

clean:  ## Remove all containers, volumes, and images
	docker-compose down -v --rmi all
	@echo "Everything cleaned up!"

dev-watch:  ## Start development with hot reload
	@echo "Starting development server with hot reload..."
	bun run dev
