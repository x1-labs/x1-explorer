'use client';

import { Address } from '@components/common/Address';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { getDisplayDomain } from '@utils/punycode';
import React, { useEffect, useState } from 'react';

interface X1NSDomainInfo {
    address: string;
    domain: string;
    isNft: boolean;
    tld: string;
}

export function DomainsCard({ address }: { address: string }) {
    const [domains, setDomains] = useState<X1NSDomainInfo[] | null>(null);
    const [loading, setLoading] = useState(true);
    const { cluster } = useCluster();

    useEffect(() => {
        const fetchDomains = async () => {
            try {
                setLoading(true);
                
                // Use SDK to fetch domains (both regular and NFT)
                const { X1NSClient } = await import('@x1ns/sdk');
                const { PublicKey } = await import('@solana/web3.js');
                const { ReverseLookup, getReverseLookupKey } = await import('@x1ns/sdk');
                const { 
                    getSplNameServiceProgramId, 
                    getCentralStateAddress, 
                    getTldRootDomain,
                    getNameTokenizerProgramId 
                } = await import('@x1ns/constants');
                
                const network = cluster === Cluster.MainnetBeta ? 'mainnet' : 'testnet';
                const client = new X1NSClient({ network });
                const ownerPubkey = new PublicKey(address);
                
                const splNameService = getSplNameServiceProgramId(network);
                const centralState = getCentralStateAddress(network);
                const nameTokenizerProgramId = getNameTokenizerProgramId(network);
                const domains: X1NSDomainInfo[] = [];
                
                // Step 1: Get regular domains (domain account owner matches)
                const tlds: Array<'x1' | 'xnt' | 'xen'> = ['x1', 'xnt', 'xen'];
                
                for (const tld of tlds) {
                    try {
                        const rootDomain = getTldRootDomain(tld, network);
                        
                        // Get all name accounts for this TLD
                        const accounts = await client.connection.getProgramAccounts(splNameService, {
                            filters: [
                                {
                                    memcmp: {
                                        bytes: rootDomain.toBase58(),
                                        offset: 0 // Parent name is at offset 0-32
                                    }
                                }
                            ]
                        });
                        
                        // Check each account to see if owner matches
                        for (const account of accounts) {
                            try {
                                if (account.account.data.length >= 96) {
                                    const accountOwner = new PublicKey(Buffer.from(account.account.data.subarray(32, 64)));
                                    
                                    if (accountOwner.equals(ownerPubkey)) {
                                        // Found a domain owned by this address
                                        const reverseLookupKey = await getReverseLookupKey(
                                            account.pubkey,
                                            centralState,
                                            splNameService
                                        );
                                        
                                        const reverseAccount = await client.connection.getAccountInfo(reverseLookupKey);
                                        
                                        if (reverseAccount) {
                                            const reverseData = ReverseLookup.deserialize(reverseAccount.data);
                                            const domainName = `${reverseData.name}.${tld}`;
                                            
                                            // Check if NFT domain
                                            let isNft = false;
                                            try {
                                                const [nftRecordPDA] = PublicKey.findProgramAddressSync(
                                                    [Buffer.from('nft_record'), account.pubkey.toBuffer()],
                                                    nameTokenizerProgramId
                                                );
                                                const nftRecordInfo = await client.connection.getAccountInfo(nftRecordPDA);
                                                isNft = nftRecordInfo !== null;
                                            } catch (err) {
                                                // Not an NFT
                                            }
                                            
                                            domains.push({
                                                address: account.pubkey.toBase58(),
                                                domain: domainName,
                                                isNft,
                                                tld: `.${tld}`
                                            });
                                        }
                                    }
                                }
                            } catch (err) {
                                continue;
                            }
                        }
                    } catch (err) {
                        continue;
                    }
                }
                
                // Step 2: Get NFT domains (NFT owner matches, but domain account owner doesn't)
                try {
                    // Query all NFT records and check if NFT owner matches
                    // NFT record structure: discriminator(8) + nft_mint(32) + nft_owner(32) + ...
                    // Owner is at offset 34-66
                    const nftRecordAccounts = await client.connection.getProgramAccounts(nameTokenizerProgramId, {
                        filters: [
                            {
                                memcmp: {
                                    bytes: ownerPubkey.toBase58(),
                                    offset: 34 // NFT owner is at offset 34-66
                                },
                            },
                        ],
                    });
                    
                    for (const { account } of nftRecordAccounts) {
                        try {
                            if (account.data.length >= 66) {
                                // Read domain address from NFT record (offset 2-34)
                                const domainAddressBytes = account.data.slice(2, 34);
                                const domainAddress = new PublicKey(domainAddressBytes);
                                
                                // Resolve domain to get name
                                const domainInfo = await client.resolveDomain(domainAddress.toBase58());
                                if (!domainInfo) {
                                    // Try to get reverse lookup for this domain address
                                    const reverseLookupKey = await getReverseLookupKey(
                                        domainAddress,
                                        centralState,
                                        splNameService
                                    );
                                    const reverseAccount = await client.connection.getAccountInfo(reverseLookupKey);
                                    
                                    if (reverseAccount) {
                                        const reverseData = ReverseLookup.deserialize(reverseAccount.data);
                                        const domainName = reverseData.name;
                                        
                                        // Check if already added (avoid duplicates)
                                        const alreadyAdded = domains.some(d => d.address === domainAddress.toBase58());
                                        if (!alreadyAdded) {
                                            const parts = domainName.split('.');
                                            const tld = parts[parts.length - 1] || '';
                                            
                                            domains.push({
                                                address: domainAddress.toBase58(),
                                                domain: domainName,
                                                isNft: true,
                                                tld: `.${tld}`
                                            });
                                        }
                                    }
                                }
                            }
                        } catch (err) {
                            continue;
                        }
                    }
                } catch (nftErr) {
                    console.warn('Error fetching NFT domains:', nftErr);
                }
                
                setDomains(domains);
            } catch (error) {
                console.error('Error fetching X1NS domains:', error);
                setDomains([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDomains();
    }, [address, cluster]);

    if (loading) {
        return <LoadingCard message="Loading X1NS domains" />;
    }

    if (!domains || domains.length === 0) {
        return <ErrorCard text="No X1NS domain names found" />;
    }

    // Sort domains alphabetically
    const sortedDomains = [...domains].sort((a, b) => a.domain.localeCompare(b.domain));

    return (
        <div className="card">
            <div className="card-header align-items-center">
                <h3 className="card-header-title">Owned X1NS Domain Names</h3>
            </div>
            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="text-muted">Domain Name</th>
                            <th className="text-muted">Type</th>
                            <th className="text-muted">Name Service Account</th>
                        </tr>
                    </thead>
                    <tbody className="list">
                        {sortedDomains.map(domain => (
                            <RenderDomainRow key={domain.address} domainInfo={domain} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function RenderDomainRow({ domainInfo }: { domainInfo: X1NSDomainInfo }) {
    // Decode punycode to show emojis correctly
    const displayName = getDisplayDomain(domainInfo.domain);
    
    return (
        <tr>
            <td>
                <a href={`/domain/${encodeURIComponent(domainInfo.domain)}`} className="text-decoration-none">
                    <span className="badge bg-primary-soft">{displayName}</span>
                </a>
            </td>
            <td>
                {domainInfo.isNft ? (
                    <span className="badge bg-info-soft">NFT Domain</span>
                ) : (
                    <span className="badge bg-secondary-soft">Standard</span>
                )}
            </td>
            <td>
                <Address pubkey={new PublicKey(domainInfo.address)} link />
            </td>
        </tr>
    );
}
