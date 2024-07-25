<script lang="ts">
  import { onMount } from 'svelte';
  import { initNear, signOut, getAccounts, showModal } from '$lib/utility/near-setup';
  import { walletAccount, bufferResult, performBufferAction, accountId } from '../../../store/wallet-store';
  import { writable } from 'svelte/store';

  let y: number; // Screen Y scroll position
  let isMobileMenuOpen = false; // State for the mobile menu visibility
  let walletName = ''; // State for the account wallet
  let bufferData: string | null = null;

  export let ariaLabel: string;

  const walletConnected = writable(false);

  onMount(async () => {
    const { selector, modal } = await initNear(); // Use initNear

    const accounts = await getAccounts(); // Ensure accounts are fetched correctly
    if (accounts.length > 0) {
      walletAccount.set(true);
      walletName = accounts[0].accountId;
      accountId.set(accounts[0].accountId);
    }

    performBufferAction('All Buffed up and ready to go!');
    bufferResult.subscribe((value) => {
      bufferData = value;
      console.log('Buffer Data:', bufferData);
    });

    window.addEventListener('resize', closeMenuOnResize);
  });

  function toggleMobileMenu(): void {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function closeMenuOnResize(): void {
    if (window.innerWidth >= 769 && isMobileMenuOpen) {
      isMobileMenuOpen = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'm' || event.key === ' ') {
      toggleMobileMenu();
    }
  }

  async function login(): Promise<void> {
    showModal(); // Ensure the modal is shown when "Connect Wallet" is clicked
    const accounts = await getAccounts();
    if (accounts.length > 0) {
      walletAccount.set(true);
      walletName = accounts[0].accountId;
      accountId.set(accounts[0].accountId);
    }
  }

  async function logout(): Promise<void> {
    await signOut(); // Disconnect the wallet
    walletAccount.set(false);
    walletName = '';
    accountId.set('');
  }
</script>

<svelte:window bind:scrollY={y} on:keydown={handleKeyDown} />

<nav aria-label={ariaLabel} class="navbar">
  <div class="logo logos-container">
    <a class="logo logos-container" href="/">
      <img src="/blackdragons/bddvlogo.png" alt="NEAR Dragon" class="bdimgs"/>
      <a href="/"><img src="/DVtitle.png" alt="Logo" class="logodv" /></a>
    </a>
  </div>

  <!-- Hamburger Menu Icon -->
  <div class="hamburger-menu" on:click={toggleMobileMenu} on:keydown={handleKeyDown} tabindex="-1">
    <h3 class="menu-link">Menu</h3>
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
  </div>

  <!-- Mobile Menu -->
  <div class="mobile-menu" class:active={isMobileMenuOpen}>
    <a href="/" class="mobile-link">
      <img src="/DVtitle.png" alt="NEAR Dragon" class="mbl-dv-imgs"/>
    </a>
    <a href="/landing" class="mobile-link">Hatchlings</a>
    <a href="/redeemed-egg-checker" class="mobile-link">Egg Checker</a>
    <a href="/" class="mobile-link">INCUBATOR - Coming Soon!</a>
    <button class="login-btn" on:click={$walletAccount ? logout : login}>
      {$walletAccount ? `Logout ${walletName}` : 'Connect Wallet'}
    </button>
  </div>

  <!-- Desktop Links -->
  <div class="links-desktop">
    <a href="landing" class="desktop-link">Hatchlings</a>
    <a href="redeemed-egg-checker" class="desktop-link">Egg Checker</a>
    <a href="/" class="desktop-link" title="Coming Soon!">INCUBATOR</a>
    <button class="login-btn" on:click={$walletAccount ? logout : login}>
      {$walletAccount ? `Logout ${walletName}` : 'Connect Wallet'}
    </button>
  </div>
</nav>

<style>
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: fixed;
    width: 100%;
    top: 0;
    background: rgb(167, 162, 162);
    background: linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, rgba(167,162,162,0.8) 100%);
    padding: 0.5rem 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 10;
  }

  .logos-container {
    display: flex; /* Align items in a row */
    align-items: center; /* Center items vertically */
    justify-content: flex-start; /* Align items to the start of the container */
  }

  .bdimgs, .logodv {
    height: 50px; /* Maintain aspect ratio */
     /* Maximum height to fit navbar */
    margin: 0.25rem; /* Spacing around images */
  }

  .mbl-dv-imgs {
    width: 200px;
    height: auto;
    margin: 0.25rem;
  }

  .hamburger-menu {
    display: none;
  }

  .bar {
    display: none;
    width: 25px;
    height: 3px;
    margin: 5px auto;
    transition: all 0.3s ease-in-out;
    background-color: #fff;
  }

  .mobile-menu {
    display: none;
    flex-direction: column;
    background-color: #333;
    position: absolute;
    top: 100%;
    right: 0;
    width: 100%;
    z-index: 11;
  }

  .mobile-menu.active {
    display: flex;
  }

  .mobile-link {
    color: white;
    padding: 1rem;
    text-align: center;
    display: block;
  }

  .menu-link {
    color: white;
    padding-top: 0.25rem;
    text-align: center;
    display: block;
  }

  .desktop-link {
    color: white;
    padding: 0.5rem 1rem;
    margin: 0 1rem;
    text-decoration: none;
    font-size: 1rem;
    border-radius: 10px;
    transition: color 0.3s ease, background-color 0.3s ease;
  }

  .desktop-link:hover {
    background-color: white;
    color: #0e0a17;
  }

  .login-btn {
    background-color: transparent;
    color: white;
    border: 2px solid white;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .login-btn:hover {
    background-color: white;
    color: #0e0a17;
  }

  @media (min-width: 769px) {
    .hamburger-menu, .mobile-menu {
      display: none; 
    }

    .links-desktop {
      display: flex;
      align-items: center;
    }
  }

  @media (max-width: 768px) {
    .hamburger-menu {
      display: block;
    }

    .links-desktop {
      display: none;
    }

    .bdimgs {
      width: 40px;
      height: 40px;
      margin: 0.25rem;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }

    .logodv {
      height: 40px;
      margin: 0.25rem;
      display: none;
      margin-left: auto;
      margin-right: auto;
    }

    .bar {
      display: block;
    }
  }
</style> 