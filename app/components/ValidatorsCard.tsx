import { SolBalance } from '@components/common/SolBalance';
import ValidatorInfo from "@components/ValidatorInfo";
import { useCluster } from "@providers/cluster";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

import { fetchXolanaValidators, ValidatorEntity } from "@/app/api";


export function ValidatorsCard() {
  const [validators, setValidators] = useState<ValidatorEntity[] | null>(null);
  const [sort, setSort] = useState<string>('activatedStake');
  const router = useRouter();
  const cluster = useCluster();
  
  // Memoize cluster slug to prevent unnecessary re-renders
  const clusterSlug = useMemo(() => cluster.slug, [cluster.slug]);


  useEffect(() => {
    const fetchValidators = async () => {
      const response = await fetchXolanaValidators(1000, 0, sort, clusterSlug);
      setValidators(response);
    };

    // Fetch immediately on mount or when sort/cluster changes
    fetchValidators();

    // Set up interval to fetch every 30 seconds
    const interval = setInterval(fetchValidators, 30000);

    // Cleanup interval on unmount or dependency change
    return () => clearInterval(interval);
  }, [sort, clusterSlug]);

  const handleRowClick = (votePubkey: string) => {
    router.push(`/address/${votePubkey}`);
  };

  const renderValidatorRow = (validator: ValidatorEntity, index: number) => (
    <tr
      role="button"
      key={index}
      onClick={() => handleRowClick(validator.votePubkey)}
    >
      <td>
        <ValidatorInfo validator={validator} />
      </td>
      <td className="text-center border-start d-none d-md-table-cell">
        <SolBalance lamports={validator.activatedStake} maximumFractionDigits={0} />
        <div className="text-muted">{
          validator.activatedStakePercentage > .25 ?
            validator.activatedStakePercentage?.toFixed(1) + '%' :
            null}
        </div>
      </td>
      <td className="border-start d-md-none">
        <div className="text-muted">Active Stake:</div>
        <SolBalance lamports={validator.activatedStake} maximumFractionDigits={0} />
        <div className="text-muted">Votes</div>
        <div className="text-white-50">(Last Epoch)</div>
        {validator.voteCountPreviousEpoch?.toLocaleString()}
        <hr />
        <div>Block Production</div>
        <div className="text-white-50">(Last 10 Epochs)</div>
        <div className="text-muted">Assigned:</div>
        {validator.leaderSlotsLast10Epochs?.toLocaleString()}
        <div className="text-muted">Skipped:</div>
        {validator.skippedSlotsLast10Epochs?.toLocaleString()}
      </td>
      <td className="text-center border-start d-none d-md-table-cell">
        {validator.voteCountPreviousEpoch?.toLocaleString()}
      </td>
      <td className="text-end border-start d-none d-md-table-cell">
        {validator.leaderSlotsLast10Epochs?.toLocaleString()}
      </td>
      <td className="text-end d-none d-md-table-cell">
        <span className="m-2">
          {validator.skippedSlotsLast10Epochs?.toLocaleString()}
        </span>
      </td>
      <td className="text-end d-none d-md-table-cell">
        <span className="m-2 text-muted">
          {(validator.skipRateLast10Epochs * 100).toFixed(1)}%
        </span>
      </td>
    </tr>
  );

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
                        <table className="table table-sm card-table">
                            <thead>
                                <tr className="pb-1">
                                  <th className="text-muted"></th>
                                  <th className="text-muted border-start" style={{ minWidth: 150 }}></th>
                                  <th className="text-muted pb-1 text-end border-start text-center d-none d-md-table-cell" style={{ minWidth: 120 }}>Last Epoch</th>
                                  <th colSpan={3} className="text-muted text-center pb-1 border-start d-none d-md-table-cell" style={{ minWidth: 270 }}>
                                    Block Production (Last 10 Epochs)
                                  </th>
                                </tr>
                                <tr>
                                  <th className="text-muted pt-1 pb-2">Validator</th>
                                  <th className="text-muted text-end pt-1 pb-2 border-start">
                                      <a href="#" onClick={() => setSort('activatedStake')}>Active Stake (XNT)</a>
                                  </th>
                                  <th className="text-muted text-end pt-1 pb-2 border-start text-center d-none d-md-table-cell">
                                    <a href="#" onClick={() => setSort('voteCountPreviousEpoch')}>Votes</a>
                                  </th>
                                  <th colSpan={1} className="text-muted text-end pt-1 pb-2 border-start  d-none d-md-table-cell">
                                      <a href="#" onClick={() => setSort('blocksProducedLast10Epochs')}>Assigned</a>
                                  </th>
                                  <th colSpan={1} className="text-muted text-end pt-1 pb-2  d-none d-md-table-cell">
                                    <a href="#" onClick={() => setSort('skippedSlotsLast10Epochs')}>Skipped</a>
                                  </th>
                                  <th colSpan={1} className="text-muted text-end pt-1 pb-2  d-none d-md-table-cell">
                                    <a href="#" onClick={() => setSort('skipRateLast10Epochs')}>Skip Rate</a>
                                  </th>
                                </tr>
                            </thead>
                            <tbody>
                                {validators.map((validator, index) => renderValidatorRow(validator, index))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
