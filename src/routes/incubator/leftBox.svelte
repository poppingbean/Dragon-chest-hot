<script lang="ts"> 
    import type { DragonNft } from '../../store/wallet-store';
    import { onMount } from 'svelte';
    import {walletAccount, ownedNFTsStore } from '../../store/wallet-store';
    import { initNear, wallet, viewFunction } from '../../../src/lib/utility/near-setup';

    export let isFullScreen = false;

    let selectedEggImage = '';
    let walletName = ''; // Store wallet name
    let showEggs = false; // Initialize a variable to control the visibility of the egg counts
    let currentTab = 'My Eggs'; // Default tab
    let selectedEggTokenId: string | null = null; // Store the selected egg token ID
    let dragonEggNFTs: DragonNft[] = [];
    let shouldRender = false;

    $: if (ownedNFTsStore) {
        ownedNFTsStore.subscribe(value => {
        dragonEggNFTs = value;
        });
    }
    
    // Function to change the current tab
    function changeTab(tab: string) {
        currentTab = tab;
    }

    function toggleFullScreen() {
        isFullScreen = !isFullScreen;
    }

    export async function fetchDragonEggNFTs() {
        const accountId = wallet.getAccountId();
        if (accountId) {
        try {
            const dragonEggsOwned = await viewFunction('nft_tokens_for_owner', { account_id: accountId });
            console.log('NFTs from contract:', dragonEggsOwned); 
            // Filtering NFTs from your contract based on metadata
            const dragonEggNFTs = dragonEggsOwned.filter((nft: { metadata: { title: string; }; }) => 
                nft.metadata?.title === 'Dragon egg' 
            ); 
            console.log('dragonEggNFTs:', dragonEggNFTs);
            return dragonEggNFTs; // Return only your Dragon Egg NFTs

        } catch (error) {
            console.error('Error fetching Dragon Egg NFTs:', error);
            return []; // Return an empty array in case of error
        }
        } else {
        return []; // Return an empty array if no account ID
        }
    }

    onMount(async () => {
        initNear();
        const accountId = wallet.getAccountId();
        if (wallet.getAccountId()) {
            walletAccount.set(wallet.getAccountId());
            walletName = wallet.getAccountId();
            showEggs = true;
            await fetchDragonEggNFTs();
            console.log('dragonEggNFTs after fetching:', dragonEggNFTs);  
            shouldRender = true;
        }
    });

</script>

<style>
    .left-box {
        width: 20vw; /* Same as before */
        height: 60vh; /* Same as main container */
        background-color: rgba( 14, 10, 23, .7);
        overflow: hidden;
        z-index: 32;
        position: absolute;
        border-radius: 25px;
        border: 3px solid rgba( 14, 10, 23, 1);
        left: calc((100vw - 45vw - 2 * 20vw) / 3); /* Adjust for centering between main container and edge */
        top: 69%;
        transform: translateY(-50%);
    }

    .owned-nfts-display {
        display: flex; /* Use flexbox for dynamic layout */
        flex-wrap: wrap; /* Allow items to wrap to the next line */
        justify-content: space-around;  /* Distribute items evenly */ 
        overflow-x: auto;  /* Add horizontal scroll if needed */ 
        padding: 10px;
    }

    .owned-nft-image {
        display: block; /* Or display: inline-block; depending on your layout */
    }

    .owned-nft-card {
        flex: 0 0 25%;  /* Adjust card width as needed  */
        margin: 10px; 
    }

    @media (max-width: 768px) {
        .owned-nfts-display {
            flex-direction: column; /* Stack items vertically */
        }
    }

    @media (max-width: 768px) {
        .left-box {
            width: 80vw; /* Button width */
            height: 10vh; /* Button height */
            position: fixed; /* Fixed to ensure full screen */
            left: 10%; /* Center horizontally */
            bottom: 20vh; /* Above the bottom */
            transform: translateY(0);
            z-index: 200; /* On top of other elements */
        }
    }

    h1 {
        color: white;
        font-size: 2em;
        text-align: center;
        margin-top: 7%;
    }

    .tab-container {
        display: flex;
        justify-content: space-around;
        background: #333; /* Dark background for the tabs */
        padding: 0.5rem 0;
    }

    .tab {
        cursor: pointer;
        color: white;
        padding: 0.5rem 1rem;
        text-align: center;
    }

    .tab.active {
        border-bottom: 2px solid yellow; /* Highlight active tab */
    }

    .content {
        padding: 1rem;
        color: white;
    }
</style>

<div class="left-box" on:click={toggleFullScreen} on:keydown={e => (e.key === 'Enter' || e.key === ' ') && toggleFullScreen()}>
    <div class="tab-container">
        <div class="tab" class:active={currentTab === 'My Eggs'} on:click={() => changeTab('My Eggs')} on:keydown={e => (e.key === 'Enter' || e.key === ' ') && changeTab('My Eggs')} tabindex="0" role="button">
            🥚
        </div>
        <div class="tab" class:active={currentTab === 'My Dragons'} on:click={() => changeTab('My Dragons')} on:keydown={e => (e.key === 'Enter' || e.key === ' ') && changeTab('My Dragons')} tabindex="0" role="button">
            🐉
        </div>
        <div class="tab" class:active={currentTab === 'Settings'} on:click={() => changeTab('Settings')} on:keydown={e => (e.key === 'Enter' || e.key === ' ') && changeTab('Settings')} tabindex="0" role="button">
            ⚙️
        </div>
    </div>
    <div class="content" on:click={toggleFullScreen} on:keydown={e => e.key === 'Enter' && toggleFullScreen()}>
        {#if currentTab === 'My Eggs'}
            <h1>My Eggs</h1>
            <div class="nft-cards-container">
                <div class="owned-nfts-display" >
                    {#if dragonEggNFTs.length === 0}
                        <p>Loading Dragon Egg NFTs...</p> 
                    {:else if dragonEggNFTs} 
                    {#each dragonEggNFTs as nft (nft.token_id)}
                        <div 
                            class="owned-nft-card" 
                            class:selected={nft.token_id === selectedEggTokenId} 
                            on:click={() => { selectedEggImage = nft.metadata.media; selectedEggTokenId = nft.token_id }}
                        >
                            <img src={nft.metadata.media} alt={`Dragon Egg ${nft.metadata.title}`} class="owned-nft-image" /> 
                        </div>
                    {/each}
                    {:else}
                        <p>Error fetching Dragon Egg NFTs</p>
                    {/if}
                </div>
            </div>
        {:else if currentTab === 'My Dragons'}
            <h1>My Dragons</h1>
            <!-- Content for My Dragons -->
        {:else if currentTab === 'Settings'}
            <h1>Settings ⚙️</h1>
            <!-- Content for Settings -->
        {/if}
    </div>
</div>



