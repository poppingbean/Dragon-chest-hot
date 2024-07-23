import { writable } from 'svelte/store';

// Define your TypeScript interfaces for the store.

export interface DragonNftMetadata {
    symbol: string;
    name: string;
    media: string;
    title: string;
    extra: {
        bitmap: string;
        percentage: number;
    }
    description: string;
    contractId: string; // Add this property
}

export interface DragonNft {
    id: string;
    metadata: DragonNftMetadata;
    contractId: string; // Add this property
    owner_id: string;
    token_id: string;
    media: string; 
}

// Initialize the store with the correct type.
export const ownedNFTsStore = writable<DragonNft[]>([]);
export const switchWalletText = writable<boolean>(false);
export const walletAccount = writable<boolean>(false);
export const accountId = writable<string>('');
export const searchQuery = writable<string>('');
export const nftsStore = writable([]);
export const bufferResult = writable<string | null>(null);
export const redeemedEggsStore = writable<DragonNft[]>([]); 
// Function to handle buffer actions
export function performBufferAction(input: string): void {
    // Perform some buffer-related action, here we just set the bufferResult
    bufferResult.set(`Processed: ${input}`);
  }
