import { useDispatch, useSelector } from "react-redux";

import { useState } from "react";
import { closeCertificateCelebration } from "../../features/certificate/certificateSlice";
import CertificateCard from "../Card/CertificateCard";

export const MODAL_CERTIFICATES = "MODAL_CERTIFICATES";

const CertificateCelebrationModal = () => {
  const dispatch = useDispatch();
  const [index, setIndex] = useState(0);

  const { isOpen, certificates } = useSelector((s) => s.certificates);
  const entities = useSelector((s) => s.certificates.entities);
  const current = entities[certificates[index]];

  if (!isOpen) return null;

  const next = () => setIndex((i) => (i + 1) % certificates.length);

  const prev = () =>
    setIndex((i) => (i === 0 ? certificates.length - 1 : i - 1));

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      {/* BACKDROP */}
      <div
        onClick={() => dispatch(closeCertificateCelebration())}
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
      />

      {/* CONTENT */}
      <div className="relative w-full max-w-7xl px-6 animate-scale-in">
        {/* HEADER */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-primary">
            🎉 Congratulations!
          </h2>
          <p className="text-muted-foreground">
            You’ve earned a new certificate
          </p>
        </div>

        {/* SLIDER */}
        <div className="flex items-center gap-6">
          {certificates.length > 1 && (
            <button
              onClick={prev}
              className="p-3 rounded-full bg-card border hover:scale-105"
            >
              ←
            </button>
          )}

          <div className="flex-1 flex justify-center">
            <CertificateCard data={current} />
          </div>

          {certificates.length > 1 && (
            <button
              onClick={next}
              className="p-3 rounded-full bg-card border hover:scale-105"
            >
              →
            </button>
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-6 text-center">
          <button
            onClick={() => dispatch(closeCertificateCelebration())}
            className="px-6 py-2 rounded-xl bg-primary text-primary-foreground"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateCelebrationModal;
