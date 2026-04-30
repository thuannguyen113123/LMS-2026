import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

import FormField from "../../common/FormField";
import { createRole } from "../../../features/roles/roleThunks";

const defaultData = {
  name: "",
  description: "",
  isSystemRole: false,
};

const RoleForm = ({ initialData = defaultData, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState(defaultData);
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    setFormData({
      ...defaultData,
      ...initialData,
      isSystemRole: Boolean(initialData?.isSystemRole),
    });
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Tên vai trò không được để trống";

    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked, options } = e.target;

    if (type === "select-multiple") {
      const selectedOptions = [];
      for (let i = 0; i < options.length; i++) {
        if (options[i].selected) selectedOptions.push(options[i].value);
      }
      setFormData((prev) => ({ ...prev, [name]: selectedOptions }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      let finalValue = value;
      if (name === "isSystemRole") {
        finalValue = value === "true";
      }
      setFormData((prev) => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);

    if (onSubmit) {
      onSubmit(formData);
    } else {
      dispatch(createRole(formData));
    }

    setFormData(defaultData);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          type="text"
          name="name"
          label="Tên vai trò"
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
          name="isSystemRole"
          label="Là quyền hệ thống?"
          value={String(formData.isSystemRole)}
          onChange={handleChange}
          error={errors.isSystemRole}
          options={[
            { value: "true", label: "True" },
            { value: "false", label: "False" },
          ]}
          required
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

export default RoleForm;
