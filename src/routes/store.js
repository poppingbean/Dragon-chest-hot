import { writable } from 'svelte/store';

export const scoreTexture = writable("");

export const hintActive = writable(false);

export const brightestPixel = writable({ x: null, y: null });
 