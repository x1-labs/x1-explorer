'use client';

import { Address } from '@components/common/Address';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { TableCardBody } from '@components/common/TableCardBody';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { getDisplayDomain } from '@utils/punycode';
import React, { useEffect, useState } from 'react';

interface DomainData {
    address: string;
    isNft: boolean;
    name: string;
    owner: string;
    records: Record<string, string>;
}

export function DomainDetailsCard({ domain }: { domain: string }) {
    const [domainData, setDomainData] = useState<DomainData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { cluster } = useCluster();

    useEffect(() => {
        const fetchDomainDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                // Dynamically import X1NS SDK
                const { X1NSClient, RecordType, getRecord } = await import('@x1ns/sdk');

                // Determine network from cluster
                const network = cluster === Cluster.MainnetBeta ? 'mainnet' : 'testnet';

                // Create client
                const client = new X1NSClient({ network });

                // Resolve the domain
                const domainInfo = await client.resolveDomain(domain);

                if (!domainInfo) {
                    setError(`Domain "${domain}" not found`);
                    setDomainData(null);
                    return;
                }

                // Fetch all DNS records
                const records: Record<string, string> = {};
                const recordTypes = Object.values(RecordType) as string[];

                for (const recordType of recordTypes) {
                    try {
                        const recordValue = await getRecord(
                            client.connection,
                            domainInfo.address,
                            recordType as typeof RecordType[keyof typeof RecordType],
                            network
                        );
                        if (recordValue) {
                            records[recordType] = recordValue;
                        }
                    } catch (err) {
                        // Skip if record doesn't exist
                    }
                }

                // Check if it's an NFT domain and get NFT owner from NFT record account
                let isNft = false;
                let actualOwner = domainInfo.owner.toBase58();
                
                try {
                    const { getNameTokenizerProgramId } = await import('@x1ns/constants');
                    const nameTokenizerProgramId = getNameTokenizerProgramId(network);
                    
                    // Check if NFT record exists and read owner from it
                    const [nftRecordPDA] = PublicKey.findProgramAddressSync(
                        [Buffer.from('nft_record'), domainInfo.address.toBuffer()],
                        nameTokenizerProgramId
                    );
                    const nftRecordInfo = await client.connection.getAccountInfo(nftRecordPDA);
                    isNft = nftRecordInfo !== null;
                    
                    // If it's an NFT domain, read the owner directly from NFT record account data
                    // NFT record account structure:
                    // offset 2-34: nft_mint (32 bytes)
                    // offset 34-66: nft_owner (32 bytes)
                    if (isNft && nftRecordInfo) {
                        console.log('NFT Record found, data length:', nftRecordInfo.data.length);
                        console.log('NFT Record data (first 100 bytes):', Buffer.from(nftRecordInfo.data.slice(0, 100)).toString('hex'));
                        
                        if (nftRecordInfo.data.length >= 66) {
                            try {
                                // Read owner from NFT record account data (offset 34-66)
                                const ownerBytes = nftRecordInfo.data.slice(34, 66);
                                const nftOwnerFromRecord = new PublicKey(ownerBytes);
                                actualOwner = nftOwnerFromRecord.toBase58();
                                console.log('✅ NFT Owner from record (offset 34-66):', actualOwner);
                            } catch (nftErr) {
                                console.error('❌ Error reading NFT owner from record:', nftErr);
                                // Fallback: try getNftHolder method
                                try {
                                    console.log('Trying fallback: getNftHolder...');
                                    const { getNftMintPDA, getNftHolder } = await import('@x1ns/sdk');
                                    console.log('SDK imported successfully');
                                    const [nftMint] = await getNftMintPDA(domainInfo.address, network);
                                    console.log('NFT Mint PDA:', nftMint.toBase58());
                                    const nftOwner = await getNftHolder(client.connection, nftMint);
                                    console.log('getNftHolder result:', nftOwner?.toBase58() || 'null');
                                    if (nftOwner) {
                                        actualOwner = nftOwner.toBase58();
                                        console.log('✅ NFT Owner from getNftHolder:', actualOwner);
                                    } else {
                                        console.warn('⚠️ getNftHolder returned null');
                                    }
                                } catch (fallbackErr) {
                                    console.error('❌ Fallback getNftHolder also failed:', fallbackErr);
                                }
                            }
                        } else {
                            console.warn('⚠️ NFT record data too short:', nftRecordInfo.data.length, 'expected at least 66 bytes');
                        }
                    }
                } catch (err) {
                    console.error('Error checking NFT status:', err);
                    // Not an NFT domain
                }

                setDomainData({
                    address: domainInfo.address.toBase58(),
                    isNft,
                    name: domainInfo.name,
                    owner: actualOwner,
                    records,
                });
            } catch (err) {
                console.error('Error fetching domain details:', err);
                setError(err instanceof Error ? err.message : 'Failed to load domain details');
                setDomainData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDomainDetails();
    }, [domain, cluster]);

    if (loading) {
        return <LoadingCard message="Loading domain details" />;
    }

    if (error || !domainData) {
        return <ErrorCard text={error || 'Domain not found'} />;
    }

    const displayName = getDisplayDomain(domainData.name);
    const hasRecords = Object.keys(domainData.records).length > 0;

    return (
        <>
            {/* Main Domain Info Card */}
            <div className="card">
                <div className="card-header align-items-center">
                    <h3 className="card-header-title">
                        Domain: <span className="badge bg-primary-soft">{displayName}</span>
                    </h3>
                </div>

                <TableCardBody>
                    <tr>
                        <td>Domain Name</td>
                        <td className="text-lg-end">
                            <span className="badge bg-primary-soft">{displayName}</span>
                        </td>
                    </tr>
                    <tr>
                        <td>Type</td>
                        <td className="text-lg-end">
                            {domainData.isNft ? (
                                <span className="badge bg-info-soft">NFT Domain</span>
                            ) : (
                                <span className="badge bg-secondary-soft">Standard Domain</span>
                            )}
                        </td>
                    </tr>
                    <tr>
                        <td>Owner</td>
                        <td className="text-lg-end">
                            <Address pubkey={new PublicKey(domainData.owner)} alignRight link />
                        </td>
                    </tr>
                    {domainData.records.X1 && (
                        <tr>
                            <td>Resolves To (X1 Record)</td>
                            <td className="text-lg-end">
                                <Address
                                    pubkey={new PublicKey(domainData.records.X1)}
                                    alignRight
                                    link
                                />
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td>Name Service Account</td>
                        <td className="text-lg-end">
                            <Address pubkey={new PublicKey(domainData.address)} alignRight link />
                        </td>
                    </tr>
                </TableCardBody>
            </div>

            {/* DNS Records Card */}
            {hasRecords && (
                <div className="card mt-4">
                    <div className="card-header align-items-center">
                        <h3 className="card-header-title">DNS Records</h3>
                    </div>

                    <div className="table-responsive mb-0">
                        <table className="table table-sm table-nowrap card-table">
                            <thead>
                                <tr>
                                    <th className="text-muted">Record Type</th>
                                    <th className="text-muted">Value</th>
                                </tr>
                            </thead>
                            <tbody className="list">
                                {Object.entries(domainData.records).map(([type, value]) => (
                                    <tr key={type}>
                                        <td>
                                            <span className="badge bg-info-soft">{type}</span>
                                        </td>
                                        <td className="font-monospace">
                                            {type.includes('Address') || type === 'X1' || type === 'SOL' ? (
                                                <Address pubkey={new PublicKey(value)} link />
                                            ) : (
                                                value
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!hasRecords && (
                <div className="card mt-4">
                    <div className="card-header align-items-center">
                        <h3 className="card-header-title">DNS Records</h3>
                    </div>
                    <div className="card-body">
                        <p className="text-muted text-center mb-0">No DNS records configured for this domain.</p>
                    </div>
                </div>
            )}
        </>
    );
}

