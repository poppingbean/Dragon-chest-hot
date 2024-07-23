use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, AccountId, PanicOnDefault};
use near_sdk::collections::Map;
use serde::{Deserialize, Serialize};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct LeaderboardContract {
    user_achievements: Map<AccountId, UserAchievement>,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
pub struct UserAchievement {
    eggs_hatched: u32,
    fastest_hatch_time: u64,
}

#[near_bindgen]
impl LeaderboardContract {
    #[init]
    pub fn new() -> Self {
        assert!(!env::state_exists(), "Contract is already initialized");
        Self {
            user_achievements: Map::new(b"c"),
        }
    }

    pub fn update_leaderboard(&mut self, account_id: AccountId, eggs_hatched: u32, fastest_hatch_time: u64) {
        assert!(eggs_hatched > 0, "Eggs hatched must be greater than zero");
        assert!(fastest_hatch_time > 0, "Fastest hatch time must be greater than zero");

        let mut achievement = self.user_achievements.get(&account_id).unwrap_or_else(|| UserAchievement {
            eggs_hatched: 0,
            fastest_hatch_time: u64::MAX,
        });

        achievement.eggs_hatched += eggs_hatched;
        achievement.fastest_hatch_time = achievement.fastest_hatch_time.min(fastest_hatch_time);
        
        self.user_achievements.insert(&account_id, &achievement);
    }

    pub fn get_leaderboard(&self, start_index: usize, limit: usize) -> Vec<(AccountId, UserAchievement)> {
        let leaderboard_size = self.user_achievements.len();
        assert!(start_index < leaderboard_size, "Start index is out of range");
        assert!(limit > 0 && limit <= 100, "Limit must be positive and up to 100");
        assert!(start_index + limit <= leaderboard_size, "Range exceeds available data");

        self.user_achievements.iter().skip(start_index).take(limit).collect()
    }
}

near_sdk::setup_alloc!();
