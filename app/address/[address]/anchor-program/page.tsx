import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { redirect } from 'next/navigation';
import { Metadata } from 'next/types';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return {
        description: `The Interface Definition Language (IDL) file for the Anchor program at address ${props.params.address} on X1 Network ™`,
        title: `Anchor Program IDL | ${await getReadableTitleFromAddress(props)} | X1 Network ™`,
    };
}
/**
 * @deprecated This route is deprecated. Programs may have multiple IDLs.
 * The Anchor program IDL page has been renamed to a more generic one.
 */
export default function DeprecatedAnchorProgramIDLPage({ params: { address } }: Props) {
    return redirect(`/address/${address}/idl`);
}
