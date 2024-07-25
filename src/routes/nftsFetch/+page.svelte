<!-- <script> 
    import { GET } from "./nfts";
    import { page } from "@sveltejs/kit";
    import { writable } from "svelte/store";

    const nfts = writable([]);
    const loading = writable(false);
    const error = writable(null);



    export async function GET({ params }) {
        const { userId } = params;
        const inventoryUrl = `https://api2.nearblocks.io/v1/account/${userId}/inventory`;

        try {
            const response = await fetch(inventoryUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch NFTs');
            }
            const data = await response.json();
            const nfts = data.inventory.nfts || [];

            // The original Express.js logic checks for 'egg' in the name property. Let's do the same.
            const filteredNfts = nfts.filter(nft => 
                nft.nft_meta && nft.nft_meta.name && nft.nft_meta.name.toLowerCase().includes('egg'));

            return new Response(JSON.stringify(filteredNfts), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error fetching user NFTs:', error);
            return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    }

    async function fetchNfts() {
        loading.set(true);
        error.set(null);

        try {
            const response = await GET(page.params);
            const data = await response.json();
            nfts.set(data);
        } catch (error) {
            console.error("Error fetching NFTs:", error);
            error.set("Failed to fetch NFTs");
        } finally {
            loading.set(false);
        }
    }
</script> -->