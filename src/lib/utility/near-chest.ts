import { setupWalletSelector, type WalletSelector, type WalletModuleFactory, type AccountState } from '@near-wallet-selector/core';
import { setupModal, type WalletSelectorModal } from '@near-wallet-selector/modal-ui';
import { setupHereWallet } from '@near-wallet-selector/here-wallet';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupMintbaseWallet } from '@near-wallet-selector/mintbase-wallet';
import { setupSender } from '@near-wallet-selector/sender';
import { connect, keyStores, WalletConnection, utils } from 'near-api-js';
import '@near-wallet-selector/modal-ui/styles.css'; // Ensure you import the required CSS

// Configuration for NEAR network
const NETWORK_CONFIG = {
  testnet: {
    networkId: 'testnet',
    nodeUrl: 'https://near-testnet.lava.build/',
    walletUrl: 'https://testnet.mynearwallet.com',
    helperUrl: 'https://helper.testnet.near.org',
  },
  mainnet: {
    networkId: 'mainnet',
    nodeUrl: 'https://rpc.mainnet.near.org',
    walletUrl: 'https://wallet.near.org',
    helperUrl: 'https://helper.mainnet.near.org',
  },
};

const currentNetwork = 'mainnet'; // Change to 'mainnet' for mainnet configuration

export const CONTRACT_ID = "dragonchests.near";
export const CONTRACT_ID_FT = "blackdragon.tkn.near";

let selector: WalletSelector;
let modal: WalletSelectorModal;
let wallet: any; // Declare wallet

export const initNearChest = async (): Promise<{ selector: WalletSelector, modal: WalletSelectorModal }> => {
  selector = await setupWalletSelector({
    network: currentNetwork,
    modules: [
      setupHereWallet() as WalletModuleFactory,
      setupMeteorWallet() as WalletModuleFactory,
      setupMyNearWallet() as WalletModuleFactory,
      setupMintbaseWallet() as WalletModuleFactory,
      setupSender() as WalletModuleFactory,
    ],
  });

  modal = setupModal(selector, {
    contractId: CONTRACT_ID,
  });

  wallet = await selector.wallet(); // Initialize wallet

  return { selector, modal };
};

export const getAccounts = async (): Promise<AccountState[]> => { 
  const accounts = await wallet.getAccounts();
  return accounts.map((account: any) => ({ ...account, active: true })); // Ensure AccountState type
};

export const showModal = (): void => {
  modal.show();
};

export const signIn = async (): Promise<void> => {
  showModal();
};

export const signOut = async (): Promise<void> => {
  wallet.signOut();
};

export const viewFunction = async (functionName: string, args = {}): Promise<any> => {
  try {
    const account = selector.store.getState().accounts[0];
    const near = await connect({
      networkId: NETWORK_CONFIG[currentNetwork].networkId,
      keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      nodeUrl: NETWORK_CONFIG[currentNetwork].nodeUrl,
      walletUrl: NETWORK_CONFIG[currentNetwork].walletUrl,
      helperUrl: NETWORK_CONFIG[currentNetwork].helperUrl,
    });
    const walletConnection = new WalletConnection(near, 'app'); // Provide an appKeyPrefix
    const accountInstance = walletConnection.account();
    const result = await accountInstance.viewFunction({
      contractId: CONTRACT_ID,
      methodName: functionName,
      args,
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const viewFunctionFT = async (functionName: string, args = {}): Promise<any> => {
  try {
    const account = selector.store.getState().accounts[0];
    const near = await connect({
      networkId: NETWORK_CONFIG[currentNetwork].networkId,
      keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      nodeUrl: NETWORK_CONFIG[currentNetwork].nodeUrl,
      walletUrl: NETWORK_CONFIG[currentNetwork].walletUrl,
      helperUrl: NETWORK_CONFIG[currentNetwork].helperUrl,
    });
    const walletConnection = new WalletConnection(near, 'app'); // Provide an appKeyPrefix
    const accountInstance = walletConnection.account();
    const result = await accountInstance.viewFunction({
      contractId: CONTRACT_ID_FT,
      methodName: functionName,
      args,
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const callFunction = async (functionName: string, args = {}, deposit = '0'): Promise<any> => {
  try {
    const account = selector.store.getState().accounts[0];
    const result = await wallet.signAndSendTransaction({
      signerId: account.accountId,
      receiverId: CONTRACT_ID,
      actions: [{
        type: 'FunctionCall',
        params: {
          methodName: functionName,
          args,
          gas: '30000000000000',
          deposit: utils.format.parseNearAmount(deposit) ?? '0',
        },
      }],
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const callFunctionExternal = async (functionName: string, args = {}, deposit = '0', gas = '300000000000000'): Promise<any> => {
  try {
    const account = selector.store.getState().accounts[0];
    const result = await wallet.signAndSendTransaction({
      signerId: account.accountId,
      receiverId: CONTRACT_ID_FT,
      actions: [{
        type: 'FunctionCall',
        params: {
          methodName: functionName,
          args,
          gas,
          deposit: deposit ?? '0',
        },
      }],
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const callFunctionExternalNFT = async (functionName: string, args = {}, nft_contract_id: string, deposit = '0', gas = '300000000000000'): Promise<any> => {
  try {
    const account = selector.store.getState().accounts[0];
    
    // Ensure deposit and gas are correctly formatted
    const depositFormatted = utils.format.parseNearAmount(deposit) ?? '0';
    const gasFormatted = gas.toString();

    const result = await wallet.signAndSendTransaction({
      signerId: account.accountId,
      receiverId: nft_contract_id,
      actions: [{
        type: 'FunctionCall',
        params: {
          methodName: functionName,
          args,
          gas: gasFormatted,
          deposit: depositFormatted,
        },
      }],
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAccountInformation = async (): Promise<void> => {
  try {
    const account = selector.store.getState().accounts[0];
    const accounts = await wallet.getAccounts();
    const accountInfo = accounts.find((acc: { accountId: string; }) => acc.accountId === account.accountId);
    if (accountInfo) {
      console.log('Account Information:', accountInfo);
    } else {
      console.error('Account information not found');
    }
  } catch (error) {
    console.error('Error fetching account information:', error);
  }
};

export { wallet };
