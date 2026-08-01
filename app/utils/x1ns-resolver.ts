import { Connection, PublicKey } from '@solana/web3.js';

/**
 * X1NS Domain Resolution for X1 Explorer
 * Supports: .x1, .xnt, .xen TLDs
 */

export interface X1NSDomainInfo {
    address: PublicKey;
    name: string;
    owner: PublicKey;
}

/**
 * Check if a domain uses X1NS TLDs
 * X1NS uses .x1, .xnt, .xen on BOTH mainnet and testnet
 */
export const isX1NSDomain = (domain: string): boolean => {
    const x1nsTlds = ['.x1', '.xnt', '.xen'];
    return x1nsTlds.some(tld => domain.toLowerCase().endsWith(tld));
};

/**
 * Resolve X1NS domain to owner and address
 * @param domain - Full domain name (e.g., "alice.x1", "token.xnt")
 * @param connection - Solana connection
 * @param network - Network to use ('mainnet' | 'testnet'), defaults to 'mainnet'
 * @returns Domain info or null if not found
 */
export async function resolveX1NSDomain(
    domain: string,
    connection: Connection,
    network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<X1NSDomainInfo | null> {
    try {
        // Dynamically import X1NS SDK
        const { X1NSClient } = await import('@x1ns/sdk');
        
        // Create client with specified network
        const client = new X1NSClient({ 
            network,
            rpcUrl: connection.rpcEndpoint 
        });
        
        // Resolve the domain
        const result = await client.resolveDomain(domain);
        
        if (!result) {
            return null;
        }
        
    return {
        address: result.address,
        name: result.name,
        owner: result.owner,
    };
    } catch (error) {
        console.error('Error resolving X1NS domain:', error);
        return null;
    }
}

/**
 * Get X1NS domain info in explorer-compatible format
 * For explorer search: Returns the wallet that owns/controls this domain
 * 
 * Priority:
 * 1. If domain is NFT → use NFT owner
 * 2. Otherwise → use the domain account owner
 * 
 * @param domain - Full domain name
 * @param connection - Solana connection
 * @param network - Network type
 * @returns Object with address and owner as strings, or null
 */
export async function getX1NSDomainInfo(
    domain: string,
    connection: Connection,
    network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<{ address: string; owner: string } | null> {
    const result = await resolveX1NSDomain(domain, connection, network);
    
    if (!result) {
        return null;
    }
    
    // Check if domain is an NFT and get NFT owner
    let actualOwner = result.owner; // Default to domain account owner
    
    try {
        const { getNameTokenizerProgramId } = await import('@x1ns/constants');
        const nameTokenizerProgramId = getNameTokenizerProgramId(network);
        
        // Check if NFT record exists
        const [nftRecordPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('nft_record'), result.address.toBuffer()],
            nameTokenizerProgramId
        );
        
        const nftRecordInfo = await connection.getAccountInfo(nftRecordPDA);
        
        if (nftRecordInfo && nftRecordInfo.data.length >= 66) {
            // NFT Record exists - read NFT owner from offset 34-66
            const nftOwnerBytes = nftRecordInfo.data.slice(34, 66);
            actualOwner = new PublicKey(nftOwnerBytes);
        }
    } catch (err) {
        // Not an NFT domain or error checking - use domain account owner
    }
    
    return {
        address: result.address.toString(), // Domain account address (for "Name Service Account" display)
        owner: actualOwner.toString(),      // Actual owner (NFT owner if NFT, else domain account owner)
    };
}

