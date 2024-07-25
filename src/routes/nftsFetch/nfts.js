// // src/routes/user/[userId]/nfts.js
// import { accountId } from "../../store/wallet-store";

// let userId = {accountId: accountId};

// export async function GET({ params }) {
//     const { userId } = params;
//     const inventoryUrl = `https://api2.nearblocks.io/v1/account/${userId}/inventory`;

//     try {
//         const response = await fetch(inventoryUrl);
//         if (!response.ok) {
//             throw new Error('Failed to fetch NFTs');
//         }
//         const data = await response.json();
//         const nfts = data.inventory.nfts || [];

//         // The original Express.js logic checks for 'egg' in the name property. Let's do the same.
//         const filteredNfts = nfts.filter((/** @type {{ nft_meta: { name: string; }; }} */ nft) => 
//             nft.nft_meta && nft.nft_meta.name && nft.nft_meta.name.toLowerCase().includes('egg'));

//         return new Response(JSON.stringify(filteredNfts), {
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching user NFTs:', error);
//         return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
//             status: 500,
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });
//     }
// }
