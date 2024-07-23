import { writable } from 'svelte/store';
import {
  setupWalletSelector,
  WalletSelector,
} from '@near-wallet-selector/core';
import { setupModal } from '@near-wallet-selector/modal-ui';
import { setupNearWallet } from '@near-wallet-selector/near-wallet';
import { setupHereWallet } from '@near-wallet-selector/here-wallet';

export const walletSelector = writable(null);
export const accountId = writable(null);

export async function initWallet() {
  const selector = await setupWalletSelector({
    network: 'mainnet', // or 'mainnet' based on your environment
    modules: [
      setupNearWallet(),
      setupHereWallet(),
    ],
  });

  const modal = setupModal(selector, {
    contractId: 'your-contract-id',
  });

  walletSelector.set(selector);

  selector.store.observable.subscribe((state) => {
    const { accounts } = state;
    if (accounts.length) {
      accountId.set(accounts[0].accountId);
    } else {
      accountId.set(null);
    }
  });

  return { selector, modal };
}
