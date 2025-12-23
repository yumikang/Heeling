#!/bin/bash

# Heeling Schedule Checker
# Runs every minute to check if any schedules should execute

PROJECT_ROOT="/root/heeling"
LOG_FILE="/root/heeling/logs/schedule-checker.log"
LOCK_FILE="/tmp/heeling-schedule-checker.lock"

# Create log directory if not exists
mkdir -p "$(dirname "$LOG_FILE")"

# Prevent concurrent runs
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "[$(date -Iseconds)] Another instance is running (PID: $PID)" >> "$LOG_FILE"
        exit 0
    else
        rm -f "$LOCK_FILE"
    fi
fi

echo $$ > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

cd "$PROJECT_ROOT" || exit 1

# Load environment
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Run the schedule checker
node scripts/check-schedules.js >> "$LOG_FILE" 2>&1
