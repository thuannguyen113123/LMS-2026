import { useState, useEffect, useCallback } from "react";

const defaultData = {
  user: "",
  slug: "",
  preferences: {
    language: "vi",
    notifications: true,
    darkMode: false,
  },
};

export default function useStudentForm(initialData, users = []) {
  const [formData, setFormData] = useState({ ...defaultData, ...initialData });
  const [errors, setErrors] = useState({});

  // ✅ normalize + reset khi edit/create
  useEffect(() => {
    const normalizedUser =
      typeof initialData?.user === "object" && initialData.user !== null
        ? initialData.user._id
        : initialData?.user || "";

    setFormData({
      ...defaultData,
      ...initialData,
      user: normalizedUser,
    });

    setErrors({});
  }, [initialData]);

  // ✅ handle change (nested supported)
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("preferences.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [field]: type === "checkbox" ? checked : value,
        },
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  // ✅ auto slug theo user
  useEffect(() => {
    if (!formData.user) return;

    const selectedUser = users.find(
      (u) => u.id === formData.user || u._id === formData.user
    );

    if (selectedUser?.fullname) {
      setFormData((prev) => ({
        ...prev,
      }));
    }
  }, [formData.user, users]);

  // ✅ validate
  const validate = useCallback(() => {
    const errs = {};
    if (!formData.user) errs.user = "Vui lòng chọn tài khoản người dùng";
    return errs;
  }, [formData.user]);

  // ✅ submit wrapper
  const submitForm = useCallback(
    (onSubmit) => {
      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return false;
      }

      const finalData = {
        user: formData.user,

        preferences: formData.preferences,
      };

      onSubmit(finalData);
      return true;
    },
    [formData, validate]
  );

  return {
    formData,
    errors,
    setFormData,
    handleChange,
    submitForm,
  };
}
