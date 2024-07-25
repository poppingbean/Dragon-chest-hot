<script>
    import { setupWalletSelector } from '@near-wallet-selector/core'; 
    import modal
    import { activeRpcConfig } from './RpcStore.ts'; 

    // ... Wallet Selector setup and UI logic

    // When a wallet is selected:
    selector.on('select', (wallet) => {
        // Find the matching RPC config based on wallet's network or other identifiers 
        const selectedConfig = rpcConfigs.find(config => config.networkId === wallet.networkId); 

        if (selectedConfig) {
            activeRpcConfig.set(selectedConfig);
        }
    });
</script>

<button on:click={() => modal.show()}>Select Wallet</button>