import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createCategory } from "../../features/category/categoriesThunks";
import FormField from "../common/FormField";

const defaultData = {
  name: "",
  description: "",
  status: "active",
};

const CategoryForm = ({ initialData = defaultData, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState(defaultData);
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    setFormData({ ...defaultData, ...initialData });
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Tên danh mục không được để trống";
    if (formData.image && !/^https?:\/\//.test(formData.image))
      errs.image = "Ảnh phải là đường dẫn hợp lệ (http hoặc https)";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);

    const payload = {
      name: formData.name.trim(),
      description: formData.description,
      status: formData.status,
    };

    if (onSubmit) {
      onSubmit(payload);
    } else {
      dispatch(createCategory(payload));
    }

    setFormData(defaultData);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          type="text"
          name="name"
          label="Tên danh mục"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

        <FormField
          type="text"
          name="description"
          label="Mô tả"
          value={formData.description}
          onChange={handleChange}
          error={errors.description}
        />
        <FormField
          type="select"
          name="status"
          label="Trạng thái"
          value={formData.status}
          onChange={handleChange}
          options={[
            { value: "active", label: "Hoạt động" },
            { value: "inactive", label: "Không hoạt động" },
          ]}
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition disabled:opacity-50"
          >
            {isLoading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </>
  );
};

export default CategoryForm;
