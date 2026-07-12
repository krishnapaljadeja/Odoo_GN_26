import React from "react";
import { Link } from "react-router-dom";

const AssetFlowLogo = ({ as: Component = Link, to = "/", compact = false, className = "", ...props }) => {
  const content = (
    <>
      <span className="assetflow-logo__mark" aria-hidden="true">
        A
      </span>
      {!compact && (
        <span className="assetflow-logo__wordmark-wrap">
          <span className="assetflow-logo__wordmark">ASSETFLOW</span>
          <span className="assetflow-logo__underline" aria-hidden="true" />
        </span>
      )}
    </>
  );

  if (Component === Link) {
    return (
      <Link to={to} className={`assetflow-logo ${className}`.trim()} aria-label="AssetFlow home" {...props}>
        {content}
      </Link>
    );
  }

  return (
    <Component className={`assetflow-logo ${className}`.trim()} aria-label="AssetFlow" {...props}>
      {content}
    </Component>
  );
};

export default AssetFlowLogo;
