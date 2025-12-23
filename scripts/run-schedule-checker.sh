#!/bin/bash
# Schedule Checker Runner
# This script is called by cron every minute

cd /root/heeling/backend

# Load environment variables
export DATABASE_URL='postgresql://heeling:postgrespassword@localhost:5432/heeling_db?schema=public'
export NEXTAUTH_SECRET='super_secret_key_change_me'
export JWT_SECRET='heeling-admin-jwt-secret-change-in-production'
export NODE_ENV='production'
export CRON_SECRET='heeling-cron-secret-2024'
export API_URL='https://heeling.one-q.xyz'
export NODE_PATH=/root/heeling/backend/node_modules

# Run from backend directory
node /root/heeling/scripts/check-schedules.js
