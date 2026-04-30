import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useCallback, useRef } from "react";

import {
  addItemToCart,
  removeItemFromCart,
  clearCart,
  applyLocalCoupon,
  selectCartItems,
  updateDiscountValue,
} from "../../features/cart/cartSlice";

import { applyCoupon } from "../../features/cart/cartThunks";
import { createTransaction } from "../../features/payments/paymentsThunks";

export const useCart = () => {
  const dispatch = useDispatch();
  const hydratedRef = useRef(false);

  const {
    subtotal,
    discountValue,
    discountApplied,
    couponCode,
    totalAmount,
    finalAmount,
    loading,
    error,
  } = useSelector((state) => state.cart);

  const items = useSelector(selectCartItems);

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [items]);

  useEffect(() => {
    if (hydratedRef.current) return;

    try {
      const saved = localStorage.getItem("cart");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((item) => {
            dispatch(addItemToCart(item));
          });
        }
      }
    } catch (err) {
      console.error("❌ Cart hydrate lỗi:", err);
    }

    hydratedRef.current = true;
  }, [dispatch]);

  useEffect(() => {
    if (!hydratedRef.current) return;

    try {
      if (items.length === 0) {
        localStorage.removeItem("cart");
      } else {
        localStorage.setItem("cart", JSON.stringify(items));
      }
    } catch (err) {
      console.error("❌ Cart persist lỗi:", err);
    }
  }, [items]);

  const addItem = useCallback(
    (item) => dispatch(addItemToCart(item)),
    [dispatch]
  );

  const removeItem = useCallback(
    (id) => dispatch(removeItemFromCart(id)),
    [dispatch]
  );

  const clearLocalCart = useCallback(() => {
    dispatch(clearCart());

    try {
      localStorage.removeItem("cart");
    } catch (err) {
      console.error("❌ Clear cart lỗi:", err);
    }
  }, [dispatch]);

  const applyCouponCode = useCallback(
    (code) => dispatch(applyCoupon(code)),
    [dispatch]
  );

  const applyLocalDiscount = useCallback(
    (code, discount) => dispatch(applyLocalCoupon({ code, discount })),
    [dispatch]
  );

  const checkoutWithBraintree = useCallback(
    async (braintreeInstance, orderId) => {
      if (!braintreeInstance) {
        throw new Error("Không tìm thấy cổng thanh toán!");
      }

      const { nonce } = await braintreeInstance.requestPaymentMethod();

      const response = await dispatch(
        createTransaction({ nonce, orderId })
      ).unwrap();

      console.log("BACKEND RESPONSE:", response);

      return response;
    },
    [dispatch]
  );

  const updateDiscountValueHandler = useCallback(
    (value) => dispatch(updateDiscountValue(value)),
    [dispatch]
  );

  return {
    items,
    subtotal,
    discountValue,
    discountApplied,
    couponCode,
    totalAmount,
    finalAmount,
    totalItems,
    loading,
    error,

    addItem,
    removeItem,
    clearLocalCart,

    applyCouponCode,
    applyLocalDiscount,

    checkoutWithBraintree,
    updateDiscountValue: updateDiscountValueHandler,
  };
};
