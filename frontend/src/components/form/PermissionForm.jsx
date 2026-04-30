import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

import FormField from "../common/FormField";
import { createPermission } from "../../features/permissions/permissionsThunks";

const defaultData = {
  name: "",
  code: "",
  description: "",
  moduleId: "",
  category: "read",
  isSystemPermission: false,
};

const categories = [
  { value: "read", label: "Đọc (read)" },
  { value: "write", label: "Ghi (write)" },
  { value: "update", label: "Cập nhật (update)" },
  { value: "delete", label: "Xóa (delete)" },
  { value: "admin", label: "Quản trị (admin)" },
  { value: "export", label: "export (Xuất báo cáo)" },
  { value: "access", label: "Access (Quyền truy cập)" },
  { value: "other", label: "Khác (other)" },
];

const PermissionForm = ({
  initialData = defaultData,
  onSubmit,
  moduleOptions,
  isLoading,
}) => {
  const [formData, setFormData] = useState(defaultData);
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    if (!initialData) return;

    setFormData({
      ...defaultData,
      ...initialData,
      moduleId:
        typeof initialData.moduleId === "object"
          ? String(initialData.moduleId._id)
          : String(initialData.moduleId || ""),
    });

    setErrors({});
  }, [initialData]);

  console.log("formData.moduleId =", formData.moduleId);
  console.log("moduleOptions =", moduleOptions);
  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Tên quyền không được để trống";
    if (!formData.code.trim()) errs.code = "Mã quyền không được để trống";
    if (!formData.moduleId.trim()) errs.moduleId = "Module bắt buộc chọn";
    if (!formData.category.trim()) errs.category = "Category bắt buộc chọn";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue;
    if (type === "checkbox") newValue = checked;
    else newValue = value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);

    if (onSubmit) {
      onSubmit(formData);
    } else {
      dispatch(createPermission(formData));
    }

    setFormData(defaultData);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 ">
        <FormField
          type="text"
          name="code"
          label="Mã quyền"
          value={formData.code}
          onChange={handleChange}
          error={errors.code}
          required
        />

        <FormField
          type="text"
          name="name"
          label="Tên quyền"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

        <FormField
          type="textarea"
          name="description"
          label="Mô tả"
          value={formData.description}
          onChange={handleChange}
          error={errors.description}
          rows={3}
        />

        <FormField
          type="select"
          name="moduleId"
          label="Module"
          value={formData.moduleId}
          onChange={handleChange}
          error={errors.moduleId}
          required
          options={moduleOptions}
        />

        <FormField
          type="select"
          name="category"
          label="Category"
          value={formData.category}
          onChange={handleChange}
          error={errors.category}
          required
          options={categories}
        />

        <FormField
          type="checkbox"
          name="isSystemPermission"
          label="Quyền hệ thống"
          checked={formData.isSystemPermission}
          onChange={handleChange}
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded text-white ${
              isLoading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            Lưu
          </button>
        </div>
      </form>
    </>
  );
};

export default PermissionForm;
