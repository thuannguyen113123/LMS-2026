import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Trash2 } from "lucide-react";
import { FiShoppingCart, FiCheck } from "react-icons/fi";

import CheckoutSection from "../../components/common/CheckoutSection";
import { createOrder } from "../../features/orders/ordersThunks";
import { applyDiscount } from "../../features/discounts/discountThunks";
import { addToast } from "../../features/ui/uiSlice";
import {
  selectCreateOrderLoading,
  selectOrderById,
} from "../../features/orders/ordersSlice";
import { applyLocalCoupon } from "../../features/cart/cartSlice";
import { useCart } from "./../../hooks/Cart/useCart";
import useModal from "../../hooks/useModal";
import { Link } from "react-router-dom";

export default function CartPage() {
  const { items, subtotal, discountValue, removeItem, clearLocalCart } =
    useCart();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const authModal = useModal("AUTH");

  const dispatch = useDispatch();

  const creatingOrder = useSelector(selectCreateOrderLoading);

  const [orderId, setOrderId] = useState(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);

  const toast = (type, message) => dispatch(addToast({ type, message }));
  const currentOrder = useSelector((state) =>
    orderId ? selectOrderById(state, orderId) : null
  );
  const displaySubtotal = currentOrder?.subtotal ?? subtotal;

  const displayDiscount =
    currentOrder?.discount?.discountAmount ?? discountValue;

  const displayTotal =
    currentOrder?.finalAmount ?? Math.max(subtotal - discountValue, 0);

  const handleRemove = (id) => {
    removeItem(id);
    toast("success", "Đã xóa khóa học khỏi giỏ hàng");
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast("error", "Vui lòng nhập mã giảm giá");
      return;
    }

    setApplyingCoupon(true);

    const result = await dispatch(
      applyDiscount({
        code: couponInput.trim(),
        items: items.map((i) => ({ productId: i.id })),
      })
    );

    setApplyingCoupon(false);

    if (result.meta.requestStatus === "fulfilled") {
      setAppliedCoupon(couponInput.trim());
      toast(
        "success",
        `Áp dụng mã thành công - Giảm $${result.payload.discountAmount.toFixed(
          2
        )}`
      );
      dispatch(
        applyLocalCoupon({
          code: couponInput.trim(),
          discount: result.payload.discountAmount,
        })
      );
    } else {
      toast("error", "Mã giảm giá không hợp lệ hoặc đã hết hạn");
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast("warning", "Giỏ hàng đang trống");
      return;
    }
    if (!isAuthenticated) {
      dispatch(
        addToast({
          type: "info",
          message: "Bạn cần đăng nhập để thanh toán",
        })
      );

      authModal.open({ initialStep: "login" });
      return;
    }
    if (orderId) return;

    const result = await dispatch(
      createOrder({
        items: items.map((i) => ({ productId: i.id })),
        couponCode: appliedCoupon || null,
      })
    );

    if (result.meta.requestStatus === "fulfilled") {
      const serverOrder = result.payload.order;

      setOrderId(serverOrder.id);

      toast("success", "Tạo đơn hàng thành công");
    } else {
      toast("error", "Tạo đơn hàng thất bại");
    }
  };
  if (checkoutDone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-green-600 mb-4">
          Thanh toán thành công!
        </h2>
        <p className="text-gray-600 mb-6">
          Bạn đã ghi danh thành công khóa học.
        </p>
        <Link
          to="/dashboard/courses"
          className="px-6 py-3 rounded-xl bg-blue-500 text-white inline-block text-center"
        >
          Đi đến khóa học của tôi
        </Link>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-app py-6 sm:py-10 lg:py-14 px-4 sm:px-6 lg:px-8 xl:px-0">
      <div className="max-w-7xl mx-auto">
        {/* ===== HEADER / STEP ===== */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">
            Shopping Cart
          </h2>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="font-semibold text-blue-600">Cart</span>
            <span>→</span>
            <span className={orderId ? "text-blue-600 font-semibold" : ""}>
              Payment
            </span>
            <span>→</span>
            <span>Done</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 bg-card rounded-2xl shadow p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FiShoppingCart
                  size={90}
                  className="text-gray-300 mb-6 w-20 h-20 sm:w-[90px] sm:h-[90px]"
                />
                <h3 className="text-xl font-semibold mb-2">
                  Giỏ hàng đang trống
                </h3>
                <p className="text-gray-500 mb-6">
                  Chọn khóa học để bắt đầu hành trình học tập
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Khám phá khóa học
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border hover:shadow-lg hover:border-blue-200 transition"
                  >
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-44 sm:w-24 sm:h-24 object-cover rounded-xl"
                    />

                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-primary">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.categoryName || "Khóa học"}
                      </p>

                      <div className="mt-2">
                        {item.isFree ? (
                          <span className="text-green-600 font-semibold">
                            FREE
                          </span>
                        ) : item.discountPrice &&
                          item.discountPrice < item.price ? (
                          <>
                            <span className="text-red-500 font-semibold mr-2">
                              ${item.discountPrice.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              ${item.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-blue-600">
                            ${item.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(item._id)}
                      className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8">
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-3 rounded-lg hover-bg-muted border border-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={clearLocalCart}
                  className="px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-6">
            {/* Coupon */}
            <div className="bg-card rounded-2xl shadow p-6">
              <h3 className="font-semibold text-lg mb-3">Coupon Code</h3>

              {!appliedCoupon ? (
                <>
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter coupon code"
                    className="w-full border rounded-lg px-4 py-3 text-base mb-3 focus:ring focus:ring-blue-100"
                  />

                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon}
                    className={`w-full rounded-lg py-2 font-medium text-white ${
                      applyingCoupon
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {applyingCoupon ? "Applying..." : "Apply Coupon"}
                  </button>
                </>
              ) : (
                <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
                  <FiCheck className="text-green-600" />
                  Đã áp dụng mã <b>{appliedCoupon}</b>
                </p>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-card rounded-2xl shadow p-6">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${displaySubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-${displayDiscount.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between text-xl font-bold text-blue-600">
                  <span>Total</span>
                  <span>${displayTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-card rounded-2xl shadow p-6">
              {!orderId ? (
                <div>
                  {!isAuthenticated && (
                    <div className="mb-3 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                      Bạn đang ở chế độ khách. Vui lòng đăng nhập để thanh toán.
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={creatingOrder}
                    className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition ${
                      creatingOrder
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-linear-to-r from-blue-500 to-indigo-600 hover:opacity-90"
                    }`}
                  >
                    {creatingOrder
                      ? "Processing..."
                      : isAuthenticated
                      ? "Complete Checkout"
                      : "Login to Checkout"}
                  </button>
                </div>
              ) : (
                <CheckoutSection
                  orderId={orderId}
                  onSuccess={() => {
                    setCheckoutDone(true);
                    setOrderId(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
