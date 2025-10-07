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
  voteCountLast50Epochs: number;
  voteCountLast500Epochs: number;
  voteCreditsPreviousEpoch: number;
  voteCreditsLast50Epochs: number;
  voteCreditsLast500Epochs: number;
  leaderSlotsPreviousEpoch: number
  blocksProducedPreviousEpoch: number
  skippedSlotsPreviousEpoch: number
  skipRatePreviousEpoch: number
  leaderSlotsLast50Epochs: number
  blocksProducedLast50Epochs: number
  skipRateLast50Epochs: number
  skippedSlotsLast50Epochs: number
  leaderSlotsLast500Epochs: number
  blocksProducedLast500Epochs: number
  skippedSlotsLast500Epochs: number
  skipRateLast500Epochs: number
  activatedStakePercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function fetchXolanaValidators(
  limit = 500,
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
