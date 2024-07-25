<script lang="ts">
  interface Token {
    token_id: string;
    contract_id: string;
  }

  import { onMount } from 'svelte';
  import {initNear} from '../../utility/near-setup';
  import {walletAccount, ownedNFTsStore, nftsStore, accountId, redeemedEggsStore } from '../../../store/wallet-store';
  import { CONTRACT_ID, callFunctionExternal, callFunctionExternalNFT, getAccounts, callFunction, wallet, viewFunction, viewFunctionFT } from '../../utility/near-setup';
  import type { DragonNft } from '../../../store/wallet-store';
  import { utils } from 'near-api-js';


  let isLoading = false;
  let walletName = ''; // Store wallet name
  let showEggs = false; // Initialize a variable to control the visibility of the egg counts
  let totalEggs: number;
  let bdamount: number;
  let qualifiedEggs: number = 0;
  let ftAmount = 0; // User input for the amount of FT tokens to trade
  let nfts = []; // Array to store NFTs
  let qualifyingNFTsList: any[] = []; // Array to store qualifying NFTs
  // let selectedNFTs = new Set(); 
  let selectedNFT: string | null = null;
  let numberOfSelectedNFTs = 0; // Number of selected NFTs for trading
  let dragonEggsSlider: HTMLElement | null = null;
  let purchaseSlider: HTMLElement | null = null;
  let eggsToBuyWithNear = 1;
  let eggsToBuyWithShards = 1;
  let nearCost = 10; // Cost per egg in NEAR
  let shardsCost = 10; // Cost per egg in Shards
  let hasPaidStorage = false; // Variable to store the result of the storage check
  let totalTokens = 1;
  let totalCost = totalTokens * 100000000;
  let NEAReggs: any[] = [];
  let redeemedEggs: any[] = [];
  let ConvertedEggs: any[] = [];
  let allNFTsSelected = false;
  let ownedNFTs: DragonNft [] = [];
  let dragonEggsOwned: any[] = [];
  let selectedEggImage = "https://nearhubcomics.mypinata.cloud/ipfs/QmedtaZc15taDZtM3fbAd5ahfF5q3gCvXg1cKi9W6Yb5FX";
  let selectedEggTokenId: null = null;
  let shellWarningLimit = 200;
  let maxShells = 256;

  $: if (ownedNFTsStore) {
    ownedNFTsStore.subscribe(value => {
      ownedNFTs = value || [];
    });
  }

  $: if (redeemedEggsStore) {
    redeemedEggsStore.subscribe(value => {
      redeemedEggs = value || [];
    });
  }
  let showPopup = false;
  function togglePopup() {
    showPopup = !showPopup;
    if (showPopup) {
    // Ensure redeemedEggs is up to date
    refreshInventory();
  }
  }

  // Utility function to check if NFT metadata contains 'egg'
  export function hasEggWord(metadata: any) {
    if (metadata && typeof metadata === 'object') {
        const lowerCaseMetadata = JSON.stringify(metadata).toLowerCase();
        return lowerCaseMetadata.includes("egg");
    }
    return false;
  }

  function getGatewayUrl(media: string) {
    // Regular expression to check for an IPFS CID pattern
    const ipfsPattern = /^[A-Za-z0-9]{46,}$/;
    if (ipfsPattern.test(media)) {
      // Remove the suffix if present
      const cleanMedia = media.split(':')[0];
      return `https://cloudflare-ipfs.com/ipfs/${cleanMedia}`;
    }
    // Return the original media if not an IPFS CID or if it's a full URL
    return media;
  }

  export async function fetchDragonEggNFTs() {
    const accounts = await getAccounts(); // Ensure wallet is properly initialized
    const accountId = accounts[0].accountId; // Get the account ID from accounts array
    if (accountId) {
      try {
        const dragonEggNFTs = await viewFunction('nft_tokens_for_owner', { account_id: accountId });
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

  export async function fetchEggNFTs(account: string) {
    const apiUrl = '/api/usersEggs?account=' + account;
    const accounts = await getAccounts(); // Ensure wallet is properly initialized
    const accountId = accounts[0].accountId; // Get the account ID from accounts array
    if (accountId) {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(`Failed to fetch NFTs: ${errorMessage}`);
        }
        const filteredNFTs: DragonNft[] = await response.json();
        qualifyingNFTsList = filteredNFTs;
        console.log('Filtered NFTs with "egg":', qualifyingNFTsList);
        ownedNFTsStore.set(qualifyingNFTsList);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        ownedNFTsStore.set([]);
        throw error;
      }
    } else {
      ownedNFTsStore.set([]);
    }
  }
      
  async function getNearEggs() {
    try {
      const dragonEggsOwned = await fetchDragonEggNFTs();
      const nearEggs = getNearEggsInternal(dragonEggsOwned, qualifyingNFTsList);
      const redeemedEggs: any[] = []; // Array to hold redeemed eggs

      // Use a for-loop to ensure all eggs are processed
      for (let i = nearEggs.length - 1; i >= 0; i--) {
        const egg = nearEggs[i];
        if (egg.nft_contract_id == CONTRACT_ID) {
          nearEggs.splice(i, 1);
          redeemedEggs.push(egg); // Add to redeemed eggs
        } else {
          const converted = await validateNFTConversion(egg.nft_contract_id + "::" + egg.token_id);
          if (converted == true) {
            nearEggs.splice(i, 1); // Remove from nearEggs
            redeemedEggs.push(egg); // Add to redeemed eggs
          }
        }
      }

      console.log('NEAREggs:', nearEggs);
      console.log('RedeemedEggs:', redeemedEggs);

      redeemedEggsStore.set(redeemedEggs);
      return { nearEggs, redeemedEggs };
    } catch (error) {
      console.error('Error fetching Near Eggs:', error);
      return { nearEggs: [], redeemedEggs: [] };
    }
  }

  async function getConvertedEggs() {
    try {
      const dragonEggsOwned = await fetchDragonEggNFTs();
      const ConvertedEggs = getNearEggsInternal(dragonEggsOwned, qualifyingNFTsList);
      // iterate over nearEggs and call validateNFTConversion
      for (const egg of ConvertedEggs) {
        const converted = await validateNFTConversion(egg.nft_contract_id+"::"+egg.token_id);
        if (converted == false) {
          // remove egg from nearEggs
          ConvertedEggs.splice(ConvertedEggs.indexOf(egg), 1);
        }
      } 

      console.log('ConvertedEggs:', ConvertedEggs);
      return ConvertedEggs;
    } catch (error) {
      console.error('Error fetching Near Eggs:', error);
      return [];
    }

  }

  function getNearEggsInternal(dragonEggs: any[], fetchedEggs: any[]) {
    // Create a Set of the dragon egg IDs
    const dragonEggIds = new Set(dragonEggs.map(egg => egg.token_id));

    // Filter the fetched eggs to remove the dragon eggs
    const nearEggs = fetchedEggs.filter(egg => !dragonEggIds.has(egg.token_id));
    return nearEggs;
  }
  
  // Validate egg purchase input
  function validateEggPurchaseInput(input: number): boolean {
    return !isNaN(input) && input >= 0 && input <= maxShells;
  }

  // check if selectedNFTs contains an object with token_id and contract_id equals to the parameters
  function isSelected(token_id: string, contract_id: string) {
    const identifier = JSON.stringify({ token_id, contract_id });
    return selectedNFT === identifier;
  }


  // Function to select or deselect all NFTs
  // function selectAllNFTs() {
  //   allNFTsSelected = !allNFTsSelected; // Toggle the state of allNFTsSelected
  //   if (allNFTsSelected) {
  //     qualifyingNFTsList.forEach((nft) => {
  //       selectedNFTs.add(nft.id.toString());
  //     });
  //   } else {
  //     selectedNFTs.clear();
  //   }
  //   numberOfSelectedNFTs = selectedNFTs.size;
  // }

  function updateTotalCost() {
    totalTokens = Math.max(0, Math.floor(totalTokens)); // Ensure the number of tokens is a positive integer
    totalCost = totalTokens * 1.0e8; // Calculate total cost based on the number of tokens
  }

  // Initial update
  updateTotalCost();
  $: totalCost = 1.0e8 * ftAmount; // 200 million BD FT tokens per shard

  $: isTradeActive = numberOfSelectedNFTs > 0;

  function dscrollLeft() {
    dragonEggsSlider?.scrollBy({ left: -200, behavior: 'smooth' });
  }

  function dscrollRight() {
    dragonEggsSlider?.scrollBy({ left: 200, behavior: 'smooth' });
  }

  function pscrollLeft() {
    purchaseSlider?.scrollBy({ left: -200, behavior: 'smooth' });
  }

  function pscrollRight() {
    purchaseSlider?.scrollBy({ left: 200, behavior: 'smooth' });
  }

  // Function to check if the user has paid for storage, with improved error handling
  async function ensureStorage(accountId: string) {
    try {
      const hasStorage = await viewFunction('storage_check', { account_id: accountId });
      hasPaidStorage = hasStorage; // Update reactive variable

      // If storage has not been paid, we attempt to pay for it
      if (!hasStorage) {
        alert('You have to pay for the storage before interacting with the smart contract. Redirecting to NEAR wallet to initialize storage.');
        const paymentResult = await callFunction('storage_deposit', {}, '0.025'); // Update deposit value to the required amount
        hasPaidStorage = paymentResult; // Update after attempting to pay
      }
    } catch (error) {
      console.error('Error with storage operation:', error);
      hasPaidStorage = false; // Ensure this is set to false in case of any error
      throw new Error(`Storage operation failed for account ${accountId}: ${error}`);
    }
  }

  // Function to validate if an NFT has already been converted
  async function validateNFTConversion(token_id: string) {
    return await viewFunction('check_if_converted', {token_id: token_id}) 
  }

  // set account info from store
  const handleMintButtonClick = async () => {
    try {
      const accounts = await getAccounts(); // Ensure wallet is properly initialized
      const accountId = accounts[0].accountId; // Get the account ID from accounts array

      await ensureStorage(accountId);

      // Continue with minting only if storage has been paid for
      if (hasPaidStorage) {
        await callFunction('nft_mint', {
          receiver_id: accountId,
          // other required parameters
        }, '10'); // Correct deposit amount if required
        alert(`Successfully minted ${eggsToBuyWithNear} eggs!`);
      } else {
        alert('Please pay for storage to mint eggs.');
      }
    } catch (error) {
      console.error('Error during NFT minting:', error);
      alert(`Minting failed: ${(error as Error).message}`);
    }
  };

  // Updated handleMintButtonClickShards function to include the limit check
  const handleMintButtonClickShards = async () => {
    if (validateEggPurchaseInput(eggsToBuyWithShards) && eggsToBuyWithShards > 0) {
      try {
        const accounts = await getAccounts(); // Ensure wallet is properly initialized
        const accountId = accounts[0].accountId; // Get the account ID from accounts array
        await ensureStorage(accountId); // Pass the correct account ID

        // Passing arguments as an object and ensuring numerical values are converted to strings
        await callFunction('nft_mint_points', {
          receiver_id: accountId,
          amount: eggsToBuyWithShards,
        }, '0.0548'); // Deposit amount as a string

        alert(`Successfully minted ${eggsToBuyWithShards} eggs with shards!`);
      } catch (error) {
        console.error('Error minting with shards:', error);
        alert(`Minting failed. ${(error as Error).message}`);
      }
    }
  };

  const transferFT = async (amount: string) => {
    try {
      const accounts = await getAccounts(); // Ensure wallet is properly initialized
      const accountId = accounts[0].accountId; // Get the account ID from accounts array
      await ensureStorage(accountId); // Pass the correct account ID

      
      if (qualifiedEggs + (eggsToBuyWithShards * shardsCost) > maxShells) {
        alert(`You are trying to buy more than the maximum allowed 256 shells. Please trade some shells for hatchlings to make space.`);
        return;
      }

      // Ensure all parameters are appropriately formatted
      await callFunctionExternal('ft_transfer_call', {
        receiver_id: CONTRACT_ID,
        amount: amount + "000000000000000000000000", // Already a string, no conversion needed
        msg: ''
      }, 1, '60000000000000'); // Gas amount as a string

      alert(`Successfully transferred ${amount} FT!`);
    } catch (error) {
      console.error('Error transferring FT:', error);
      alert(`Transfer failed. Please check your NEAR balance and storage deposit.`);
    }
  };

  function handleKeyPress(event: { key: string; }, action: () => void) {
    if (event.key === 'Enter' || event.key === ' ') {
      action();
    }
  }
  

  // add to selectedNFTs an object with token_id and contract_id equals to the parameters
  function handleNFTSelection(event: Event & { currentTarget: HTMLInputElement }) {
    const nft_contract_id = event.currentTarget.getAttribute('data-nft_contract_id');
    const token_id = event.currentTarget.value;
    const isChecked = event.currentTarget.checked;

    if (nft_contract_id === null) {
        console.error('NFT Contract ID is null');
        return;
    }

    const identifier = JSON.stringify({ token_id, contract_id: nft_contract_id });

    // Clear previous selection to allow only one selection at a time
    selectedNFT = isChecked ? identifier : null;

    numberOfSelectedNFTs = selectedNFT ? 1 : 0;
    console.log('handleNFTSelection called', selectedNFT);
  }

  async function tradeSelectedNFTs() {
    if (selectedNFT) {
        try {
            isLoading = true;
            const accounts = await getAccounts(); // Ensure wallet is properly initialized
            const accountId = accounts[0].accountId; // Get the account ID from accounts array
            await ensureStorage(accountId); // Pass the correct account ID

            // Log selected NFT for debugging
            console.log('Selected NFT:', selectedNFT);

            const { token_id, contract_id } = JSON.parse(selectedNFT);

            // Check if contract_id is null
            if (!contract_id) {
                console.error('NFT Contract ID is null');
                return;
            }

            // Check if NFT has already been traded
            if (await validateNFTConversion(`${contract_id}::${token_id}`)) {
                console.log(`NFT with contract ID: ${contract_id} and with ID: ${token_id} has already been converted`);
                alert(`NFT with contract ID: ${contract_id} and with ID: ${token_id} has already been converted`);
                return;
            }

            console.log(`Trading NFT Egg with contract ID: ${contract_id} and with ID: ${token_id}`);

            await callFunctionExternalNFT('nft_approve', {
                account_id: CONTRACT_ID,
                token_id: token_id,
                msg: '',
            },
            contract_id,
            '0.035', // Example deposit value, ensure it's in NEAR format
            '300000000000000'); // Example gas amount

            console.log('tradeSelectedNFTs called');
            // Clear selection after trading
            selectedNFT = null;
            alert(`Successfully traded the NFT Egg!`);
        } catch (error) {
            console.error('Error trading NFTs:', error);
            if (error instanceof Error) {
                alert(`Error trading NFTs: ${error.message}`);
            } else {
                alert('An unknown error occurred while trading NFTs.');
            }
        } finally {
            isLoading = false; // Set the loading state to false
        }
    } else {
        console.log('No NFT Egg selected for trading');
    }
  }


  // async function executeBatchTransactions(transactions: any[]) {
  //   for (const tx of transactions) {
  //     console.log('Executing transaction:', tx);
  //     await wallet.signAndSendTransaction({
  //       receiverId: tx.receiverId,
  //       actions: tx.actions,
  //     });
  //   }
  // }

  function dpercentage(nft: DragonNft) {
    if (nft && nft.metadata && nft.metadata.extra && nft.metadata.extra.percentage > 0.000) {
      return nft.metadata.extra.percentage;
    }
    return 0.000; // Return the default value if the condition is not met
  }

  async function refreshInventory() {
    try {
      const { nearEggs, redeemedEggs } = await getNearEggs();
      NEAReggs = nearEggs;
      dragonEggsOwned = await fetchDragonEggNFTs();
      ConvertedEggs = await getConvertedEggs();
      qualifiedEggs = await viewFunction('get_nft_egg_by_user', { account_id: walletName });
      bdamount = await viewFunctionFT('ft_balance_of', { account_id: walletName }); 
      bdamount = bdamount / 1000000000000000000000000;

      console.log('Inventory refreshed');
      console.log('NEAREggs:', NEAReggs);
      console.log('RedeemedEggs:', redeemedEggs);
      console.log('DragonEggsOwned:', dragonEggsOwned);
      console.log('ConvertedEggs:', ConvertedEggs);
      console.log('QualifiedEggs:', qualifiedEggs);
      console.log('BDAmount:', bdamount);
      
      redeemedEggsStore.set(redeemedEggs); // Ensure redeemedEggsStore is updated
    } catch (error) {
      console.error('Error refreshing inventory:', error);
    }
  }

  onMount(async () => {
    const { selector, modal } = await initNear(); // Initialize the wallet selector

    if (!wallet) {
      throw new Error('Wallet failed to initialize');
    }
    const accounts = await getAccounts(); // Fetch accounts
    if (accounts.length > 0) {
      walletAccount.set(true);
      walletName = accounts[0].accountId;
      accountId.set(accounts[0].accountId); // Ensure accountId is set
    }
    showEggs = true;
    updateTotalCost();
    
    const response = await fetch('/api/usersEggs?account=' + walletName);
    if (response.ok) {
      nfts = await response.json();
      nftsStore.set(nfts);
    }
    await fetchEggNFTs(walletName);

    try {
      dragonEggsOwned = await fetchDragonEggNFTs(); // Fetch Dragon Egg NFTs
      const { nearEggs, redeemedEggs: initialRedeemedEggs } = await getNearEggs();
      NEAReggs = nearEggs;
      redeemedEggs = initialRedeemedEggs;
      ConvertedEggs = await getConvertedEggs();
      console.log('NEAREggs:', NEAReggs);
      console.log('RedeemedEggs:', redeemedEggs);
    } catch (error) {
      console.error('Error fetching Egg NFTs:', error);
      dragonEggsOwned = [];
      NEAReggs = [];
    }

    // Fetch total eggs sold
    try {
      totalEggs = await viewFunction('get_total_eggs', { account_id: walletName });
      qualifiedEggs = await viewFunction('get_nft_egg_by_user', { account_id: walletName });
    } catch (error) {
      console.error('Error fetching egg data:', error);
      totalEggs = 0;
      qualifiedEggs = 0;
    }
    console.log('qualifyingNFTsList:', qualifyingNFTsList);

    try {
      bdamount = await viewFunctionFT('ft_balance_of', { account_id: walletName }); 
      bdamount = bdamount/1000000000000000000000000; 
    } catch (error) {
      console.error('Error fetching BD amount:', error);
    }
    console.log('bdamount:', bdamount);
  });

  // Set up interval to refresh inventory every 30 seconds
  setInterval(refreshInventory, 30000);

</script>

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DragonVerse Hatchling Creator</title>
</head>
<main class="w-full flex flex-col items-center justify-top mt-20">
  <p class="text-black-900 opacity-70 mt-2" style='font-weight-800'>
    <span class='m-6'>
    <span class='my-4 text-2xl text-black-100 font-bold leading-tight'>Hatchlings Adopted:</span> 
    {#if !showEggs}
    <span class='my-4 text-2xl text-black-100 font-bold leading-tight'>🥚</span>
    {:else}
    <span class='my-4 text-2xl text-black-100 font-bold leading-tight'>{totalEggs}</span>
    {/if}
    </span>
  </p>
  <span class="image-header-container">
    <div class="relative p-2 rounded-lg shadow-md flex items-center flex-col md:flex-row showcase">
      <img
        src={selectedEggImage}
        alt="NFT Card"
        class="mx-auto m-4 max-w-full object-contain h-65 w-96 rounded-lg overflow-hidden border-1"
      />
    </div>    
    
  </span>
  <div class="text-center mb-4 md:mb-0">
    <p class="text-black-900 opacity-70 mt-2" style='font-weight-800'>
      <!-- <span class='m-6'>
      <span class='my-4 text-2xl text-black-100 font-bold leading-tight'>Total Eggs Adopted:</span> 
      {#if !showEggs}
      <span class='my-4 text-2xl text-black-100 font-bold leading-tight'>-</span>
      {:else}
      <span class='my-4 text-2xl text-black-100 font-bold leading-tight'>{totalEggs}</span>
      {/if} -->
      <br />
      <span class='m-6'>
      <span class='my-4 text-2xl text-black-100 font-bold leading-tight'>Shells:</span> 
      {#if !showEggs}
      <span class='my-4 text-2xl text-black-100 font-bold leading-tight'>🥚</span>
      {:else}
      <span class='my-4 text-2xl text-black-100 font-bold leading-tight'>{qualifiedEggs}</span>
      {/if}
      <br />
      <span class='m-6'>
      <span class='my-4 text-2xl text-black-100 font-bold leading-tight'>$BLACKDRAGON:</span> 
      {#if !showEggs}
      <span class='my-4 text-2xl text-black-100 font-bold leading-tight'>🥚</span>
      {:else}
      <span class='my-4 text-2xl text-black-100 font-bold leading-tight'>{bdamount}</span>
      {/if}
      </span>
    </p>
    <span class='my-4 text-2xl text-black-100 font-bold leading-tight'>
    
      <button class="custom-button" on:click={refreshInventory} aria-label="Refresh Inventory">&nbsp;🔄️ Refresh Inventory 🔄️&nbsp;</button>

       
    </span>
  </div>


  <div class="dragon-egg-cards-container">
    <span class='m-1 flex justify-center items-center'>
      <h3 class="text-2xl text-black-100 font-bold leading-tight">My Hatchlings</h3>
      <img src="/blackdragons/myEggs.png" alt="NEAR Dragon" class="myEggs"/>
    </span>
    <div bind:this={dragonEggsSlider} class="owned-nfts-display">
      {#if dragonEggsOwned.length === 0}
        <p class="text-2xl text-black-100 font-bold ">Hatchling nest.</p>
      {:else}
        {#each dragonEggsOwned as dnft (dnft.token_id)}
          <div 
            class="owned-nft-card" 
            class:selected={dnft.token_id === selectedEggTokenId} 
            on:click={() => { selectedEggImage = dnft.metadata.media; selectedEggTokenId = dnft.token_id }}
            on:keypress={(event) => handleKeyPress(event, () => { selectedEggImage = dnft.metadata.media; selectedEggTokenId = dnft.token_id })}
            tabindex="-1"
          >
            <img src={dnft.metadata.media} alt={`Dragon Egg ${dnft.metadata.title}`} class="owned-nft-image" />
            <div class="owned-nft-info">
              <p class="owned-nft-title">{dnft.metadata.title}</p>
              <p class="owned-nft-collection">Egg #{dnft.token_id}</p>
              <p class="owned-nft-collection">{dpercentage(dnft)}% completed</p>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
  
  
  <div class="purchase-container">
    <div class="nft-cards-container">
      <button on:click={pscrollLeft} class="arrow-button arrow-left" aria-label="Scroll Left">@html{"<"}</button>
      <div class="flex justify-center">
        <img src="/blackdragons/nft-shards.png" alt="NEAR Dragon" class="nft-shards"/>
      </div>
      <div class="text-2xl text-black-100 font-bold" title="1 Egg = 1 Shell **Special Eggs get bonus airdropped Shells. List of eligible eggs in the info egg at the bottom right of the screen.">
        Select Your Eggs
      </div>
      <div bind:this={purchaseSlider} class="cards-slider">
        {#if NEAReggs.length === 0}
          <div class="card information-card">
            <!-- make buttons that link to mintbase.xyz, paras.id-->
            <p class="text-2xl text-black-100 font-bold ">Need Eggs?</p>

            <button on:click={() => window.open("https://paras.id/explore/collections?q=egg&is_search=true", '_blank')} class="custom-button"  aria-label="Link to Paras.id Egg Search" >Paras</button>
            <button on:click={() => window.open("https://www.mintbase.xyz", '_blank')} class="custom-button" aria-label="Link to Mintbase.xyz Marketplace" >Mintbase</button>

            <!-- <p>If you don't have any qualifying NFTs, consider exploring NEAR marketplaces for NFTs with 'Egg' in the title or collection name. Alternatively, you can start your own Egg NFT collection, ensuring the title or collection name contains 'Egg' and there's more than one owner besides the creator.</p> -->
          </div>
        {:else}
          {#each Object.values(NEAReggs) as nft}
            <div class="card">
                {#if nft.media && nft.title}
                  <img src={getGatewayUrl(nft.media)} alt={`NFT Egg ${nft.title}`} class="nft-image" />
                    <div class="nft-info">
                        <p class="nft-title">{nft.title}</p>
                        <p class="nft-collection-name">{nft.nft_contract_symbol}</p>
                        <label class="radio-container">
                            Select to Crack
                            <input
                                aria-label="Select to Crack"
                                type="radio"
                                name="conversion"
                                value={nft.token_id}
                                data-nft_contract_id={nft.nft_contract_id}
                                checked={isSelected(nft.token_id, nft.nft_contract_id)}
                                on:change={handleNFTSelection}
                            />
                            <span class="radiomark"></span>
                        </label>
                    </div>
                {/if}
            </div>
          {/each}
        
        {/if}
        <br>
      </div>
      <button on:click={pscrollRight} class="arrow-button arrow-right" aria-label="Scroll Right">@html{">"}</button>
      <br> 
      <span class="image-button-container">
        <button
          aria-label="Crack Eggs"
          class="trade-button"
          class:trade-active={isTradeActive}
          on:click={() => tradeSelectedNFTs()}
          on:keydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              tradeSelectedNFTs();
            }
          }}
          disabled={!isTradeActive || isLoading}
          tabindex="-1">
          {#if isLoading}
            <div class="loading-spinner"></div>
          {:else}
            {@html isTradeActive ? `Trade Egg for Shells` : "Select Eggs!"}
          {/if}
        </button>
      </span>
      
      <div>
        <button on:click={togglePopup} class="custom-button" aria-label="Open Cracked Egg Viewer">View Cracked Eggs</button>
        
        {#if showPopup}
          <div class="popup-overlay" on:click={togglePopup} on:keydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              togglePopup();
            }
          }}></div>
          <div class="popup">
            <h2>Cracked Eggs ({redeemedEggs.length})</h2>
            {#if redeemedEggs.length > 3}
              <button class="custom-button" on:click={togglePopup} aria-label="Close">Close</button>
            {/if}
            <div class="redeemed-eggs-grid">
              {#each redeemedEggs as egg}
                <div class="redeemed-egg-card">
                  <img src={getGatewayUrl(egg.media)} alt={`Redeemed Egg ${egg.token_id}`} class="redeemed-egg-image" />
                  <p class="redeemed-egg-info">{egg.nft_contract_id} - {egg.token_id}</p>
                </div>
              {/each}
            </div>
            <button class="custom-button" on:click={togglePopup} aria-label="Close">Close</button>
          </div>
        {/if}
      </div>
    </div>

    <div class="shards-container">
      <img src="/blackdragons/tradeshards.png" alt="NEAR Dragon" class="bdimgs" />
      <p class="purchase-text">
        Hatchlings
      </p>
      <div class="number-input-container">
        <span>
          <label for="eggsToBuyWithShards" hidden>Eggs to Buy with Shells</label>
          <input
            id="eggsToBuyWithShards"
            class="number-input"
            type="number"
            min="1"
            max="4"
            bind:value={eggsToBuyWithShards}
          />
          <p class="purchase-text"> {eggsToBuyWithShards * shardsCost}
            &nbsp;Shells
          </p>
        </span>
      </div>
      <button class="trade-button" disabled={(eggsToBuyWithShards * shardsCost) > qualifiedEggs} on:click="{() => handleMintButtonClickShards()}" aria-label="Crack Eggs">
        Trade
      </button>
    </div>

    <div class="ft-container">
      <img src="/blackdragons/buyShards.png" alt="NEAR Dragon" class="bdimgs"/>
      <p class="trade-text">Shells</p>
      <!-- <h3 class="text-.5 text-black-100 font-bold leading-tight"></h3> -->
      <!-- <p class="trade-text">Get</p> -->
        <div class="number-input-container">
          <label for="totalTokens" hidden>Total Tokens</label>
          <input
            id="totalTokens"
            class="number-input"
            type="number" 
            min="1" 
            max="25"
            placeholder="How many do you want?"
            bind:value={totalTokens}
            on:input={updateTotalCost}
            />
          
        </div>
        <p class="purchase-text">{totalCost.toLocaleString()} $BLACKDRAGON</p>

        <button
          class="trade-button"
          aria-label="Buy Shells with BLACKDRAGON"
          disabled={totalCost > bdamount}
          on:click={() => transferFT(totalCost.toString())}
        >
          {totalCost === 0 ? `Buy` : `Buy`}
        </button>
    </div>
    
      <div class="near-container">
        <img src="/blackdragons/buyEgg.png" alt="NEAR Dragon" class="bdimgsn"/>
        <br/>
        <p class="purchase-text-near">1 Hatchling<br/>10 NEAR</p>
        <!-- <h3 class="info-text text-.5 text-black-100 font-bold leading-tight">(10 NEAR = 1 Dragon Egg)</h3> -->
        <button class="trade-button" on:click="{() => handleMintButtonClick()}" aria-label="Buy eggs with NEAR">Buy</button>
      </div>
  
        <!-- <div class="number-input-container"> -->
          <!-- <input class="number-input" type="number" min="0" max="1" bind:value={eggsToBuyWithNear} /> -->
        <!-- </div> -->
        <!-- <p class="purchase-text">Dragon Egg</p> -->
        <!-- <p class="purchase-text"> -->
          <!-- &nbsp;{eggsToBuyWithNear * nearCost}  -->
          <!-- &nbsp;10 NEAR</p> -->
          <!-- <button class="trade-button"
          disabled={eggsToBuyWithNear = 1} 
          on:click="{() => handleMintButtonClick()}"> -->
          
          <!-- <button class="trade-button" on:click="{() => handleMintButtonClick()}">10 NEAR</button>
      </div> -->
    </div>
</main>


<style>

  .near-container {
      display: flex;
      flex-direction: column;
      align-items: center; /* Ensures contents are centered horizontally */
      justify-content: space-between; /* Distributes space evenly vertically */
  }

  .purchase-text-near, .purchase-text {
    text-align: center;
    margin-top: 30px; /* Adjust as needed to align with other cards */
    margin-bottom: 30px;
    flex-grow: 1; /* Allows text to push button towards the bottom */
    font-size: 1.5rem;
    padding: 0.25rem ;
    color: #333;
    font-weight: bold;
  }

  .shards-container, .near-container .trade-button {
      margin-bottom: 20px; /* Ensures consistent spacing from the bottom */
      width: 90%; /* Match the button width to other cards */
  }

  .myEggs {
    position: relative;
    height: 69px;
  }
  .bdimgs,
  .nft-shards {
    height: 75px;
    margin: 0.25rem;
    margin-top: 1rem;
    justify-content: center;
    align-items: center;
    right: 50;
    left: 50;
  }

  .bdimgsn {
    height: 80px;
    margin-top: 1.25rem;
    justify-content: center;
    align-items: center;
    right: 50;
    left: 50;
  }

  .custom-button {
    font-size: 2rem;
    color: #f5f5f5;
    font-weight: bold;
    background-color: #381f677b;
    border-radius: 25px;
    padding: 5px 10px;
    margin: 5px;
    text-decoration: none;
    transition: background-color 1s ease;
  }

  .custom-button:hover {
    background-color: #381f67;
  }

  .image-header-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 1rem;
  }

  .image-button-container { 
    display: flex;
    align-items: center;  
    justify-content: center; 
    margin: 1rem;
  }
  .showcase {
    width: 100%;
    background-color: #feeeeece;
    min-width: 300px;
  }

  .dragon-egg-cards-container {
    display: grid;
    place-content: center;
    position: relative;
    text-align: center;
    width: 90%; /* Set the container to take 90% of its parent */
    margin: 40px auto; 
    padding: 40px; /* Add padding to the left and right */
    overflow: visible; /* Allow overflow to show */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .owned-nfts-display {
    display: flex;
    flex-direction: row;
    justify-content: left; 
    width: 100%; /* Full container width */
    overflow-x: auto;
    margin-bottom: 20px; /* Adjust as needed */
    padding: 40px;
    gap: 10px; /* Spacing between cards */
    position: relative;
  }

  .owned-nft-card {
    background-color: #feeeeece;
    min-width: 120px; /* Adjust as needed */
    border: 1px solid #ccc; /* Example styling */
    border-radius: 8px;
    padding-top: 40px;
    padding-bottom: 40px;
    overflow: visible; /* Ensure overflow is visible */
    position: relative;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, z-index 0.2s ease-in-out;
  }

  .owned-nft-card:hover {
    transform: scale(1.05);   /* Subtle scale on hover */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25); /* Light box shadow on hover */
  }

  .owned-nft-card.selected {
    transform: scale(1.1);    /* Larger scale when selected */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);  /* Stronger box shadow when selected */
    z-index: 1; /* Ensure selected card is on top */
  }

  .owned-nft-image {
    width: 80%; /* Dynamic size based on viewport width */
    max-width: 300px; /* Max width for larger screens */
    margin: 0 auto; /* Center the image */
    display: block; /* Ensure image is centered */
    height: auto; /* Maintain aspect ratio */
  }

  .owned-nft-info {
    padding: 8px;
    font-weight: bold;
    font-size: 1.2rem;
    font-family: 'FingerPaint', sans-serif;
  }

  .owned-nft-title {
    font-size: 1.5em;
    margin: 0;
    font-weight: bold;
    font-family: 'GamjaFlower', serif;
  }

  .owned-nft-collection {
    font-size: 1em;
    color: #666;
    font-weight: bold;
    font-family: 'FingerPaint', sans-serif;
  }

  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #feeeeece;
    border-radius: 15px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 16px;
    margin: 8px;
    width: 200px;
  }

  .nft-image {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin-bottom: 8px;
  }

  .nft-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-family: 'FingerPaint', sans-serif;
    font-weight: bold;
  }

  .nft-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 4px;
    color: #696969;
    font-family: 'GamjaFlower', serif;
  }

  .nft-collection-name {
    font-size: 14px;
    font-family: 'GamjaFlower', serif;
    font-weight: bold;
    color: #666;
    margin-bottom: 8px;
  }

 /* .checkbox-container {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding-left: 35px;
  }

  .checkbox-container input {
    margin-left: 8px;
    font-family: 'FingerPaint', sans-serif;
  }

  .checkmark {
    display: inline-block;
    width: 25px;
    height: 25px;
    border: 1px solid #696969;
    border-radius: 4px;
    margin-left: 8px;
    position: relative;
  }

  .checkmark:after {
    content: "";
    position: absolute;
    display: none;
    left: 5px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    -webkit-transform: rotate(45deg);
    -ms-transform: rotate(45deg);
    transform: rotate(45deg);
  }

  .checkbox-container input:checked ~ .checkmark {
    background-color: #4CAF50;
    border-color: #4CAF50;
  }

  .checkbox-container input:checked ~ .checkmark:after {
    display: block;
  }
 */

 .radio-container {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding-left: 35px;
  }

  .radio-container input {
      margin-left: 8px;
      font-family: 'FingerPaint', sans-serif;
  }

  .radiomark {
      display: inline-block;
      width: 25px;
      height: 25px;
      border: 1px solid #696969;
      border-radius: 50%;
      margin-left: 8px;
      position: relative;
  }

  .radio-container input:checked ~ .radiomark {
      background-color: #4CAF50;
      border-color: #4CAF50;
  }

  .radio-container input:checked ~ .radiomark:after {
      display: block;
  }

  .radio-container input:checked ~ .radiomark:after {
      content: "";
      position: absolute;
      display: block;
      left: 9px;
      top: 5px;
      width: 5px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
  }

  .loading-spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 2s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    /* Ensure the image container takes full width and adjust the image size */
    .image-header-container, .showcase {
      flex-direction: column;
      align-items: center;
    }
    
    /* Adjust the card slider to be full width */
    .cards-slider {
      padding: 0 5px; /* Adjust padding */
      justify-content: left; /* Add if needed to center content */
      overflow: visible; /* Remove scroll for mobile */
    }

    /* Ensure that cards are not too wide for mobile screens */
    .card {
      width: 90%; /* make cards use most of the screen width */
      max-width: 300px; /* but don't let them get too wide */
      margin: 8px auto; /* center cards with automatic horizontal margins */
    }

    .owned-nfts-display {
      overflow-x: visible; /* Ensure no horizontal scroll */
      margin-bottom: 10px; /* Adjust as needed */
      padding: 3px;
      gap: 3px; /* Spacing between cards */
      position: relative;
    }

    .owned-nft-card {
      width: 90%; /* Responsive width */
      margin: 0 auto; /* Horizontal centering */
    }

    .owned-nft-card.selected {
      transform: scale(1.1);    /* Larger scale when selected */
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);  /* Stronger box shadow when selected */
      z-index: 10; /* Ensure selected card is on top */
    }

    .owned-nft-image {
      width: 90%; /* Slightly larger for smaller screens */
    }

    /* Adjust containers to stack vertically */
    .purchase-container, .near-container, .shards-container, .ft-container {
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 95%; /* Full container width */
    }

    /* Adjust button and input sizes */
    .trade-button, .number-input {
      width: 90%; /* make buttons take up most of the screen width */
      max-width: 300px; /* but don't let them get too wide */
      margin: 10px auto; /* center buttons with automatic horizontal margins */
    }
  }

  @media (min-width: 1200px) {
    .owned-nft-image {
      width: 60%; /* Slightly smaller for very large screens */
    }
  }

  /* If the loading spinner is too large, adjust it for mobile */
  .loading-spinner {
    width: 20px;
    height: 20px;
  }

  .popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 1px solid #ccc;
    padding: 1rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-width: 90vw; /* Ensure popup does not exceed viewport width */
    max-height: 90vh; /* Ensure popup does not exceed viewport height */
    overflow-y: auto; /* Enable vertical scrolling if content overflows */
  }

  .popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .redeemed-eggs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .redeemed-egg-card {
    background-color: #feeeeece;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 10px;
    text-align: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .redeemed-egg-image {
    width: 100%;
    height: auto;
    border-radius: 4px;
  }

  .redeemed-egg-info {
    margin-top: 10px;
    font-size: 0.9em;
    color: #333;
  }


  .custom-button {
    font-size: 1.2rem; /* Adjust font size */
    color: #f5f5f5;
    font-weight: bold;
    background-color: #381f677b; /* Match the card's hover background color */
    border-radius: 8px; /* Add rounded corners */
    padding: 0.5rem 1rem; /* Adjust padding */
    margin: 0.5rem; /* Adjust margin */
    text-decoration: none;
    transition: background-color 0.3s ease; /* Smoother transition */
  }

  .custom-button:hover {
    background-color: #381f67; /* Darken on hover */
  }
</style>