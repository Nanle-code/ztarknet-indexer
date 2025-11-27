use crate::models::{Alert, Transaction, TransactionStats};
use anyhow::Result;
use sqlx::{PgPool, postgres::PgPoolOptions};

pub async fn create_pool(database_url: &str) -> Result<PgPool> {
    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(database_url)
        .await?;
    
    tracing::info!("✅ Database connection pool created");
    Ok(pool)
}

pub async fn insert_transaction(
    pool: &PgPool,
    tx: &Transaction,
) -> Result<()> {
    sqlx::query!(
        r#"
        INSERT INTO monitored_transactions 
        (id, tx_hash, tx_type, status, from_address, to_address, 
         amount, gas_used, gas_price, block_number, block_timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (tx_hash) DO NOTHING
        "#,
        tx.id,
        tx.tx_hash,
        tx.tx_type,
        tx.status,
        tx.from_address,
        tx.to_address,
        tx.amount,
        tx.gas_used,
        tx.gas_price,
        tx.block_number,
        tx.block_timestamp
    )
    .execute(pool)
    .await?;
    
    Ok(())
}

pub async fn get_transactions(
    pool: &PgPool,
    status: Option<String>,
    tx_type: Option<String>,
    limit: i64,
    offset: i64,
) -> Result<Vec<Transaction>> {
    let mut query = String::from(
        "SELECT * FROM monitored_transactions WHERE 1=1"
    );
    
    if let Some(s) = status {
        query.push_str(&format!(" AND status = '{}'", s));
    }
    
    if let Some(t) = tx_type {
        query.push_str(&format!(" AND tx_type = '{}'", t));
    }
    
    query.push_str(&format!(
        " ORDER BY block_timestamp DESC LIMIT {} OFFSET {}",
        limit, offset
    ));
    
    let txs = sqlx::query_as::<_, Transaction>(&query)
        .fetch_all(pool)
        .await?;
    
    Ok(txs)
}

pub async fn get_stats(pool: &PgPool) -> Result<TransactionStats> {
    let record = sqlx::query!(
        r#"
        SELECT 
            COUNT(*) as "total_txs!",
            (COUNT(*) FILTER (WHERE status = 'success')::float / 
             NULLIF(COUNT(*), 0) * 100) as "success_rate",
            (COUNT(*) FILTER (WHERE status = 'failed')::float / 
             NULLIF(COUNT(*), 0) * 100) as "failed_rate",
            AVG(gas_used) as "avg_gas",
            SUM(CAST(amount AS DECIMAL)) as "total_vol",
            COUNT(DISTINCT from_address) as "active_users!"
        FROM monitored_transactions
        WHERE block_timestamp > NOW() - INTERVAL '1 hour'
        "#
    )
    .fetch_one(pool)
    .await?;
    
    let tps = record.total_txs as f64 / 3600.0;
    
    Ok(TransactionStats {
        total_txs: record.total_txs,
        success_rate: record.success_rate.unwrap_or(0.0),
        failed_rate: record.failed_rate.unwrap_or(0.0),
        avg_gas_used: record.avg_gas.unwrap_or(0.0),
        total_volume: record.total_vol
            .map(|v| v.to_string())
            .unwrap_or_else(|| "0".to_string()),
        active_users: record.active_users,
        tps,
    })
}

pub async fn insert_alert(pool: &PgPool, alert: &Alert) -> Result<()> {
    sqlx::query!(
        r#"
        INSERT INTO alerts 
        (id, alert_type, severity, message, tx_hash, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        "#,
        alert.id,
        alert.alert_type,
        alert.severity,
        alert.message,
        alert.tx_hash,
        alert.metadata
    )
    .execute(pool)
    .await?;
    
    Ok(())
}

pub async fn get_alerts(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<Alert>> {
    let alerts = sqlx::query_as!(
        Alert,
        "SELECT * FROM alerts ORDER BY timestamp DESC LIMIT $1",
        limit
    )
    .fetch_all(pool)
    .await?;
    
    Ok(alerts)
}