import { accountId } from '../../../../store/wallet-store';


export async function GET() {
    try {
      const perPage = 50;
      const apiUrl = `https://api2.nearblocks.io/v1/nfts?search=${accountId}&per_page=${perPage}`;
  
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const nfts = await response.json();

    return new Response(JSON.stringify(nfts));
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}