import { useRef } from "react";
import { printElement } from "./certificatePrint.service";

export const useCertificatePrint = () => {
  const ref = useRef(null);

  const print = () => {
    printElement(ref.current);
  };

  return { ref, print };
};
