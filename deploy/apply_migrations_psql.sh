#!/bin/bash
set -e

# Configuration
DB_HOST="35.187.223.4"
DB_USER="sugukuru_admin"
DB_NAME="sugukuru"
export PGPASSWORD="temporary-password-123"

echo "Applying SQL migrations to $DB_HOST (psql)..."

SQL_FILES=(
    "001_extensions.sql"
    "002_enums.sql"
    "003_organizations.sql"
    "004_people.sql"
    "005_employments_assignments.sql"
    "006_visa.sql"
    "007_deals.sql"
    "008_daily_operations.sql"
    "009_dispatch_slots.sql"
    "010_immigration_notices.sql"
    "011_kpi.sql"
    "012_documents.sql"
    "013_views.sql"
    "014_triggers.sql"
    "016_deal_proposals.sql"
    "017_notice_tracking.sql"
    "015_seed_data.sql"
)

for file in "${SQL_FILES[@]}"; do
    echo "Applying $file..."
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "sql/$file"
done

echo "Migrations complete!"
