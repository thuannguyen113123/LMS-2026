import CertificateCard from "../Card/CertificateCard";

import React from "react";

const CertificatePrint = React.forwardRef(({ data }, ref) => {
  return (
    <div ref={ref} className="certificate-print-wrapper">
      <CertificateCard data={data} printable />
    </div>
  );
});

export default CertificatePrint;
