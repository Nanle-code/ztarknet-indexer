// use starknet::core::types::{BlockId, BlockTag, MaybePendingBlockWithTxs, BlockWithTxs, FieldElement, Transaction};
// use starknet::providers::{Provider, SequencerGatewayProvider};
// use std::sync::Arc;
// use anyhow::Result;
// use tokio::sync::broadcast;
// use crate::models::Transaction as MonitoredTx;

// pub async fn connect_provider(_rpc_url: &str) -> Result<SequencerGatewayProvider> {
//     let provider = SequencerGatewayProvider::starknet_alpha_goerli();
//     tracing::info!("✅ Connected to Ztarknet blockchain");
//     Ok(provider)
// }

// pub async fn monitor_blocks(
//     provider: Arc<SequencerGatewayProvider>,
//     tx_sender: broadcast::Sender<MonitoredTx>,
//     pool: sqlx::PgPool,
// ) -> Result<()> {
//     tracing::info!("🔍 Monitoring Ztarknet blockchain...");
    
//     let mut last_block: u64 = 0;
    
//     loop {
//         match provider.get_block_with_txs(BlockId::Tag(BlockTag::Latest)).await {
//             Ok(maybe_block) => {
//                 match maybe_block {
//                     MaybePendingBlockWithTxs::Block(block) => {
//                         let block_number = block.block_number;
                        
//                         if block_number > last_block {
//                             tracing::debug!("📦 Processing block {}", block_number);
                            
//                             if let Err(e) = process_block(&block, &tx_sender, &pool).await {
//                                 tracing::error!("Error processing block {}: {}", block_number, e);
//                             }
                            
//                             last_block = block_number;
//                         }
//                     }
//                     MaybePendingBlockWithTxs::PendingBlock(_) => {
//                         continue;
//                     }
//                 }
//             }
//             Err(e) => {
//                 tracing::error!("Failed to fetch block: {}", e);
//             }
//         }
        
//         tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
//     }
// }

// async fn process_block(
//     block: &BlockWithTxs,
//     tx_sender: &broadcast::Sender<MonitoredTx>,
//     pool: &sqlx::PgPool,
// ) -> Result<()> {
//     let block_number = block.block_number;
//     let block_hash = block.block_hash;
//     let timestamp = block.timestamp;
    
//     for tx in &block.transactions {
//         let monitored_tx = create_monitored_tx(tx, block_number, block_hash, timestamp);
        
//         if let Err(e) = crate::database::insert_transaction(pool, &monitored_tx).await {
//             tracing::error!("Failed to save tx: {}", e);
//             continue;
//         }
        
//         let _ = tx_sender.send(monitored_tx);
//     }
    
//     Ok(())
// }

// fn create_monitored_tx(
//     tx: &Transaction,
//     block_number: u64,
//     _block_hash: FieldElement,
//     timestamp: u64,
// ) -> MonitoredTx {
//     let (tx_hash, tx_type, from_address, to_address, status) = match tx {
//         Transaction::Invoke(invoke_tx) => {
//             let hash = invoke_tx.transaction_hash();
//             let sender = match invoke_tx {
//                 starknet::core::types::InvokeTransaction::V0(v0) => v0.contract_address,
//                 starknet::core::types::InvokeTransaction::V1(v1) => v1.sender_address,
//                 starknet::core::types::InvokeTransaction::V3(v3) => v3.sender_address,
//             };
            
//             (
//                 *hash,
//                 "invoke".to_string(),
//                 format!("{:#x}", sender),
//                 "contract_call".to_string(),
//                 "success".to_string()
//             )
//         },
//         Transaction::Declare(declare_tx) => {
//             let hash = declare_tx.transaction_hash();
//             let sender = match declare_tx {
//                 starknet::core::types::DeclareTransaction::V0(v0) => v0.sender_address,
//                 starknet::core::types::DeclareTransaction::V1(v1) => v1.sender_address,
//                 starknet::core::types::DeclareTransaction::V2(v2) => v2.sender_address,
//                 starknet::core::types::DeclareTransaction::V3(v3) => v3.sender_address,
//             };
            
//             (
//                 *hash,
//                 "declare".to_string(),
//                 format!("{:#x}", sender),
//                 "contract_declaration".to_string(),
//                 "success".to_string()
//             )
//         },
//         Transaction::Deploy(deploy_tx) => (
//             deploy_tx.transaction_hash,
//             "deploy".to_string(),
//             "0x0".to_string(),
//             format!("{:#x}", deploy_tx.contract_address_salt),
//             "success".to_string()
//         ),
//         Transaction::DeployAccount(deploy_account_tx) => {
//             let hash = deploy_account_tx.transaction_hash();
//             let address = match deploy_account_tx {
//                 starknet::core::types::DeployAccountTransaction::V1(v1) => v1.contract_address_salt,
//                 starknet::core::types::DeployAccountTransaction::V3(v3) => v3.contract_address_salt,
//             };
            
//             (
//                 *hash,
//                 "deploy_account".to_string(),
//                 format!("{:#x}", address),
//                 format!("{:#x}", address),
//                 "success".to_string()
//             )
//         },
//         Transaction::L1Handler(l1_handler_tx) => (
//             l1_handler_tx.transaction_hash,
//             "l1_handler".to_string(),
//             format!("{:#x}", l1_handler_tx.contract_address),
//             "l1_message".to_string(),
//             "success".to_string()
//         ),
//     };
    
//     MonitoredTx {
//         id: uuid::Uuid::new_v4(),
//         tx_hash: format!("{:#x}", tx_hash),
//         tx_type,
//         status,
//         from_address,
//         to_address,
//         amount: "0".to_string(),
//         gas_used: 0,
//         gas_price: 0,
//         block_number: block_number as i64,
//         block_timestamp: chrono::DateTime::from_timestamp(timestamp as i64, 0)
//             .unwrap_or_else(|| chrono::Utc::now()),
//         created_at: chrono::Utc::now(),
//         updated_at: chrono::Utc::now(),
//     }
// }

use starknet::core::types::{BlockId, BlockTag, MaybePendingBlockWithTxs, BlockWithTxs, FieldElement, Transaction};
use starknet::providers::{Provider, SequencerGatewayProvider};
use std::sync::Arc;
use anyhow::Result;
use tokio::sync::broadcast;
use crate::models::Transaction as MonitoredTx;

pub async fn connect_provider(_rpc_url: &str) -> Result<SequencerGatewayProvider> {
    // For now, we'll use mock mode since Ztarknet isn't live
    tracing::warn!("⚠️  Running in MOCK MODE - Ztarknet not available yet");
    let provider = SequencerGatewayProvider::starknet_alpha_goerli();
    tracing::info!("✅ Connected to Ztarknet blockchain (Mock Mode)");
    Ok(provider)
}

pub async fn monitor_blocks(
    _provider: Arc<SequencerGatewayProvider>,
    tx_sender: broadcast::Sender<MonitoredTx>,
    pool: sqlx::PgPool,
) -> Result<()> {
    tracing::info!("🔍 Monitoring Ztarknet blockchain (Mock Mode)...");
    
    let mut block_num = 1000000u64;
    
    // Mock transaction generator for testing
    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
        
        block_num += 1;
        
        // Generate mock transaction
        let mock_tx = generate_mock_transaction(block_num);
        
        if let Err(e) = crate::database::insert_transaction(&pool, &mock_tx).await {
            tracing::error!("Failed to save mock tx: {}", e);
            continue;
        }
        
        tracing::debug!("📦 Generated mock block {}", block_num);
        let _ = tx_sender.send(mock_tx);
    }
}

fn generate_mock_transaction(block_number: u64) -> MonitoredTx {
    use rand::Rng;
    
    let mut rng = rand::thread_rng();
    
    let tx_types = vec!["invoke", "declare", "deploy", "deploy_account"];
    let statuses = vec!["success", "success", "success", "failed"]; // 75% success
    
    let tx_type = tx_types[rng.gen_range(0..tx_types.len())];
    let status = statuses[rng.gen_range(0..statuses.len())];
    
    let random_hash = format!("0x{:064x}", rng.gen::<u128>());
    let random_addr = format!("0x{:064x}", rng.gen::<u128>());
    
    MonitoredTx {
        id: uuid::Uuid::new_v4(),
        tx_hash: random_hash,
        tx_type: tx_type.to_string(),
        status: status.to_string(),
        from_address: random_addr.clone(),
        to_address: random_addr,
        amount: rng.gen_range(0..10000).to_string(),
        gas_used: rng.gen_range(20000..200000),
        gas_price: rng.gen_range(1..100),
        block_number: block_number as i64,
        block_timestamp: chrono::Utc::now(),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    }
}

// Keep the old functions for when real Ztarknet is available
#[allow(dead_code)]
async fn process_block(
    block: &BlockWithTxs,
    tx_sender: &broadcast::Sender<MonitoredTx>,
    pool: &sqlx::PgPool,
) -> Result<()> {
    let block_number = block.block_number;
    let block_hash = block.block_hash;
    let timestamp = block.timestamp;
    
    for tx in &block.transactions {
        let monitored_tx = create_monitored_tx(tx, block_number, block_hash, timestamp);
        
        if let Err(e) = crate::database::insert_transaction(pool, &monitored_tx).await {
            tracing::error!("Failed to save tx: {}", e);
            continue;
        }
        
        let _ = tx_sender.send(monitored_tx);
    }
    
    Ok(())
}

#[allow(dead_code)]
fn create_monitored_tx(
    tx: &Transaction,
    block_number: u64,
    _block_hash: FieldElement,
    timestamp: u64,
) -> MonitoredTx {
    let (tx_hash, tx_type, from_address, to_address, status) = match tx {
        Transaction::Invoke(invoke_tx) => {
            let hash = invoke_tx.transaction_hash();
            let sender = match invoke_tx {
                starknet::core::types::InvokeTransaction::V0(v0) => v0.contract_address,
                starknet::core::types::InvokeTransaction::V1(v1) => v1.sender_address,
                starknet::core::types::InvokeTransaction::V3(v3) => v3.sender_address,
            };
            
            (
                *hash,
                "invoke".to_string(),
                format!("{:#x}", sender),
                "contract_call".to_string(),
                "success".to_string()
            )
        },
        Transaction::Declare(declare_tx) => {
            let hash = declare_tx.transaction_hash();
            let sender = match declare_tx {
                starknet::core::types::DeclareTransaction::V0(v0) => v0.sender_address,
                starknet::core::types::DeclareTransaction::V1(v1) => v1.sender_address,
                starknet::core::types::DeclareTransaction::V2(v2) => v2.sender_address,
                starknet::core::types::DeclareTransaction::V3(v3) => v3.sender_address,
            };
            
            (
                *hash,
                "declare".to_string(),
                format!("{:#x}", sender),
                "contract_declaration".to_string(),
                "success".to_string()
            )
        },
        Transaction::Deploy(deploy_tx) => (
            deploy_tx.transaction_hash,
            "deploy".to_string(),
            "0x0".to_string(),
            format!("{:#x}", deploy_tx.contract_address_salt),
            "success".to_string()
        ),
        Transaction::DeployAccount(deploy_account_tx) => {
            let hash = deploy_account_tx.transaction_hash();
            let address = match deploy_account_tx {
                starknet::core::types::DeployAccountTransaction::V1(v1) => v1.contract_address_salt,
                starknet::core::types::DeployAccountTransaction::V3(v3) => v3.contract_address_salt,
            };
            
            (
                *hash,
                "deploy_account".to_string(),
                format!("{:#x}", address),
                format!("{:#x}", address),
                "success".to_string()
            )
        },
        Transaction::L1Handler(l1_handler_tx) => (
            l1_handler_tx.transaction_hash,
            "l1_handler".to_string(),
            format!("{:#x}", l1_handler_tx.contract_address),
            "l1_message".to_string(),
            "success".to_string()
        ),
    };
    
    MonitoredTx {
        id: uuid::Uuid::new_v4(),
        tx_hash: format!("{:#x}", tx_hash),
        tx_type,
        status,
        from_address,
        to_address,
        amount: "0".to_string(),
        gas_used: 0,
        gas_price: 0,
        block_number: block_number as i64,
        block_timestamp: chrono::DateTime::from_timestamp(timestamp as i64, 0)
            .unwrap_or_else(|| chrono::Utc::now()),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    }
}