use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, AccountId, Balance, PanicOnDefault, Promise, PromiseOrValue, PromiseResult};
use near_sdk::collections::{Map, Vector};
use near_sdk::json_types::U128;
use serde::{Deserialize, Serialize};
use near_sdk::serde_json;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct LoginCheckNFTs {
    nft_ownerships: Map<AccountId, Vector<String>>,
}

#[near_bindgen]
impl LoginCheckNFTs {
    #[init]
    pub fn new() -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self {
            nft_ownerships: Map::new(b"a"),
        }
    }

    pub fn login(&self, account_id: AccountId) -> bool {
        assert!(
            env::predecessor_account_id() == account_id,
            "Authentication failed: Account IDs do not match."
        );
        true
    }

    pub fn check_nfts(&mut self, account_id: AccountId) -> Promise {
        let nft_contract_account_id = "nft.example.near"; // Actual NFT contract account ID required

        ext_nft::nft_tokens_for_owner(
            account_id.clone(),
            &nft_contract_account_id,
            0, 
            env::prepaid_gas() / 2 
        )
        .then(
            Self::ext(env::current_account_id()).post_check_nfts(account_id)
        )
    }

    #[private]
    pub fn post_check_nfts(&mut self, account_id: AccountId) -> PromiseOrValue<Vec<String>> {
        let nfts = env::promise_result(0);
        match nfts {
            PromiseResult::Successful(result) => {
                let nfts: Vec<String> = serde_json::from_slice(&result).expect("Invalid NFT data");
                let filtered_nfts = nfts.into_iter().filter(|nft| {
                    // Specific filtering logic for NFTs
                    nft.contains("egg") && !nft.contains("single-owner")
                }).collect::<Vec<String>>();

                PromiseOrValue::Value(filtered_nfts)
            },
            _ => PromiseOrValue::Value(vec![])
        }
    }

    pub fn handle_microtransactions(&mut self, account_id: AccountId, amount: U128) -> Promise {
        assert!(amount.0 > 0, "Amount must be positive");
        // Reentrancy protection (basic example)
        let current_balance = env::account_balance();
        assert!(current_balance >= amount.0, "Insufficient balance for transaction");

        Promise::new(account_id).transfer(amount.0)
    }
}

// External trait for interacting with NFT contract
#[near_bindgen]
extern "C" {
    #[ext_contract(ext_nft)]
    pub trait ExtNFT {
        fn nft_tokens_for_owner(&self, account_id: AccountId) -> Vec<String>;
    }
}

near_sdk::setup_alloc!();
