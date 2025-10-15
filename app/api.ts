export interface ValidatorEntity {
  id: number;
  network: 'devnet' | 'testnet' | 'mainnet';
  gossip: string;
  rpc: string;
  version: string;
  activatedStake: number;
  lastVote: number;
  commission: number;
  nodePubkey: string;
  votePubkey: string;
  delinquent: boolean;
  epochVoteAccount: boolean;
  region: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  name: string;
  iconUrl: string;
  website: string;
  voteCountPreviousEpoch: number;
  voteCountLast10Epochs: number;
  voteCreditsPreviousEpoch: number;
  voteCreditsLast10Epochs: number;
  leaderSlotsPreviousEpoch: number
  blocksProducedPreviousEpoch: number
  skippedSlotsPreviousEpoch: number
  skipRatePreviousEpoch: number
  leaderSlotsLast10Epochs: number
  blocksProducedLast10Epochs: number
  skipRateLast10Epochs: number
  skippedSlotsLast10Epochs: number
  activatedStakePercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function fetchXolanaValidators(
  limit = 1000,
  offset = 0,
  sort = 'activatedStake',
  network = 'mainnet'
): Promise<ValidatorEntity[]> {
  const data = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/x1/validators?limit=${limit}&offset=${offset}&sort=${sort}&network=${network}`);

  if (!data.ok) {
    throw new Error("Error fetching validators");
  }

  return await data.json();
}
