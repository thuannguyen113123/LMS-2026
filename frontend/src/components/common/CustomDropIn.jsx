import React, { useEffect, useRef, useState } from "react";
import dropin from "braintree-web-drop-in";

export default function CustomDropIn({ authorization, onInstance }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Không chạy nếu chưa có token hoặc chưa render DOM
    if (!authorization || !containerRef.current || initialized) return;

    setInitialized(true); // Ngăn chạy lại trong StrictMode

    const init = async () => {
      // Đảm bảo container rỗng
      containerRef.current.innerHTML = "";

      try {
        const instance = await dropin.create({
          authorization,
          container: containerRef.current,
          paypal: { flow: "vault" },
          card: { cardholderName: true },
        });

        instanceRef.current = instance;
        if (onInstance) onInstance(instance);
      } catch (err) {
        console.error("❌ Braintree create error:", err);
      }
    };

    init();

    return () => {
      if (instanceRef.current) {
        instanceRef.current.teardown(() => {
          instanceRef.current = null;
          setInitialized(false);
        });
      }
    };
  }, [authorization, onInstance, initialized]);

  return <div ref={containerRef} />;
}
