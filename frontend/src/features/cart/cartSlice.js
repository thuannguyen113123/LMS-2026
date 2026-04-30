import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import { applyCoupon } from "./cartThunks";

const cartAdapter = createEntityAdapter({
  selectId: (item) => item._id || item.id, // hoặc item.id
});

// ===== Initial State =====
const initialState = cartAdapter.getInitialState({
  loading: false,
  error: null,
  successMessage: null,
  subtotal: 0,
  discountValue: 0,
  discountApplied: false,
  couponCode: null,
  totalAmount: 0,
  finalAmount: 0,
});

const calculateTotals = (state) => {
  // Tính subtotal (tổng tiền trước giảm giá)
  state.subtotal = state.ids
    .map((id) => {
      const item = state.entities[id];
      // Nếu free => 0
      if (item.isFree === true || String(item.isFree) === "true") return 0;

      // Nếu có discountPrice hợp lệ => lấy discountPrice
      if (
        item.discountPrice &&
        Number(item.discountPrice) > 0 &&
        Number(item.discountPrice) < Number(item.price)
      ) {
        return Number(item.discountPrice);
      }

      // Mặc định lấy price
      return Number(item.price) || 0;
    })
    .reduce((a, b) => a + b, 0);

  // Tổng sau giảm (nếu có mã coupon)
  state.totalAmount = state.subtotal - (state.discountValue || 0);

  // Final amount luôn ≥ 0
  state.finalAmount = Math.max(state.totalAmount, 0);
};

// ===== Slice =====
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItemToCart: (state, action) => {
      const item = action.payload;
      cartAdapter.upsertOne(state, item);
      calculateTotals(state);
    },
    removeItemFromCart: (state, action) => {
      cartAdapter.removeOne(state, action.payload);
      calculateTotals(state);
    },
    clearCart: (state) => {
      cartAdapter.removeAll(state);
      state.subtotal = 0;
      state.discountValue = 0;
      state.discountApplied = false;
      state.couponCode = null;
      state.totalAmount = 0;
      state.finalAmount = 0;
    },
    applyLocalCoupon: (state, action) => {
      const { code, discount } = action.payload;
      state.discountApplied = true;
      state.discountValue = discount;
      state.couponCode = code;
      calculateTotals(state);
    },
    updateDiscountValue: (state, action) => {
      state.discountValue = action.payload;
      state.discountApplied = action.payload > 0;
      calculateTotals(state);
    },
  },
  extraReducers: (builder) => {
    builder

      // === Apply Coupon ===
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.discountApplied = true;
        state.discountValue = action.payload.discountValue;
        state.couponCode = action.payload.couponCode;
        calculateTotals(state);
      });
  },
});

export const {
  addItemToCart,
  removeItemFromCart,
  clearCart,
  applyLocalCoupon,
  updateDiscountValue,
} = cartSlice.actions;

export default cartSlice.reducer;

// ===== Selectors =====
export const {
  selectAll: selectCartItems,
  selectById: selectCartItemById,
  selectTotal: selectCartCount,
} = cartAdapter.getSelectors((state) => state.cart);
