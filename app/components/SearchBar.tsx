'use client';

import { useCluster } from '@providers/cluster';
import { VersionedMessage } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { getDisplayDomain } from '@utils/punycode';
import bs58 from 'bs58';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useId } from 'react';
import { Search } from 'react-feather';
import { ActionMeta, InputActionMeta, ValueType } from 'react-select';
import AsyncSelect from 'react-select/async';

import { FetchedDomainInfo } from '../api/domain-info/[domain]/route';
import { LOADER_IDS, LoaderName, PROGRAM_INFO_BY_ID, SPECIAL_IDS, SYSVAR_IDS } from '../utils/programs';
import { searchTokens } from '../utils/token-search';
import { MIN_MESSAGE_LENGTH } from './inspector/RawInputCard';

interface SearchOptions {
    label: string;
    options: {
        label: string;
        value: string[];
        pathname: string;
    }[];
}

const isX1NSDomain = (value: string) => {
    // Check if it's specifically an X1NS domain or partial X1NS domain
    
    // If no dot, check if the search looks like a domain name
    if (!value.includes('.')) {
        // Trigger domain search for:
        // - 1+ characters (including emojis which can be 1 visual char but 2 JS chars)
        // - But not long base58 addresses (30+ chars)
        return value.length >= 1 && value.length < 30;
    }
    
    const parts = value.split('.');
    const tld = parts[parts.length - 1].toLowerCase();
    const x1nsTlds = ['x1', 'xnt', 'xen'];
    
    // If TLD is complete and matches X1NS, or if user is typing a TLD
    return x1nsTlds.includes(tld) || 
           x1nsTlds.some(validTld => validTld.startsWith(tld) && tld.length > 0);
};

export function SearchBar() {
    const [search, setSearch] = React.useState('');
    const selectRef = React.useRef<AsyncSelect<any> | null>(null);
    const router = useRouter();
    const { cluster, clusterInfo } = useCluster();
    const searchParams = useSearchParams();
    const onChange = ({ pathname }: ValueType<any, false>, meta: ActionMeta<any>) => {
        if (meta.action === 'select-option') {
            // Always use the pathname directly if it contains query params
            if (pathname.includes('?')) {
                router.push(pathname);
            } else {
                // Only preserve existing query params for paths without their own params
                const nextQueryString = searchParams?.toString();
                router.push(`${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`);
            }
            setSearch('');
        }
    };

    const onInputChange = (value: string, { action }: InputActionMeta) => {
        if (action === 'input-change') {
            setSearch(value);
        }
    };

    async function performSearch(search: string): Promise<SearchOptions[]> {
        // Check for X1NS domains first (.x1, .xnt, .xen) - only if it's X1NS specific
        const domainOptions = isX1NSDomain(search) ? await buildDomainOptions(search, cluster) : null;
        
        const localOptions = buildOptions(search, cluster, clusterInfo?.epochInfo.epoch);
        let tokenOptions;
        try {
            tokenOptions = await buildTokenOptions(search, cluster);
        } catch (e) {
            console.error(`Failed to build token options for search: ${e instanceof Error ? e.message : e}`);
        }
        const tokenOptionsAppendable = tokenOptions ? [tokenOptions] : [];

        // Domain options appear first, then local options, then tokens
        const allOptions = [
            ...(domainOptions || []),
            ...localOptions,
            ...tokenOptionsAppendable
        ];
        
        return allOptions;
    }

    const resetValue = '' as any;
    return (
        <div className="container my-4">
            <div className="row align-items-center">
                <div className="col">
                    <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={performSearch}
                        autoFocus
                        inputId={useId()}
                        ref={selectRef}
                        noOptionsMessage={() => 'No Results'}
                        loadingMessage={() => 'loading...'}
                        placeholder="Search for blocks, accounts, transactions, programs, and tokens"
                        value={resetValue}
                        inputValue={search}
                        blurInputOnSelect
                        onMenuClose={() => selectRef.current?.blur()}
                        onChange={onChange}
                        styles={{
                            input: style => ({ ...style, width: '100%' }),
                            /* work around for https://github.com/JedWatson/react-select/issues/3857 */
                            placeholder: style => ({ ...style, pointerEvents: 'none' }),
                        }}
                        onInputChange={onInputChange}
                        components={{ DropdownIndicator }}
                        classNamePrefix="search-bar"
                        /* workaround for https://github.com/JedWatson/react-select/issues/5714 */
                        onFocus={() => {
                            selectRef.current?.handleInputChange(search, { action: 'set-value' });
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

function buildProgramOptions(search: string, cluster: Cluster) {
    const matchedPrograms = Object.entries(PROGRAM_INFO_BY_ID).filter(([address, { name, deployments }]) => {
        if (!deployments.includes(cluster)) return false;
        return name.toLowerCase().includes(search.toLowerCase()) || address.includes(search);
    });

    if (matchedPrograms.length > 0) {
        return {
            label: 'Programs',
            options: matchedPrograms.map(([address, { name }]) => ({
                label: name,
                pathname: '/address/' + address,
                value: [name, address],
            })),
        };
    }
}

const SEARCHABLE_LOADERS: LoaderName[] = ['BPF Loader', 'BPF Loader 2', 'BPF Upgradeable Loader'];

function buildLoaderOptions(search: string) {
    const matchedLoaders = Object.entries(LOADER_IDS).filter(([address, name]) => {
        return (
            SEARCHABLE_LOADERS.includes(name) &&
            (name.toLowerCase().includes(search.toLowerCase()) || address.includes(search))
        );
    });

    if (matchedLoaders.length > 0) {
        return {
            label: 'Program Loaders',
            options: matchedLoaders.map(([id, name]) => ({
                label: name,
                pathname: '/address/' + id,
                value: [name, id],
            })),
        };
    }
}

function buildSysvarOptions(search: string) {
    const matchedSysvars = Object.entries(SYSVAR_IDS).filter(([address, name]) => {
        return name.toLowerCase().includes(search.toLowerCase()) || address.includes(search);
    });

    if (matchedSysvars.length > 0) {
        return {
            label: 'Sysvars',
            options: matchedSysvars.map(([id, name]) => ({
                label: name,
                pathname: '/address/' + id,
                value: [name, id],
            })),
        };
    }
}

function buildSpecialOptions(search: string) {
    const matchedSpecialIds = Object.entries(SPECIAL_IDS).filter(([address, name]) => {
        return name.toLowerCase().includes(search.toLowerCase()) || address.includes(search);
    });

    if (matchedSpecialIds.length > 0) {
        return {
            label: 'Accounts',
            options: matchedSpecialIds.map(([id, name]) => ({
                label: name,
                pathname: '/address/' + id,
                value: [name, id],
            })),
        };
    }
}

async function buildTokenOptions(search: string, cluster: Cluster): Promise<SearchOptions | undefined> {
    const matchedTokens = await searchTokens(search, cluster);

    if (matchedTokens.length > 0) {
        return {
            label: 'Tokens',
            options: matchedTokens,
        };
    }
}

async function buildDomainOptions(search: string, _cluster: Cluster): Promise<SearchOptions[] | null> {
    try {
        // Check if search has domain syntax (name.tld)
        const hasDot = search.includes('.');
        
        if (hasDot) {
            // User typed full domain, resolve it
            const domainInfoResponse = await fetch(`/api/domain-info/${search}`, {
                cache: 'no-store'
            });
            const domainInfo = (await domainInfoResponse.json()) as FetchedDomainInfo;

            if (domainInfo && domainInfo.owner && domainInfo.address) {
                // Decode punycode to show emojis correctly
                const displayName = getDisplayDomain(search);
                
                return [
                    {
                        label: 'Domain',
                        options: [
                            {
                                label: displayName,
                                pathname: '/domain/' + encodeURIComponent(search),
                                value: [search],
                            },
                        ],
                    },
                    {
                        label: 'Domain Owner',
                        options: [
                            {
                                label: domainInfo.owner,
                                pathname: '/address/' + domainInfo.owner,
                                value: [domainInfo.owner],
                            },
                        ],
                    },
                    {
                        label: 'Name Service Account',
                        options: [
                            {
                                label: domainInfo.address,
                                pathname: '/address/' + domainInfo.address,
                                value: [domainInfo.address],
                            },
                        ],
                    },
                ];
            }
        } else {
            // Use exact match search (SDK-based, no indexer dependency)
            
            // Only search if 2+ characters (reduce load)
            if (search.length < 2) {
                return null;
            }
            const tlds = ['x1', 'xnt', 'xen'];
            const exactMatches: any[] = [];
            
            for (const tld of tlds) {
                const fullDomain = `${search}.${tld}`;
                try {
                    const response = await fetch(
                        `/api/domain-info/${encodeURIComponent(fullDomain)}`,
                        { cache: 'no-store', signal: AbortSignal.timeout(1000) }
                    );
                    const info = await response.json();
                    
                    if (info && info.owner && info.address) {
                        exactMatches.push({
                            address: info.address,
                            domain: fullDomain,
                            owner: info.owner,
                        });
                    }
                } catch (e) {
                    // Domain doesn't exist or timeout
                }
            }
            
            if (exactMatches.length > 0) {
                // Check primary domain status for each match using X1NS API
                await Promise.all(
                    exactMatches.map(async (d) => {
                        try {
                            const primaryResp = await fetch(
                                `https://api.x1ns.xyz/api/primary/${d.owner}`,
                                { cache: 'no-store', signal: AbortSignal.timeout(1000) }
                            );
                            if (primaryResp.ok) {
                                const primaryData = await primaryResp.json();
                                // Check if THIS domain is the owner's primary
                                if (primaryData && primaryData.hasPrimary && primaryData.domain === d.domain) {
                                    d.is_owner_primary = true;
                                }
                            }
                        } catch (e) {
                            // Continue without primary check
                        }
                    })
                );
                
                return [{
                    label: 'Domain Owner',
                    options: exactMatches.map(d => ({
                        label: d.owner,
                        pathname: '/address/' + d.owner,
                        value: [d.owner],
                    })),
                }, {
                    label: 'Domain Name',
                    options: exactMatches.map(d => ({
                        label: getDisplayDomain(d.domain),
                        // If domain is owner's primary, go to owner address (shows their profile)
                        // Otherwise, go to domain detail page
                        pathname: d.is_owner_primary 
                            ? '/address/' + d.owner 
                            : '/domain/' + encodeURIComponent(d.domain),
                        value: [d.domain],
                    })),
                }];
            }
        }
    } catch (error) {
        console.error('Error fetching domain info:', error);
    }
    return null;
}

// builds local search options
function buildOptions(rawSearch: string, cluster: Cluster, currentEpoch?: bigint) {
    const search = rawSearch.trim();
    if (search.length === 0) return [];

    const options = [];

    const programOptions = buildProgramOptions(search, cluster);
    if (programOptions) {
        options.push(programOptions);
    }

    const loaderOptions = buildLoaderOptions(search);
    if (loaderOptions) {
        options.push(loaderOptions);
    }

    const sysvarOptions = buildSysvarOptions(search);
    if (sysvarOptions) {
        options.push(sysvarOptions);
    }

    const specialOptions = buildSpecialOptions(search);
    if (specialOptions) {
        options.push(specialOptions);
    }

    if (!isNaN(Number(search))) {
        options.push({
            label: 'Block',
            options: [
                {
                    label: `Slot #${search}`,
                    pathname: `/block/${search}`,
                    value: [search],
                },
            ],
        });

        // Parse as BigInt but not if it starts eg 0x or 0b
        if (currentEpoch !== undefined && !/^0\w/.test(search) && BigInt(search) <= currentEpoch + 1n) {
            options.push({
                label: 'Epoch',
                options: [
                    {
                        label: `Epoch #${search}`,
                        pathname: `/epoch/${search}`,
                        value: [search],
                    },
                ],
            });
        }
    }

    // Prefer nice suggestions over raw suggestions
    if (options.length > 0) return options;

    try {
        const decoded = bs58.decode(search);
        if (decoded.length === 32) {
            options.push({
                label: 'Account',
                options: [
                    {
                        label: search,
                        pathname: '/address/' + search,
                        value: [search],
                    },
                ],
            });
        } else if (decoded.length === 64) {
            options.push({
                label: 'Transaction',
                options: [
                    {
                        label: search,
                        pathname: '/tx/' + search,
                        value: [search],
                    },
                ],
            });
        }
    } catch (err) {
        // If bs58 decoding fails, check if it's a valid base64 string
        if (isValidBase64(search)) {
            const decodedTx = decodeTransactionFromBase64(search);
            if (decodedTx) {
                const pathname = '/tx/inspector';
                const searchParams = new URLSearchParams();

                searchParams.set('message', encodeURIComponent(decodedTx.message));

                if (decodedTx.signatures) {
                    searchParams.set('signatures', encodeURIComponent(JSON.stringify(decodedTx.signatures)));
                }

                options.push({
                    label: 'Transaction Inspector',
                    options: [
                        {
                            label: 'Inspect Decoded Transaction',
                            pathname: `${pathname}?${searchParams.toString()}`,
                            value: [search],
                        },
                    ],
                });
            }
        }
    }

    return options;
}

function decodeTransactionFromBase64(base64String: string): {
    message: string;
    signatures?: string[];
} | null {
    try {
        const buffer = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));

        if (buffer.length < MIN_MESSAGE_LENGTH) {
            return null;
        }

        // Try to parse as full transaction first
        let offset = 0;
        const numSignatures = buffer[offset++];

        // Check if message version matches signatures
        const requiredSignaturesByteOffset = 1 + numSignatures * 64;
        const versionOffset =
            VersionedMessage.deserializeMessageVersion(buffer.slice(requiredSignaturesByteOffset)) !== 'legacy' ? 1 : 0;

        const numRequiredSignaturesFromMessage = buffer[requiredSignaturesByteOffset + versionOffset];

        const signatures: string[] = [];

        // If signatures match message requirements, parse as full transaction
        if (numRequiredSignaturesFromMessage === numSignatures) {
            for (let i = 0; i < numSignatures; i++) {
                const sigBytes = buffer.subarray(offset, offset + 64);
                if (sigBytes.length !== 64) return null;
                signatures.push(bs58.encode(sigBytes));
                offset += 64;
            }

            // Encode remaining buffer as base64 message
            const messageBase64 = btoa(String.fromCharCode.apply(null, Array.from(buffer.slice(offset))));
            return {
                message: messageBase64,
                signatures,
            };
        }

        // If no valid signatures found, treat entire buffer as message
        return {
            message: base64String,
        };
    } catch (err) {
        return null;
    }
}

function isValidBase64(str: string): boolean {
    try {
        Buffer.from(str, 'base64');
        return true;
    } catch (err) {
        return false;
    }
}

function DropdownIndicator() {
    return (
        <div className="search-indicator">
            <Search className="me-2" size={15} />
        </div>
    );
}
