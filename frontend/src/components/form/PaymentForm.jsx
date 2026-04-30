import React, { useState, useEffect, useCallback } from "react";
import FormField from "../common/FormField";
import DropIn from "braintree-web-drop-in-react";

const defaultData = {
  user: "",
  courseId: "",
  amount: 0,
  discountCode: "",
  finalAmount: 0,
  paymentMethodNonce: "",
};

const PaymentForm = ({
  initialData = defaultData,
  onSubmit,
  isLoading = false,
  users = [],
  courses = [],
  clientToken,
}) => {
  const [formData, setFormData] = useState(defaultData);
  const [errors, setErrors] = useState({});
  const [instance, setInstance] = useState(null);
  const [discountValue, setDiscountValue] = useState(0);

  // 🧩 Chuẩn hóa dữ liệu khi load form
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        user: initialData.user?._id || initialData.user || "",
        courseId: initialData.courseId?._id || initialData.courseId || "",
      }));
    }
  }, [initialData]);

  // 🧩 Khi chọn khóa học => cập nhật giá
  const handleCourseChange = (e) => {
    const value = e.target.value;
    const selected = courses.find((c) => c._id === value);
    const baseAmount = selected ? selected.price : 0;

    setFormData((prev) => ({
      ...prev,
      courseId: value,
      amount: baseAmount,
      finalAmount: baseAmount - discountValue,
    }));
  };

  // 🧩 Áp dụng mã giảm giá (demo logic)
  const handleApplyDiscount = () => {
    if (!formData.discountCode.trim()) return;
    // 👉 Giả lập gọi API check mã
    if (formData.discountCode === "LEARN10") {
      const value = (formData.amount * 10) / 100;
      setDiscountValue(value);
      setFormData((prev) => ({
        ...prev,
        finalAmount: prev.amount - value,
      }));
    } else {
      setDiscountValue(0);
      alert("Mã giảm giá không hợp lệ!");
    }
  };

  // 🧩 Validate cơ bản
  const validate = useCallback(() => {
    const errs = {};
    if (!formData.user) errs.user = "Vui lòng chọn người dùng";
    if (!formData.courseId) errs.courseId = "Vui lòng chọn khóa học";
    if (!formData.amount || formData.amount <= 0)
      errs.amount = "Số tiền không hợp lệ";
    return errs;
  }, [formData]);

  // 🧩 Gửi dữ liệu thanh toán
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const { nonce } = await instance.requestPaymentMethod();
      const payload = {
        user: formData.user,
        courseId: formData.courseId,
        amount: formData.amount,
        discountCode: formData.discountCode,
        finalAmount: formData.finalAmount,
        paymentMethodNonce: nonce,
      };
      onSubmit(payload);
    } catch (err) {
      console.error("Lỗi tạo nonce:", err);
      alert("Vui lòng chọn phương thức thanh toán hợp lệ!");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-semibold mb-4 text-indigo-700">
        Thanh toán khóa học
      </h2>

      <FormField
        label="Người dùng"
        name="user"
        type="select"
        value={formData.user}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, user: e.target.value }))
        }
        options={users.map((u) => ({
          value: u._id || u.id,
          label: u.fullname || u.email,
        }))}
        error={errors.user}
        required
      />

      <FormField
        label="Khóa học"
        name="courseId"
        type="select"
        value={formData.courseId}
        onChange={handleCourseChange}
        options={courses.map((c) => ({
          value: c._id,
          label: `${c.title} (${c.price}₫)`,
        }))}
        error={errors.courseId}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Mã giảm giá"
          name="discountCode"
          value={formData.discountCode}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              discountCode: e.target.value,
            }))
          }
          placeholder="VD: LEARN10"
        />
        <button
          type="button"
          onClick={handleApplyDiscount}
          className="bg-green-600 text-white rounded-md px-4 py-2 mt-6 hover:bg-green-700 transition"
        >
          Áp dụng
        </button>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <p className="text-gray-600">
          Tạm tính:{" "}
          <span className="font-semibold">
            {formData.amount.toLocaleString()}₫
          </span>
        </p>
        <p className="text-gray-600">
          Giảm giá:{" "}
          <span className="font-semibold text-green-600">
            -{discountValue.toLocaleString()}₫
          </span>
        </p>
        <p className="text-lg font-bold mt-2 text-indigo-700">
          Tổng cộng: {formData.finalAmount.toLocaleString()}₫
        </p>
      </div>

      {/* 🧾 Braintree DropIn */}
      {clientToken ? (
        <div className="border rounded-md p-4 bg-gray-50">
          <DropIn
            options={{
              authorization: clientToken,
              paypal: { flow: "vault" },
            }}
            onInstance={(inst) => setInstance(inst)}
          />
        </div>
      ) : (
        <p className="text-red-600 text-sm">
          Không thể tải Braintree client token.
        </p>
      )}

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-700 text-white px-6 py-3 rounded-md hover:bg-indigo-800 disabled:opacity-50 transition"
        >
          {isLoading ? "Đang xử lý..." : "Thanh toán ngay"}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
