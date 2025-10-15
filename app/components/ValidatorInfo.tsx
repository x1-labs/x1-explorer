import { Copyable } from '@components/common/Copyable';
import React, { useState } from 'react';

import { ValidatorEntity } from '@/app/api';

const IMAGE_SIZE = 100;

interface ValidatorInfoProps {
  validator: ValidatorEntity;
}

const ValidatorInfo: React.FC<ValidatorInfoProps> = ({ validator }) => {
  const [isImageBroken, setIsImageBroken] = useState(false);
  const handleImageError = () => setIsImageBroken(true);

  const getImagizerUrl = (url: string) => {
    if (!process.env.NEXT_PUBLIC_IMAGIZER_ENDPOINT) {
      return url;
    }

    if (!url) return '';
    const url64 = Buffer.from(url).toString('base64');
    return `https://${process.env.NEXT_PUBLIC_IMAGIZER_ENDPOINT}?format=auto&width=${IMAGE_SIZE}&height=${IMAGE_SIZE}&dpr=2&crop=fit&source_url64=${url64}`;
  };

  const renderBadge = () => {
    if (validator.delinquent) {
      return (
        <span className="position-absolute top-0 end-0 badge rounded-pill bg-danger">
          Delinquent
        </span>
      );
    }
    const skippingRateThreshold = parseFloat(process.env.NEXT_PUBLIC_SKIPPING_RATE_THRESHOLD ?? '0.1');
    if (validator.skipRateLast10Epochs > skippingRateThreshold) {
      return (
        <span className="position-absolute top-0 end-0 badge rounded-pill bg-warning">
          Skipping
        </span>
      );
    }
    return null;
  };

  return (
    <div className="card card-flush mb-0">
      <div className="row">
        <div className="col-12 col-lg-3">
          {renderBadge()}
          {!isImageBroken && validator.iconUrl ? (
            <img
              src={getImagizerUrl(validator.iconUrl)}
              style={{ height: IMAGE_SIZE, width: IMAGE_SIZE }}
              alt={validator.name}
              className="rounded-start"
              onError={handleImageError}
            />
          ) : (
            <div
              className="bg-dark rounded-start"
              style={{ height: IMAGE_SIZE, width: IMAGE_SIZE }}
            />
          )}
        </div>
        <div className="col-12 col-lg-9 p-xl-0">
          <div className="card-body px-0 px-lg-3 mt-2 py-2 validator-website">
            <h5 className="card-title mb-1 text-truncate">{validator.name}</h5>
            <p className="card-text mb-1 text-truncate text-muted">
              <small>
                <Copyable text={validator.nodePubkey}>
                  {validator.nodePubkey}
                </Copyable>
              </small>
            </p>
            <p className="card-text text-truncate text-muted mb-1">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={validator.website}
                className="text-truncate btn-link"
              >
                {validator.website}
              </a>
            </p>
            <p className="card-text mb-1 text-truncate text-muted">
              <small>{validator.version}</small>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidatorInfo;
