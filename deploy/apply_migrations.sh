#!/bin/bash
set -e

PROJECT_ID="sugukuru7"
INSTANCE_ID="sugukuru7-db"
DB_USER="sugukuru_admin"
DB_NAME="sugukuru"

echo "Applying SQL migrations to $INSTANCE_ID..."

# List of SQL files in order
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
    # Note: This might require entering the password if not set in environment
    # Using gcloud sql connect is interactive, so we might need a different approach for non-interactive
    # However, since we are in a terminal, it might prompt.
    gcloud sql connect $INSTANCE_ID --user=$DB_USER --database=$DB_NAME < "sql/$file"
done

echo "Migrations complete!"
