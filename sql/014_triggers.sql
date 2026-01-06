-- =============================================================================
-- 014_triggers.sql
-- 業務ロジックの自動トリガー（入管届出検知、売上集計など）
-- =============================================================================

-- 配置変更時の入管届出自動検知（サンプル）
CREATE OR REPLACE FUNCTION fn_detect_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.client_org_id <> NEW.client_org_id) THEN
        INSERT INTO immigration_notices (
            tenant_id, person_id, notice_type, trigger_event_type, trigger_event_id, event_date
        )
        SELECT 
            NEW.tenant_id, e.person_id, 'dispatch_site_change', 'assignment_change', NEW.assignment_id, CURRENT_DATE
        FROM employments e
        WHERE e.employment_id = NEW.employment_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assignment_change_notice
AFTER UPDATE ON assignments
FOR EACH ROW EXECUTE FUNCTION fn_detect_assignment_change();

-- 日次売上集計トリガー（日次稼働記録がconfirmedになったらサマリーを更新）
CREATE OR REPLACE FUNCTION fn_update_daily_revenue_summary()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_revenue_summary (
        tenant_id, summary_date, region, client_org_id, worker_count, total_hours, total_revenue
    )
    SELECT 
        NEW.tenant_id, NEW.operation_date, o.region, NEW.client_org_id, 1, NEW.worked_hours, NEW.total_revenue
    FROM organizations o WHERE o.org_id = NEW.client_org_id
    ON CONFLICT (tenant_id, summary_date, region, client_org_id) DO UPDATE SET
        worker_count = daily_revenue_summary.worker_count + 1,
        total_hours = daily_revenue_summary.total_hours + EXCLUDED.total_hours,
        total_revenue = daily_revenue_summary.total_revenue + EXCLUDED.total_revenue;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_confirmed_operation
AFTER INSERT ON daily_operations
FOR EACH ROW
WHEN (NEW.status = 'confirmed')
EXECUTE FUNCTION fn_update_daily_revenue_summary();
