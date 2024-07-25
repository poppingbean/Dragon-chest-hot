<script lang="ts">
  import { viewFunction } from '../../lib/utility/near-setup';
  import { onMount } from 'svelte';
  import Nav from '$lib/component/landing/Nav.svelte';
  import { walletAccount, accountId } from '../../store/wallet-store';
  import '../../app.css';

  let nftLink = '';
  let contractId = '';
  let tokenId = '';
  let validationResult = '';
  let isLoading = false;
  let useManualInput = false;
  let loggedIn = false;
  let buttonState = 'empty'; // Possible states: empty, filled, tradable, redeemed

  function extractTokenData(url: string | URL) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');

      // Check if the URL is from Paras
      if (urlObj.hostname.includes('paras.id') && pathParts.includes('token')) {
        const tokenData = pathParts[pathParts.length - 2].split('::');
        const tokenIdPart = pathParts[pathParts.length - 1].split(':');
        if (tokenData.length === 2 && tokenIdPart.length === 2) {
          const [contract_id, token_id] = tokenData;
          const token_id_full = tokenIdPart.join(':');
          return { contract_id, token_id: token_id_full };
        } else {
          throw new Error('URL does not contain valid token information');
        }
      }

      // Check if the URL is from Mintbase
      if (urlObj.hostname === 'www.mintbase.xyz' && pathParts[1] === 'meta') {
        const tokenData = decodeURIComponent(pathParts[2]).split(':');
        if (tokenData.length === 2) {
          const [contract_id, token_id] = tokenData;
          return { contract_id, token_id };
        } else {
          throw new Error('URL does not contain valid token information');
        }
      }

      // Check if the URL is from Tradeport
      if (urlObj.hostname === 'www.tradeport.xyz' && pathParts.includes('collection')) {
        const contract_id = pathParts[pathParts.indexOf('collection') + 1].replace('-by-', '.').replace('-near', '.near');
        const tokenIdParam = urlObj.searchParams.get('tokenId');
        if (tokenIdParam) {
          const token_id = decodeURIComponent(tokenIdParam).replace('%253A', ':');
          return { contract_id, token_id };
        } else {
          throw new Error('URL does not contain tokenId parameter');
        }
      }

      throw new Error('URL does not contain token information');
    } catch (error) {
        console.error('Invalid URL:', error);
      return { contract_id: null, token_id: null };
    }
  }

  async function validateNFTConversion(token_id: string) {
    return await viewFunction('check_if_converted', { token_id: token_id });
  }

  function updateButtonState() {
    if (useManualInput) {
      if (contractId && tokenId) {
        buttonState = 'filled';
      } else {
        buttonState = 'empty';
      }
    } else {
      if (nftLink) {
        buttonState = 'filled';
      } else {
        buttonState = 'empty';
      }
    }
    validationResult = ''; 
  }

  function handleInputChange() {
    updateButtonState();
    buttonState = 'filled'; // Set to 'filled' when input changes but not cleared
  }

  async function checkNFTRedemption() {
    isLoading = true;
    validationResult = '';
    let contract_id, token_id;

    if (useManualInput) {
      contract_id = contractId;
      token_id = tokenId;
    } else {
      ({ contract_id, token_id } = extractTokenData(nftLink));
    }

    if (contract_id && token_id) {
      try {
        const isRedeemed = await validateNFTConversion(`${contract_id}::${token_id}`);
        if (isRedeemed) {
          validationResult = '❌\nThis egg\nhas been\ncracked.';
          buttonState = 'redeemed';
        } else {
          validationResult = '✅\nuncracked\negg';
          buttonState = 'tradable';
        }
      } catch (error) {
        console.error('Error checking NFT redemption:', error);
        validationResult = 'Error checking NFT redemption. Please try again.';
        buttonState = 'empty';
      }
    } else {
      validationResult = 'Invalid input. See instructions above.';
      buttonState = 'empty';
    }
    isLoading = false;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      checkNFTRedemption();
    }
  }


  onMount(() => {
    walletAccount.subscribe(value => {
      loggedIn = value;
    });
  });
</script>
<head>
  <title>Cracked Egg Checker</title>
</head>

<Nav ariaLabel="Navigation" />
{#if loggedIn}
<div class="parent">
  <main class="container">
    <h1 class="title">Cracked Egg Checker</h1>
    <p class="description">
      Enter the link to the NFT Egg for sale on a marketplace<br />
      <span class="example">ex: "paras.id/token/x.paras.near::######/######:###"</span><br />
      <span class="example">"tradeport.xyz/near/collection/****?...tokenId=###%253A###"</span>
      <br />
      <span class="example">"mintbase.xyz/meta/contract_id:token_id"</span><br />
      or manually enter the contract ID and token ID<br />
      to check if it has been previously cracked.
    </p>
  
    <div class="toggle-input-method">
      <label>
        <input type="radio" bind:group={useManualInput} value={false} on:change={updateButtonState} />
        Use URL
      </label>
      <label>
        <input type="radio" bind:group={useManualInput} value={true} on:change={updateButtonState} />
        Manual Input
      </label>
    </div>
  
    {#if !useManualInput}
      <div class="input-group">
        <label for="nftLink">NFT Link</label>
        <input id="nftLink" type="text" bind:value={nftLink} placeholder="Enter NFT link" class="input" on:input={handleInputChange} on:keydown={handleKeyDown} />
      </div>
    {:else}
      <div class="input-group">
        <label for="contractId">Contract ID</label>
        <input id="contractId" type="text" bind:value={contractId} placeholder="Enter contract ID" class="input" on:input={handleInputChange} on:keydown={handleKeyDown} />
        <label for="tokenId">Token ID</label>
        <input id="tokenId" type="text" bind:value={tokenId} placeholder="Enter token ID" class="input" on:input={handleInputChange} on:keydown={handleKeyDown} />
      </div>
    {/if}
  
    <button class={`button ${buttonState}`} on:click={checkNFTRedemption} disabled={isLoading || buttonState === 'empty'}>
      {#if isLoading}
        <div class="loading-spinner"></div>
      {:else}
        {#if validationResult}
          <div class="result">
            <p class="response-text">{@html validationResult.replace(/\n/g, '<br>')}</p>
          </div>
        {:else}
          {#if buttonState === 'filled'}
            Check if Cracked
          {:else}
            Add Token Info
          {/if}
        {/if}
      {/if}
    </button>
  </main>
</div>
{:else}
  <div class="parent">
    <main class="container">
      <h1 class="title">Cracked Egg Checker</h1>
      <p class="description">Please log in to use the Cracked Egg Redemption Checker.</p>
    </main>
  </div>
{/if}

<style>
  .parent {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh; 
      padding: 20px; 
      box-sizing: border-box;
  }

  .container {
    font-family: 'FingerPaint', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    text-align: center;
    background-color: #feeeeece;
    border-radius: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    margin: 20px 5px;
    width: calc(100% - 40px); /* Adjust width to accommodate left and right margins */
    max-width: 690px;
    position: relative;
    top: auto; /* Adjust to fit below the navbar */
    bottom: auto;
    overflow-y: auto;
    word-wrap: break-word; /* Ensure long words break to fit within the container */
    word-break: break-word; /* Ensure long words break to fit within the container */
  }

  .example {
    background-color: 'eggshell';
    font-size: 0.9rem; /* Set the font size for the example URL */
  }

  .example:hover {
    font-size: 1.05rem;
    transition: ease-in-out 1s 0.05s font-size;
  }

  .title {
      font-size: 2rem;
      margin-bottom: 20px;
      font-family: 'GamjaFlower', serif;
      color: #381f67;
  }

  .description {
      font-size: 1rem;
      margin-bottom: 20px;
      font-family: 'FingerPaint', sans-serif;
      color: #333;
      white-space: pre-wrap; /* Maintain line breaks */
  }

  .toggle-input-method {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
      width: 100%;
  }
  
  .response-text {
      font-size: 1rem;
      word-wrap: normal;
  }

  .input-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
      width: 100%;
  }

  .input {
      width: 90%;
      padding: 10px;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 5px;
      margin: 5px 0;
      font-family: 'FingerPaint', sans-serif;
  }

  .button {
      padding: 20px 40px;
      font-size: 1rem;
      color: #fff;
      font-weight: bold;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      transition: background-color 0.3s ease, transform 0.1s ease;
      font-family: 'FingerPaint', sans-serif;
      margin-top: 10px;
      width: 150px;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      transform: scale(1);
      animation: none;
  }

  .button.empty {
      background-color: #ccc;
      color: #777;
  }

  .button.filled {
      background-color: #e3dac9; /* Eggshell color */
      color: #555;
  }

  .button.tradable {
      background-color: #228b22; /* Forest green */
      color: #fff;
      font-size: 0.55;
      padding-left: 4.2px;
      padding-right: 4.2px;
      padding-top: 40px;
      padding-bottom: 40px;
  }

  .button.tradable .result {
      color: #fff;
  }

  .button.redeemed {
      background-color: #800000; /* Merlot red */
      color: #fff;
  }

  .button.redeemed .result {
      color: #fff;
  }

  .button:disabled {
      cursor: not-allowed;
  }

  .button:active {
      transform: scale(0.95);
  }

  .loading-spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 2s linear infinite;
  }

  @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
  }

  @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25%, 75% { transform: translateX(-5px); }
      50% { transform: translateX(5px); }
  }

  .result {
      margin-top: 20px;
      font-size: 1.2rem;
      color: inherit; /* Inherit color from parent button */
  }

  label {
      margin: 0 10px;
      font-family: 'FingerPaint', sans-serif;
      font-size: 1rem;
      color: #381f67;
  }

  @media (max-width: 768px) {
    .container {
        padding: 10px;
        margin-top: 1rem;
        margin-bottom: 1rem;
        margin-left: 1rem;
        margin-right: 1rem;
        width: calc(100% - 20px); /* Adjust width for smaller screens */
        top: 40px;
        bottom: 20px;
    }

    .title {
        font-size: 1.8rem;
    }

    .example {
        font-size: 0.69rem;
    }

    .description {
        font-size: 0.9rem;
    }

    .input {
        width: 100%;
    }

    .button {
        width: 100%;
        max-width: 300px;
    }
  }
</style>
