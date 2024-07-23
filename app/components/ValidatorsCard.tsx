import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { PublicKey} from '@solana/web3.js';
import React, {useEffect} from 'react';
import { AlertTriangle } from 'react-feather';

import {fetchXolanaValidators, ValidatorEntity} from "@/app/api";

export function ValidatorsCard() {
    const [validators, setValidators] = React.useState<ValidatorEntity[] | null>(null);

    useEffect(() => {
        const fetchValidators = async () => {
            const response = await fetchXolanaValidators();
            setValidators(response);
        };

        fetchValidators().then();
    }, []);

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <div className="row align-items-center">
                        <div className="col">
                            <h4 className="card-header-title">Validators</h4>
                        </div>

                    </div>
                </div>

                {validators && (
                    <div className="table-responsive mb-0">
                        <table className="table table-sm table-nowrap card-table">
                            <thead>
                                <tr>
                                    <th className="text-muted">Voter Address</th>
                                    <th className="text-muted text-end">Active Stake (SOL)</th>
                                </tr>
                            </thead>
                            <tbody className="list">
                                {validators.map((validator, index) => renderValidatorRow(validator, index))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

const renderValidatorRow = (validatorEntity: ValidatorEntity, index: number) => {
    return (
        <tr key={index}>
            <td className={`${ validatorEntity.delinquent ? 'bg-validator-row' : null }`}>
              <div className="d-flex">
                <Address pubkey={new PublicKey(validatorEntity.votePubkey)} link truncate />
                { validatorEntity.delinquent ? <AlertTriangle size="15" className="mx-2 d-none d-sm-inline text-danger" /> : null }
              </div>

            </td>
            <td className="text-end">
                <SolBalance lamports={validatorEntity.activatedStake} maximumFractionDigits={0} />
            </td>
        </tr>
    );
};
