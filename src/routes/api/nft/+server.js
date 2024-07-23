// import the wallet id from the store
import { accountId } from '../../../store/wallet-store';
let id = accountId;

export async function GET({ params }) {
  try {
    const { contract, id } = params;
    const apiUrl = `https://api2.nearblocks.io/v1/nfts/${contract}/tokens/${id}/txns?page=1&per_page=25`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    } 

    const transactions = await response.json(); 

    return new Response(JSON.stringify(transactions));
  } catch (error) {
    console.error('Error fetching NFT transactions:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
