import React, { useEffect, useState } from "react";

import CustomDropIn from "./CustomDropIn";
import api from "../../app/api";
import { useCart } from "../../hooks/Cart/useCart";

export default function CheckoutSection({ orderId, onSuccess }) {
  const { checkoutWithBraintree, clearLocalCart } = useCart();

  const [clientToken, setClientToken] = useState(null);
  const [braintreeInstance, setBraintreeInstance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchToken = async () => {
      try {
        const { data } = await api.get("/payments/client-token");
        setClientToken(data?.data?.clientToken);
      } catch (err) {
        console.error("Không thể lấy clientToken:", err);
      }
    };

    fetchToken();
  }, [orderId]);

  // Xử lý thanh toán
  const handleCheckout = async () => {
    if (!braintreeInstance || !orderId) return;

    setLoading(true);

    try {
      const paymentResult = await checkoutWithBraintree(
        braintreeInstance,
        orderId
      );

      if (paymentResult?.code === "PAYMENT_CHECKOUT_SUCCESS") {
        clearLocalCart();

        onSuccess?.();
      }
    } catch (err) {
      console.error("❌ Lỗi thanh toán:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!clientToken) {
    return <p className="text-gray-500">Đang tải cổng thanh toán...</p>;
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 mt-4">
      <h3 className="font-semibold text-lg mb-4">Thanh toán an toàn</h3>

      <CustomDropIn
        authorization={clientToken}
        onInstance={setBraintreeInstance}
      />

      <button
        onClick={handleCheckout}
        disabled={!braintreeInstance || loading}
        className={`w-full mt-4 py-2 rounded-lg text-white font-medium ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
      </button>
    </div>
  );
}
