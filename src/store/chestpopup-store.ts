import { writable } from 'svelte/store';

export const popupMessage = writable('');
export const popupShow = writable(false);
export const popupUserInfo = writable(false);
export const popupAccount = writable('');
export const isLoggedOut = writable(false);

export function showPopup(msg: string, show: boolean, usrinfo: boolean, acc: string) {
    popupMessage.set(msg);
    popupShow.set(show);
    popupUserInfo.set(usrinfo);
    popupAccount.set(acc);
    isLoggedOut.set(false);
}

export function closePopup() {
    popupMessage.set('');
    popupShow.set(false);
    popupUserInfo.set(false);
    popupAccount.set('');
    isLoggedOut.set(false);
}

export function triggerLoggedOut(){
    isLoggedOut.set(true);
}
