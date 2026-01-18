#!/bin/bash
# scripts/backup-db.sh

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS=${RETENTION_DAYS:-30}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/echo-$TIMESTAMP.sql"
DATABASE_URL="${DATABASE_URL:-postgresql://echo:changeme@localhost:5432/echo}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

mkdir -p "$BACKUP_DIR"

log_info "Starting database backup..."
log_info "Backup file: $BACKUP_FILE"

if pg_dump "$DATABASE_URL" > "$BACKUP_FILE"; then
    log_info "Backup completed successfully"

    gzip "$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_FILE.gz"
    log_info "Backup compressed: $BACKUP_FILE"

    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "Backup size: $FILE_SIZE"

    log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    DELETED=$(find "$BACKUP_DIR" -name "echo-*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
    log_info "Deleted $DELETED old backup(s)"

    log_info "Current backups:"
    ls -lh "$BACKUP_DIR"/echo-*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' || echo "  No backups found"

    log_info "Backup process completed!"
else
    log_error "Backup failed!"
    exit 1
fi
