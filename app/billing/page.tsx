
import React from 'react';
import BillingDashboard from './BillingDashboard';
import { Pool } from 'pg';

// Initialize pool (Singleton pattern is better in production, but simplified here)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://sugukuru_admin:temporary-password-123@35.187.223.4/sugukuru",
});

async function getBillingData() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
        SELECT 
            billing_id,
            client_name,
            total_amount,
            TO_CHAR(billing_date, 'YYYY-MM-DD') as billing_date,
            target_month,
            status
        FROM billings 
        ORDER BY total_amount DESC
    `);
        return res.rows;
    } catch (e) {
        console.error(e);
        return [];
    } finally {
        client.release();
    }
}

export default async function BillingPage() {
    const data = await getBillingData();

    return (
        <div className="animate-fadeIn">
            <BillingDashboard data={data} />
        </div>
    );
}
