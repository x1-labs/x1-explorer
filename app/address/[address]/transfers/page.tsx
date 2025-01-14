import { TokenTransfersCard } from '@components/account/history/TokenTransfersCard';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return {
        description: `History of all token transfers involving the address ${props.params.address} on X1 Network ™`,
        title: `Transfers | ${await getReadableTitleFromAddress(props)} | X1 Network ™`,
    };
}

export default function TokenTransfersPage({ params: { address } }: Props) {
    return <TokenTransfersCard address={address} />;
}
