import { useState, useEffect, useCallback } from "react";

const defaultData = {
  fullname: "",
  email: "",
  phone: "",
  role_id: "",
};

export function useUserForm(initialData = null, onSubmit) {
  const isEdit = !!initialData?._id;

  const [formData, setFormData] = useState({
    ...defaultData,
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [method, setMethod] = useState("email");

  // INIT
  useEffect(() => {
    setFormData({
      ...defaultData,
      ...initialData,
      role_id: initialData?.role_id?._id || "",
    });

    if (initialData?.phone) setMethod("phone");
    else setMethod("email");

    setErrors({});
  }, [initialData]);

  // =============================
  // CHANGE
  // =============================
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  }, []);

  // =============================
  // VALIDATE
  // =============================
  const validate = useCallback(() => {
    const errs = {};

    if (!formData.fullname.trim()) {
      errs.fullname = "Tên không được để trống";
    }

    // 🔥 UPDATE → chỉ fullname
    if (isEdit) return errs;

    // 🔥 CREATE → validate contact + role
    if (method === "email") {
      if (!formData.email?.trim()) {
        errs.email = "Email không được để trống";
      }
    } else {
      if (!formData.phone?.trim()) {
        errs.phone = "Số điện thoại không được để trống";
      }
    }

    if (!formData.role_id) {
      errs.role_id = "Vai trò bắt buộc";
    }

    return errs;
  }, [formData, method, isEdit]);

  // =============================
  // SUBMIT
  // =============================
  const handleSubmit = (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    // 🔥 UPDATE → chỉ gửi fullname
    if (isEdit) {
      onSubmit({
        fullname: formData.fullname.trim(),
      });
      return;
    }

    // 🔥 CREATE
    const payload = {
      fullname: formData.fullname.trim(),
      role_id: formData.role_id,
    };

    if (method === "email") payload.email = formData.email.trim();
    else payload.phone = formData.phone.trim();

    onSubmit(payload);
  };

  return {
    formData,
    errors,
    method,
    isEdit,
    handleChange,
    handleSubmit,
    setFormData,
  };
}
