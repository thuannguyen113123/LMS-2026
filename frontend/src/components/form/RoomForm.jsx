import React, { useEffect, useState } from "react";
import FormField from "../common/FormField";

const defaultData = {
  name: "",
  type: "class",
};

const typeOptions = [
  { value: "class", label: "Nhóm lớp" },
  { value: "course", label: "Lớp học" },
  { value: "teacher_student", label: "Giảng viên - Học viên" },
];
const RoomForm = ({ initialData = {}, onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState(defaultData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({ ...defaultData, ...initialData });
    setErrors({});
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Tên phòng không được để trống";
    if (!formData.type) errs.type = "Loại phòng là bắt buộc";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);

    const cleanedData = {
      name: formData.name.trim(),
      type: formData.type,
    };

    if (onSubmit) onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <FormField
        type="text"
        name="name"
        label="Tên phòng"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
      />

      <FormField
        type="select"
        name="type"
        label="Loại phòng"
        value={formData.type}
        onChange={handleChange}
        error={errors.type}
        options={typeOptions}
        required
      />

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-700 text-white px-6 py-3 rounded-md hover:bg-indigo-800 disabled:opacity-50 transition"
        >
          {isLoading ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </form>
  );
};

export default RoomForm;
