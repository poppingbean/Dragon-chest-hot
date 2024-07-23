import { writable } from 'svelte/store';

export const baitCount = writable(10);
export const fishBiteTime = writable(0);
export const progressBarPosition = writable(50); // Starts at the middle
export const catchSuccessRate = writable(0);
export const fishSize = writable('small'); // can be 'small', 'medium', 'large'
