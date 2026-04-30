import React, { useState, useEffect, useCallback, useMemo } from "react";
import FormField from "../common/FormField";

/* ================================
   DEFAULT DATA
================================ */
const defaultData = {
  id: "",
  userId: "",
  items: [],
  subtotal: 0,
  discountApplied: false,
  couponCode: "",
  discountValue: 0,
  totalAmount: 0,
  finalAmount: 0,
  paymentId: "",
  status: "pending",
  createdAt: "",
  updatedAt: "",
};

/* ================================
   STATUS OPTIONS
================================ */
const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Cancelled", value: "cancelled" },
];

/* ================================
   ROLE PERMISSIONS (FE layer)
================================ */
const ORDER_UPDATE_FIELDS = {
  admin: ["status", "paymentId"],
  instructor: [], // read-only
  student: ["status"], // chỉ cancel (BE validate thêm)
};

/* ================================
   COMPONENT
================================ */
const OrderForm = ({
  initialData = defaultData,
  onSubmit,
  isLoading = false,
  users = [],
  role = "student", // truyền từ auth.user.role
}) => {
  const [formData, setFormData] = useState(defaultData);

  /* ================================
     NORMALIZE DATA
  =================================*/
  useEffect(() => {
    if (!initialData) return;

    const extractUserId = (user) => {
      if (!user) return "";
      if (typeof user === "string") return user;
      return user._id || user.id || user.value || "";
    };

    const normalized = {
      ...defaultData,
      ...initialData,
      userId: extractUserId(initialData.user || initialData.userId),
      items: Array.isArray(initialData.items) ? initialData.items : [],
      paymentId:
        initialData.payment?.id ||
        initialData.paymentId?._id ||
        initialData.paymentId?.id ||
        initialData.paymentId ||
        "",
      status: initialData.status || "pending",
    };

    setFormData(normalized);
  }, [initialData]);

  /* ================================
     PERMISSION CHECK
  =================================*/
  const allowedFields = useMemo(() => ORDER_UPDATE_FIELDS[role] || [], [role]);

  const canEdit = useCallback(
    (field) => allowedFields.includes(field),
    [allowedFields]
  );

  /* ================================
     HANDLE CHANGE
  =================================*/
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  /* ================================
     FILTER PAYLOAD BY ROLE
  =================================*/
  const buildPayload = () => {
    const rawPayload = {
      status: formData.status,
      paymentId: formData.paymentId || null,
    };

    return Object.keys(rawPayload).reduce((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = rawPayload[key];
      }
      return acc;
    }, {});
  };

  /* ================================
     SUBMIT
  =================================*/
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = buildPayload();
    onSubmit(payload);
  };

  /* ================================
     RENDER
  =================================*/
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg"
    >
      {/* ===== BASIC INFO ===== */}

      <FormField label="Order ID" name="id" value={formData.id} disabled />

      <FormField
        label="User"
        name="userId"
        type="select"
        value={formData.userId}
        options={users}
        disabled
      />

      <FormField
        label="Items"
        name="items"
        value={formData.items
          .map((i) => `${i.title} (${i.itemType}) - $${i.price}`)
          .join(", ")}
        disabled
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Subtotal"
          name="subtotal"
          value={formData.subtotal}
          disabled
        />

        <FormField
          label="Discount Applied"
          name="discountApplied"
          value={formData.discountApplied ? "Yes" : "No"}
          disabled
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Coupon Code"
          name="couponCode"
          value={formData.couponCode || "-"}
          disabled
        />

        <FormField
          label="Discount Value"
          name="discountValue"
          value={formData.discountValue}
          disabled
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Total Amount"
          name="totalAmount"
          value={formData.totalAmount}
          disabled
        />

        <FormField
          label="Final Amount"
          name="finalAmount"
          value={formData.finalAmount}
          disabled
        />
      </div>

      {/* ===== EDITABLE FIELDS ===== */}

      {canEdit("paymentId") && (
        <FormField
          label="Payment ID"
          name="paymentId"
          value={formData.paymentId}
          onChange={handleChange}
          placeholder="Nhập Payment ID"
        />
      )}

      {canEdit("status") && (
        <FormField
          label="Status"
          name="status"
          type="select"
          value={formData.status}
          onChange={handleChange}
          options={statusOptions}
        />
      )}

      {/* ===== SUBMIT ===== */}
      {allowedFields.length > 0 && (
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-700 text-white px-6 py-3 rounded-md hover:bg-indigo-800 disabled:opacity-50 transition"
          >
            {isLoading ? "Đang lưu..." : "Cập nhật đơn hàng"}
          </button>
        </div>
      )}
    </form>
  );
};

export default OrderForm;
