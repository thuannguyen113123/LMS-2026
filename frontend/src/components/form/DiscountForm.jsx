import React, { useState, useEffect } from "react";

import FormField from "../common/FormField";

const defaultData = {
  code: "",
  type: "percentage",
  value: "",
  minOrderValue: "",
  maxDiscountAmount: "",
  usageLimit: "",
  applicableTo: "all",
  allowedUsers: "", // nhập id hoặc danh sách id cách nhau bằng dấu phẩy
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date().toISOString().slice(0, 16),
  usedCount: 0,
  isActive: true,
};

const DiscountForm = ({ initialData = {}, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState(defaultData);
  const [errors, setErrors] = useState({});

  // Khi có initialData (chỉnh sửa)
  useEffect(() => {
    if (!initialData || typeof initialData !== "object") return;

    const formatted = {
      ...defaultData,

      code: initialData.code || "",
      type: initialData.type || "percentage",
      value: initialData.value ?? "",

      minOrderValue: initialData.conditions?.minOrderValue ?? "",
      maxDiscountAmount: initialData.conditions?.maxDiscountAmount ?? "",

      applicableTo: initialData.conditions?.applicableTo ?? "all",

      allowedUsers: Array.isArray(initialData.conditions?.allowedUsers)
        ? initialData.conditions.allowedUsers.join(",")
        : "",

      usageLimit: initialData.usage?.usageLimit ?? "",
      usedCount: initialData.usage?.usedCount ?? 0,

      startDate: initialData.validity?.startDate
        ? new Date(initialData.validity.startDate).toISOString().slice(0, 16)
        : defaultData.startDate,

      endDate: initialData.validity?.endDate
        ? new Date(initialData.validity.endDate).toISOString().slice(0, 16)
        : defaultData.endDate,

      isActive: initialData.validity?.isActive ?? true,
    };

    setFormData(formatted);
    setErrors({});
  }, [initialData]);

  // Validate dữ liệu form
  const validate = () => {
    const errs = {};
    if (!formData.code.trim()) errs.code = "Mã giảm giá bắt buộc";
    if (!formData.type) errs.type = "Loại giảm giá bắt buộc";
    if (formData.value <= 0) errs.value = "Giá trị giảm phải lớn hơn 0";
    if (new Date(formData.endDate) <= new Date(formData.startDate))
      errs.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    return errs;
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;

    let newValue;

    if (type === "checkbox") {
      newValue = checked;
    } else {
      newValue = value; // GIỮ NGUYÊN STRING
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);

    const finalData = {
      ...formData,
      code: formData.code.trim().toUpperCase(),

      value: Number(formData.value),
      minOrderValue: Number(formData.minOrderValue),
      maxDiscountAmount: Number(formData.maxDiscountAmount),
      usageLimit: Number(formData.usageLimit),
      usedCount: Number(formData.usedCount),

      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),

      allowedUsers: formData.allowedUsers
        ? formData.allowedUsers
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : [],
    };

    if (onSubmit) onSubmit(finalData);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          name="code"
          label="Mã giảm giá"
          value={formData.code}
          onChange={handleChange}
          error={errors.code}
          required
        />

        <FormField
          name="type"
          label="Loại giảm giá"
          type="select"
          value={formData.type}
          onChange={handleChange}
          error={errors.type}
          required
          options={[
            { value: "percentage", label: "Phần trăm (%)" },
            { value: "fixed", label: "Giá cố định (VNĐ)" },
          ]}
        />

        <FormField
          name="value"
          label="Giá trị giảm"
          type="number"
          value={formData.value}
          onChange={handleChange}
          error={errors.value}
          required
        />

        <FormField
          name="minOrderValue"
          label="Đơn hàng tối thiểu"
          type="number"
          value={formData.minOrderValue}
          onChange={handleChange}
        />

        <FormField
          name="maxDiscountAmount"
          label="Giảm tối đa (nếu có)"
          type="number"
          value={formData.maxDiscountAmount}
          onChange={handleChange}
        />

        <FormField
          name="applicableTo"
          label="Áp dụng cho"
          type="select"
          value={formData.applicableTo}
          onChange={handleChange}
          options={[
            { value: "all", label: "Tất cả" },
            { value: "course", label: "Khóa học" },
            { value: "bundle", label: "Gói combo" },
            { value: "user_specific", label: "Người dùng cụ thể" },
          ]}
        />

        {formData.applicableTo === "user_specific" && (
          <FormField
            name="allowedUsers"
            label="ID người dùng áp dụng (ngăn cách bằng dấu phẩy)"
            type="textarea"
            value={formData.allowedUsers}
            onChange={handleChange}
          />
        )}

        <FormField
          name="startDate"
          label="Ngày bắt đầu"
          type="datetime-local"
          value={formData.startDate}
          onChange={handleChange}
        />

        <FormField
          name="endDate"
          label="Ngày kết thúc"
          type="datetime-local"
          value={formData.endDate}
          onChange={handleChange}
          error={errors.endDate}
        />

        <FormField
          name="usageLimit"
          label="Giới hạn số lần sử dụng (0 = không giới hạn)"
          type="number"
          value={formData.usageLimit}
          onChange={handleChange}
        />

        <FormField
          name="usedCount"
          label="Đã sử dụng"
          type="number"
          value={formData.usedCount}
          onChange={handleChange}
          disabled
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
          />
          <label
            htmlFor="isActive"
            className="text-sm font-medium text-gray-700"
          >
            Kích hoạt mã giảm giá
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className={`px-4 py-2 rounded text-white ${
              isLoading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            disabled={isLoading}
          >
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
};

export default DiscountForm;
