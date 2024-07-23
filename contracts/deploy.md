# Setup

$env:NEAR_ENV="testnet"
near create-account egg.example.testnet --master-account example.testnet --initial-balance 4

# Deploy contract

near deploy --wasmFile 'D:\Chrome Downloads\dragon_egg_nft.wasm' --account_id egg.example.testnet

# Initialize contract

near call egg.example.testnet new_default_meta '{\"owner_id\": \"egg.example.testnet\", \"ft_account\": \"usdt.fakes.testnet\"}' --accountId egg.example.testnet


# Transfert FT

first time user has to send a deposit for storage

near call egg.example.testnet storage_deposit '{\"account_id\": \"test1.testnet\"}' --accountId test1.testnet --depositYocto 2000000000000000000000

near call usdt.fakes.testnet ft_transfer_call '{\"receiver_id\": \"egg.example.testnet\", \"amount\": \"4000000\", \"msg\": \"\"}' --accountId test1.testnet --depositYocto 1 --gas 60000000000000

# Transfert NFT

first time user has to send a deposit for storage

near call egg.example.testnet storage_deposit '{\"account_id\": \"test1.testnet\"}' --accountId test1.testnet --depositYocto 2000000000000000000000

near call test-1.dropt.nfts.test2.testnet nft_transfer_call '{\"receiver_id\": \"egg.example.testnet\", \"token_id\": \"7:1\", \"msg\": \"\"}' --accountId test1.testnet --depositYocto 1 --gas 60000000000000


'{"receiver_id": "<receiver-contract>", "token_id": "<token_id>", "msg": "<a-string-message>"}'

# Mint with points (FT and NFT)

near call egg.example.testnet nft_mint_points '{\"receiver_id\": \"test1.testnet\"}' --accountId test1.testnet --depositYocto 6720000000000000000000

# Mint with NEAR

near call egg.example.testnet nft_mint '{\"receiver_id\": \"test1.testnet\"}' --accountId test1.testnet --deposit 1


# Update bitmap and % 

near call egg.example.testnet update_egg_percentage '{\"token_id\": \"1\", \"extra\":\"{\\\"bitmap\\\":\\\"00000000\\\", \\\"percentage\\\": 1}\", \"percentage\": 1}' --accountId test1.testnet --depositYocto 1

# View methods

near view egg.example.testnet get_total_eggs
near view egg.example.testnet get_total_dragons
near view egg.example.testnet get_nft_egg_by_user '{\"account_id\": \"test1.testnet\"}'

# Delete the account
near delete egg.example.testnet example.testnet