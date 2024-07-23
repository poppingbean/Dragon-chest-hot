import { json } from '@sveltejs/kit';

/**
 * @param {string} operationsDoc
 * @param {string} operationName
 * @param {{}} variables
 */
async function fetchGraphQL(operationsDoc, operationName, variables) {
    try {
        const response = await fetch(
            "https://graph.mintbase.xyz/mainnet",
            {
                method: "POST",
                body: JSON.stringify({
                    query: operationsDoc,
                    variables: variables,
                    operationName: operationName
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'mb-api-key': 'anon'
                },
            }
        );

        if (!response.ok) {
            const responseText = await response.text();
            console.error('GraphQL API error:', responseText);
            throw new Error(`GraphQL API error: ${responseText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching GraphQL data:', error);
        throw error;
    }
}



// Function to filter NFTs containing "egg" in their attributes
/**
 * @param {any[]} nfts
 */
function filterNFTs(nfts) {
    return nfts.filter(nft => {
        const hasEgg = nft.description?.toLowerCase().includes('egg') ||
            nft.title?.toLowerCase().includes('egg') ||
            nft.extra?.toLowerCase().includes('egg') ||
            nft.mint_memo?.toLowerCase().includes('egg');
        return hasEgg;
    });
}

// GET request handler
export async function GET({ url }) {
    try {
        const account = String(url.searchParams.get('account') ?? '');

        const operationsDoc = `
  query MyQuery($_lte: String = "", $owner: String = "`+account+`") {
    mb_views_nft_tokens(
      where: {owner: {_eq: $owner}, nft_contract: {}, nft_contract_name: {}}
    ) {
      base_uri
      burned_receipt_id
      burned_timestamp
      copies
      description
      expires_at
      extra
      issued_at
      last_transfer_receipt_id
      last_transfer_timestamp
      media
      media_hash
      metadata_content_flag
      metadata_id
      mint_memo
      minted_receipt_id
      minted_timestamp
      minter
      nft_contract_content_flag
      nft_contract_created_at
      nft_contract_icon
      nft_contract_id
      nft_contract_is_mintbase
      nft_contract_name
      nft_contract_owner_id
      nft_contract_reference
      nft_contract_spec
      nft_contract_symbol
      owner
      reference
      reference_blob
      reference_hash
      royalties
      royalties_percent
      splits
      starts_at
      title
      token_id
      updated_at
    }
  }
`;


        const { errors, data } = await fetchGraphQL(operationsDoc, "MyQuery", {});

        if (errors && errors.length > 0) {
            console.error('GraphQL errors:', errors);
            return json({ errors });
        }

        if (!data || !data.mb_views_nft_tokens) {
            console.error('No data returned from GraphQL query.');
            return new Response('No data returned from GraphQL query.', { status: 500 });
        }

        const filteredData = filterNFTs(data.mb_views_nft_tokens);

        // Return the filtered data as JSON
        return json(filteredData);
    } catch (error) {
        console.error('Error handling GET request:', error);
        return new Response('Error fetching data from GraphQL API', { status: 500 });
    }
}