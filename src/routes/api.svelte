<script>
    /**
    * @param {{ params: { userId: string } }} options
    */
    export async function GET({ params }) {
        const { userId } = params;
        const apiUrl = `https://api2.nearblocks.io/v1/account/${userId}/inventory`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch NFTs');
            }
            const data = await response.json();
            const nfts = data.inventory.nfts;

            const filteredNfts = nfts.filter((/** @type {any} */ nft) => 
                JSON.stringify(nft).toLowerCase().includes('egg'));

            return new Response(JSON.stringify(filteredNfts));
        } catch (error) {
            console.error('Error fetching user NFTs:', error);
            return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
        }
    }
</script>