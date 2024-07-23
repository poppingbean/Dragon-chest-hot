use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, AccountId, Balance, PanicOnDefault, Promise, PromiseOrValue, Timestamp};
use near_sdk::collections::{Map, Vector};
use near_sdk::json_types::U128;
use serde::{Deserialize, Serialize};

// Assumptions: This script assumes the existence of certain external NFT contract functionalities
// which may need adjustments based on the specific NFT contract being interacted with.

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct EggIncubator {
    incubating_nfts: Map<AccountId, Vector<NFTData>>,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
pub struct NFTData {
    token_id: String,
    metadata: NFTMetadata,
    incubation_start: Timestamp,
    incubation_end: Option<Timestamp>,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
pub struct NFTMetadata {
    title: String,
    description: String,
    media: String,
}

#[near_bindgen]
impl EggIncubator {
    #[init]
    pub fn new() -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self {
            incubating_nfts: Map::new(b"b"),
        }
    }

    pub fn select_nft_for_incubation(&mut self, account_id: AccountId, token_id: String, metadata: NFTMetadata) {
        let nft_contract_account_id = "nft.example.near"; // Replace with actual NFT contract account ID

        // Transfer the NFT to the contract. Handle potential failures.
        let transfer_promise = ext_nft::transfer(
            account_id.clone(),
            env::current_account_id(),
            token_id.clone(),
            &nft_contract_account_id,
            1, // Attached deposit (if required by the NFT contract)
            env::prepaid_gas() / 2 // Attach half of the available gas
        );

        // Assuming the transfer is successful, proceed to mark the NFT as incubating.
        transfer_promise.then(
            Self::ext(env::current_account_id()).mark_as_incubating(account_id, token_id, metadata)
        );
    }

    #[private]
    pub fn mark_as_incubating(&mut self, account_id: AccountId, token_id: String, metadata: NFTMetadata) {
        let nft_data = NFTData {
            token_id,
            metadata,
            incubation_start: env::block_timestamp(),
            incubation_end: None,
        };

        let mut user_nfts = self.incubating_nfts.get(&account_id).unwrap_or_else(Vector::new);
        user_nfts.push(&nft_data);
        self.incubating_nfts.insert(&account_id, &user_nfts);
    }

    pub fn update_metadata_artwork(&mut self, account_id: AccountId, token_id: String, new_metadata: NFTMetadata) {
        // Validate that the caller is authorized to update metadata
        assert!(self.incubating_nfts.get(&account_id).unwrap_or_default().iter().any(|nft| nft.token_id == token_id), "Unauthorized or invalid NFT");

        let nft_contract_account_id = "nft.example.near"; // Replace with actual NFT contract account ID

        ext_nft::update_metadata(
            token_id.clone(),
            new_metadata,
            &nft_contract_account_id,
            0, // Attached deposit (if required by the NFT contract)
            env::prepaid_gas() / 2 // Attach half of the available gas
        );
    }
}

#[near_bindgen]
extern "C" {
    #[ext_contract(ext_nft)]
    pub trait ExtNFT {
        fn transfer(&self, from_id: AccountId, to_id: AccountId, token_id: String);
        fn update_metadata(&self, token_id: String, metadata: NFTMetadata);
    }
}

near_sdk::setup_alloc!();
