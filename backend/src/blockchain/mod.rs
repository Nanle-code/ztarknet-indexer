use ethers::prelude::*;
use std::sync::Arc;
use anyhow::Result;
use tokio::sync::broadcast;
use crate::models::Transaction as MonitoredTx;

pub async fn connect_provider(wss_url: &str) -> Result<Provider<Ws>> {
    let provider = Provider::<Ws>::connect(wss_url).await?;
    tracing::info!("✅ Connected to Pharos blockchain");
    Ok(provider)
}

pub async fn monitor_blocks(
    provider: Arc<Provider<Ws>>,
    tx_sender: broadcast::Sender<MonitoredTx>,
    pool: sqlx::PgPool,
) -> Result<()> {
    let mut stream = provider.subscribe_blocks().await?;
    
    tracing::info!("🔍 Monitoring Pharos blockchain...");
    
    while let Some(block) = stream.next().await {
        if let Some(block_number) = block.number {
            process_block(&provider, block_number, &tx_sender, &pool).await?;
        }
    }
    
    Ok(())
}

async fn process_block(
    provider: &Provider<Ws>,
    block_number: U64,
    tx_sender: &broadcast::Sender<MonitoredTx>,
    pool: &sqlx::PgPool,
) -> Result<()> {
    let block = provider
        .get_block_with_txs(block_number)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Block not found"))?;
    
    tracing::debug!("📦 Processing block {}", block_number);
    
    for tx in block.transactions {
        if let Ok(receipt) = provider.get_transaction_receipt(tx.hash).await {
            if let Some(receipt) = receipt {
                let monitored_tx = create_monitored_tx(&tx, &receipt, &block);
                
                // Save to database
                if let Err(e) = crate::database::insert_transaction(
                    pool, 
                    &monitored_tx
                ).await {
                    tracing::error!("Failed to save tx: {}", e);
                    continue;
                }
                
                // Broadcast to WebSocket clients
                let _ = tx_sender.send(monitored_tx);
            }
        }
    }
    
    Ok(())
}

fn create_monitored_tx(
    tx: &Transaction,
    receipt: &TransactionReceipt,
    block: &Block<Transaction>,
) -> MonitoredTx {
    let tx_type = classify_transaction(tx);
    let status = if receipt.status == Some(U64::from(1)) {
        "success"
    } else {
        "failed"
    };
    
    MonitoredTx {
        id: uuid::Uuid::new_v4(),
        tx_hash: format!("{:?}", tx.hash),
        tx_type,
        status: status.to_string(),
        from_address: format!("{:?}", tx.from),
        to_address: tx.to.map(|a| format!("{:?}", a)).unwrap_or_default(),
        amount: tx.value.to_string(),
        gas_used: receipt.gas_used.unwrap_or_default().as_u64() as i64,
        gas_price: tx.gas_price.unwrap_or_default().as_u64() as i64,
        block_number: block.number.unwrap_or_default().as_u64() as i64,
        block_timestamp: chrono::Utc::now(),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    }
}

fn classify_transaction(tx: &Transaction) -> String {
    // Function signature matching for Pharos dApps
    if let Some(data) = tx.input.get(..4) {
        let selector = format!("{:02x}{:02x}{:02x}{:02x}", 
            data[0], data[1], data[2], data[3]);
        
        match selector.as_str() {
            "38ed1739" => "swap".to_string(),      // swapExactTokensForTokens
            "a694fc3a" => "stake".to_string(),     // stake
            "c5eabedf" => "lend".to_string(),      // lend
            "e8eda9df" => "borrow".to_string(),    // borrow
            "e2bbb158" => "deposit".to_string(),   // addLiquidity
            _ => "transfer".to_string(),
        }
    } else {
        "transfer".to_string()
    }
}