import { useState, useCallback } from "react";
import { uploadToCloudinary } from "../../../config/uploadToCloudinary";

const normalizeUrl = (v) =>
  typeof v === "string" ? v : v?.secure_url || v?.url || "";

export function useLessonForm(initialData = {}, onSubmit) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",

    course:
      initialData?.course?._id ||
      initialData?.course?.id ||
      initialData?.course ||
      "",

    order: initialData?.order || 0,
    duration: initialData?.duration || 0,

    isPublished: initialData?.isPublished || false,

    videoUrl: normalizeUrl(initialData?.videoUrl),
  });

  const [errors, setErrors] = useState({});

  const [files, setFiles] = useState({
    video: null,
  });

  const [uploading, setUploading] = useState({
    video: false,
  });

  const [uploadError, setUploadError] = useState({
    video: null,
  });

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

    if (!formData.title.trim()) errs.title = "Tên bài học bắt buộc";
    if (!formData.course) errs.course = "Phải chọn khóa học";

    if (formData.order < 0) errs.order = "Thứ tự phải ≥ 0";
    if (formData.duration < 0) errs.duration = "Thời lượng phải ≥ 0";

    return errs;
  }, [formData]);

  const uploadFile = async (file) => {
    if (!file) return null;

    setUploading((prev) => ({ ...prev, video: true }));
    setUploadError((prev) => ({ ...prev, video: null }));

    try {
      const res = await uploadToCloudinary(file, "LMS-2025");

      const url = normalizeUrl(res);

      setFormData((prev) => ({
        ...prev,
        videoUrl: url,
      }));

      setFiles((prev) => ({ ...prev, video: null }));

      return url;
    } catch (err) {
      console.error(err);

      setUploadError((prev) => ({
        ...prev,
        video: "Upload video thất bại",
      }));

      return null;
    } finally {
      setUploading((prev) => ({ ...prev, video: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    let finalVideo = formData.videoUrl;

    if (files.video) {
      finalVideo = await uploadFile(files.video);
    }

    const payload = {
      ...formData,
      videoUrl: normalizeUrl(finalVideo),

      duration: Number(formData.duration) || 0,
      order: Number(formData.order) || 0,
    };

    onSubmit(payload);
  };

  return {
    formData,
    setFormData,
    errors,

    handleChange,
    handleSubmit,

    files,
    setFiles,

    uploading,
    uploadError,

    uploadVideo: () => uploadFile(files.video),
  };
}
