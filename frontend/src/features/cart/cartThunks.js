import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";
import { addToast } from "../ui/uiSlice";

/**
 * 💸 Áp mã giảm giá
 */
export const applyCoupon = createAsyncThunk(
  "cart/applyCoupon",
  async (couponCode, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await api.post("/cart/apply-coupon", { couponCode });
      dispatch(
        addToast({
          type: "success",
          message: "Áp dụng mã giảm giá thành công!",
        })
      );
      return data; // { discountValue, couponCode }
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: err.response?.data?.error || "Mã giảm giá không hợp lệ!",
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);
