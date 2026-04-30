import { useState, useCallback, useEffect } from "react";
import { uploadToCloudinary } from "../../../config/uploadToCloudinary";

export function useModuleForm(initialData = {}, onSubmit) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    description: initialData?.description || "",
    icon: initialData?.icon || "",
    path: initialData?.path || "",
    order: initialData?.order ?? 0,
    isActive: initialData?.isActive ?? true,
    isSystemModule: initialData?.isSystemModule ?? false,
    group: initialData?.group || "main",

    visibility: "admin",
  });

  const [errors, setErrors] = useState({});

  const [iconFile, setIconFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  }, []);

  const validate = useCallback(() => {
    const errs = {};

    if (!formData.name.trim()) errs.name = "Tên module không được để trống";
    if (!formData.code.trim()) errs.code = "Code module không được để trống";

    if (formData.order < 0) errs.order = "Thứ tự hiển thị phải >= 0";

    return errs;
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleUploadIcon = async () => {
    if (!iconFile && !formData.icon)
      return setUploadError("Vui lòng chọn file hoặc nhập link icon");

    if (!iconFile && formData.icon) {
      setUploadError(null);
      return;
    }

    if (iconFile) {
      setUploadError(null);
      setUploadProgress(0);

      try {
        const url = await uploadToCloudinary(iconFile, "LMS-2025");
        setFormData((prev) => ({ ...prev, icon: url }));
        setIconFile(null);
        setUploadProgress(null);
      } catch (err) {
        console.log(err);
        setUploadError("Upload icon thất bại");
        setUploadProgress(null);
      }
    }
  };

  return {
    formData,
    errors,
    handleChange,
    handleSubmit,
    iconFile,
    setIconFile,
    uploadProgress,
    uploadError,
    handleUploadIcon,
    setFormData,
  };
}
