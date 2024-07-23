<script lang="ts">
// @ts-nocheck
 import { faTimes } from '@fortawesome/free-solid-svg-icons';
 
 import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
 import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
 import { signOut } from '$lib/utility/hot-chest';
 import { walletAccount, accountId } from '../../../../store/wallet-store';
 import { popupMessage, popupShow, popupUserInfo, popupAccount, triggerLoggedOut, closePopup, showPopup } from '../../../../store/chestpopup-store';
 import { createEventDispatcher } from 'svelte';

  async function logout(): Promise<void> {
    await signOut(); // Disconnect the wallet
    
    walletAccount.set(false);
    accountId.set('');
    closePopup();
    triggerLoggedOut();
  }


</script>

<style>
.popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%; 
  max-width: 400px; 
  background: #FFEFD5; /* Light orange color */
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), 
              0 0 0 3px #FFD700, /* Royal yellow outer border */
              inset 0 0 10px rgba(0, 0, 0, 0.1), /* Inner shadow for 3D effect */
              0 4px 15px rgba(255, 215, 0, 0.6); /* Outer shadow for 3D effect */
  border: 5px solid #FFD700; /* Royal yellow border */
  border-radius: 8px;
  z-index: 1000;
  overflow-wrap: break-word; 
  word-break: break-word;
}

.popup_content {
  background: #FFEFD5; /* Light orange color */
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.close_button {
  top: -10px;
  right: -10px;
  cursor: pointer;
  background: red;
  border: none;
  font-size: 16px;
  color: rgb(255, 255, 255);
  padding: 5px;
  border-radius: 15%;
}

.user_name {
        font-size: 1.6rem;
    }

    .login_button {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.3rem; 
        color: #FF4500;
    }

    .login_button_icon {
        margin-right: 10px;
        font-size: 1.5rem; 
    }
</style>
{#if $popupShow}
<div class={`popup`}>
    <div class={`popup_content`}>
      {#if !$popupUserInfo}
        <span>{$popupMessage}</span>
      {:else}
        <span class={'user_name'}>{$popupAccount}</span>
        <button class={'login_button'} on:click={() => logout()}>
          <FontAwesomeIcon icon={faSignOutAlt} />
        </button>
      {/if}
    </div>
    <button class={`close_button`} on:click={() => closePopup()}>
      <FontAwesomeIcon class="icon" icon={faTimes} />
    </button>
</div>
{/if}