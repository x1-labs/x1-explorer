'use client';

import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { getDisplayDomain } from '@utils/punycode';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { Address } from './Address';

interface AddressWithDomainProps {
    pubkey: PublicKey;
    alignRight?: boolean;
    link?: boolean;
    raw?: boolean;
    truncate?: boolean;
    truncateUnknown?: boolean;
    truncateChars?: number;
    useMetadata?: boolean;
    overrideText?: string;
}

/**
 * Enhanced Address component that shows X1NS domain names when available
 * Falls back to regular address display if no domain is set
 */
export function AddressWithDomain(props: AddressWithDomainProps) {
    const { pubkey, link = true } = props;
    const { cluster, url } = useCluster();
    const [domainName, setDomainName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDomain = async () => {
            try {
                setLoading(true);
                
                // Dynamically import X1NS SDK
                const { X1NSClient, getPrimaryDomain, getReverseLookupKey, ReverseLookup } = await import('@x1ns/sdk');
                const { getSplNameServiceProgramId, getCentralStateAddress, getTldRootDomain } = await import('@x1ns/constants');

                const network = cluster === Cluster.MainnetBeta ? 'mainnet' : 'testnet';
                
                // Create X1NS client (it will handle the connection internally)
                const client = new X1NSClient({ network, rpcUrl: url });

                // Fetch primary domain for this address
                const primaryDomainData = await getPrimaryDomain(client.connection, pubkey, network);

                if (primaryDomainData && primaryDomainData.domain) {
                    // Fetch reverse lookup account to get the domain name
                    const centralState = getCentralStateAddress(network);
                    const splNameService = getSplNameServiceProgramId(network);
                    const reverseLookupKey = await getReverseLookupKey(
                        primaryDomainData.domain,
                        centralState,
                        splNameService
                    );

                    const reverseLookupAccount = await client.connection.getAccountInfo(reverseLookupKey);
                    
                    if (reverseLookupAccount) {
                        const reverseData = ReverseLookup.deserialize(Buffer.from(reverseLookupAccount.data));
                        
                        // Get the domain account to determine TLD
                        const domainAccount = await client.connection.getAccountInfo(primaryDomainData.domain);
                        
                        let tld = 'x1'; // default
                        if (domainAccount && domainAccount.data.length >= 32) {
                            const xntRoot = getTldRootDomain('xnt', network);
                            const xenRoot = getTldRootDomain('xen', network);
                            
                            const parentBytes = domainAccount.data.slice(0, 32);
                            const parent = new PublicKey(parentBytes);
                            
                            if (parent.equals(xntRoot)) tld = 'xnt';
                            else if (parent.equals(xenRoot)) tld = 'xen';
                        }
                        
                        // Construct full domain with TLD and decode punycode
                        const fullDomain = `${reverseData.name}.${tld}`;
                        const displayName = getDisplayDomain(fullDomain);
                        setDomainName(displayName);
                    }
                }
            } catch (error) {
                // Silently fail - just show address if domain lookup fails
                console.debug('No domain found for address:', pubkey.toBase58());
            } finally {
                setLoading(false);
            }
        };

        fetchDomain();
    }, [pubkey, cluster, url]);

    // Show domain name if available
    if (!loading && domainName) {
        if (link) {
            return (
                <div className={`d-flex align-items-center ${props.alignRight ? 'justify-content-end' : ''}`}>
                    <Link href={`/address/${pubkey.toBase58()}`} className="text-decoration-none">
                        <span className="badge bg-success-soft me-2">
                            {domainName}
                        </span>
                    </Link>
                    <span className="text-muted small">✨</span>
                </div>
            );
        }
        return (
            <div className={`d-flex align-items-center ${props.alignRight ? 'justify-content-end' : ''}`}>
                <span className="badge bg-success-soft me-2">
                    {domainName}
                </span>
                <span className="text-muted small">✨</span>
            </div>
        );
    }

    // Fall back to regular Address component if no domain or still loading
    return <Address {...props} />;
}

