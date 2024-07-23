import { HereWallet, HereKeyStore, HereAuthStorage, TelegramAppStrategy, HereInitializeOptions } from "@here-wallet/core";
import { utils } from 'near-api-js';

export const CONTRACT_ID = "dragonchests.near";
export const CONTRACT_ID_FT = "blackdragon.tkn.near";

let wallet: HereWallet;
let hereAuthStorage: HereAuthStorage;



export const initHere = async(): Promise<HereWallet> => { 
  if (!hereAuthStorage) hereAuthStorage = new HereKeyStore();
  const here = await HereWallet.connect({
    authStorage: hereAuthStorage,
    botId: "dragonchests_bot/dragonchests", // Your bot MiniApp
    walletId: "herewalletbot/app" //Hot wallet
  });
  wallet = here;
  return here;
}

export const signIn = async () : Promise<any> => {
  const accountName = await wallet.signIn({ contractId: CONTRACT_ID });
  return accountName;
}

export const signOut = async() => {
  await wallet.signOut();
}

export const getAccounts = async (): Promise<string[]> => { 
  const accounts = await wallet.getAccounts();
  return accounts;
};

export const viewFunction = async (functionName: string, args = {}): Promise<any> => {
  try{
    if(!wallet) return null;
    const accountId = await wallet.getAccountId();
    const accountInstance = await wallet.account(accountId);
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
}

export const viewFunctionFT = async (functionName: string, args = {}): Promise<any> => {
  try{
    if(!wallet) return null;
    const accountId = await wallet.getAccountId();
    const accountInstance = await wallet.account(accountId);
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
}

export const callFunction = async (functionName: string, args = {}, deposit = '0', gas = '300000000000000'): Promise<any> => {
  try{
    if(!wallet) return null;
    const accountId = await wallet.getAccountId();
    const accountInstance = await wallet.account(accountId);
    const result = await wallet.signAndSendTransaction({
      signerId: accountId,
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
}

export const callFunctionFT = async (functionName: string, args = {}, deposit = '0', gas = '300000000000000'): Promise<any> => {
  try{
    if(!wallet) return null;
    const accountId = await wallet.getAccountId();
    const accountInstance = await wallet.account(accountId);
    const result = await wallet.signAndSendTransaction({
      signerId: accountId,
      receiverId: CONTRACT_ID_FT,
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
}
