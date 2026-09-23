import React from 'react';
import { Link } from 'react-router-dom';
import { BRANDING } from '../utils/branding';

const BrandLogo = ({ size = 'md', showText = true, linkTo = '/' }) => {
  const sizes = {
    sm: { logoH: 32, fontSize: 'text-base' },
    md: { logoH: 44, fontSize: 'text-lg' },
    lg: { logoH: 56, fontSize: 'text-xl' },
  };

  const s = sizes[size] || sizes.md;

  const logoElement = (
    <div className="flex items-center gap-3">
      <img
        src={BRANDING.logoUrl}
        alt={BRANDING.name}
        className={`w-auto rounded-full`}
        style={{ height: s.logoH }}
      />
      {showText && (
        <span className={`font-bold text-primary ${s.fontSize} font-['Manrope'] hidden sm:block`}>
          Sologix Energy
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{logoElement}</Link>;
  }

  return logoElement;
};

export default BrandLogo;
