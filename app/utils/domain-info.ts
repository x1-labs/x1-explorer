import { Connection } from '@solana/web3.js';

import { getX1NSDomainInfo as getX1NSInfo, isX1NSDomain } from './x1ns-resolver';

export interface DomainInfo {
    address: string;
    name: string;
    owner?: string;
}

export const hasDomainSyntax = (value: string) => {
    return value.length > 3 && value.split('.').length === 2;
};

// X1NS domain resolution (.x1, .xnt, .xen)
export async function getX1NSDomainInfo(domain: string, connection: Connection, network: 'mainnet' | 'testnet' = 'mainnet') {
    return await getX1NSInfo(domain, connection, network);
}

// Export the check function
export { isX1NSDomain };
