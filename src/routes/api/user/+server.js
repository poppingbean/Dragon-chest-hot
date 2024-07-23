export async function GET({ params }) {
  try {
    const userId = params.userId;
    const inventoryUrl = `https://api2.nearblocks.io/v1/account/${userId}/inventory`;

    const response = await fetch(inventoryUrl);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    } 

    const data = await response.json();
    const eggsData = data.inventory.nfts;  // Adapt the property if needed 

    const returnData = eggsData.filter(element => 
      element.nft_meta.name.toLowerCase().includes('egg')
    );

    return new Response(JSON.stringify(returnData));
  } catch (error) {
    console.error('Error fetching eggs inventory:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
