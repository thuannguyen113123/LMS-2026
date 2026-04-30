import { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { uploadToCloudinary } from "../../../config/uploadToCloudinary";

const normalizeUrl = (v) =>
  typeof v === "string" ? v : v?.secure_url || v?.url || "";

const cleanArray = (arr = []) =>
  arr.map((s) => s.trim().replace(/,+$/, "")).filter(Boolean);

export function useCourseForm(initialData = {}, onSubmit) {
  const authUser = useSelector((s) => s.auth.user);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category:
      initialData?.category?._id ||
      initialData?.category?.id ||
      initialData?.category ||
      "",
    instructor:
      initialData?.instructor?._id ||
      initialData?.instructor?.id ||
      initialData?.instructor ||
      "",
    duration: initialData?.duration || "",
    rating: initialData?.rating || "",
    isFree: initialData?.isFree || false,
    price: initialData?.price || "",
    discountPrice: initialData?.discountPrice || "",
    status: initialData?.status || "draft",

    coverImage: normalizeUrl(initialData?.coverImage || initialData?.image),
    videoURL: normalizeUrl(initialData?.videoURL || initialData?.video),

    whatYouWillLearn: initialData?.whatYouWillLearn || [],
    audience: initialData?.audience || [],
    requirements: initialData?.requirements || [],
  });

  const [errors, setErrors] = useState({});

  const [files, setFiles] = useState({
    cover: null,
    video: null,
  });

  const [uploading, setUploading] = useState({
    cover: false,
    video: false,
  });

  const [uploadError, setUploadError] = useState({
    cover: null,
    video: null,
  });

  // AUTO SET INSTRUCTOR
  useEffect(() => {
    if (!authUser) return;

    if (authUser?.activeRole?.name === "instructor") {
      setFormData((prev) => ({
        ...prev,
        instructor: authUser.id,
      }));
    }
  }, [authUser]);

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

    if (!formData.title.trim()) errs.title = "Tiêu đề bắt buộc";
    if (!formData.description.trim()) errs.description = "Mô tả bắt buộc";
    if (!formData.category) errs.category = "Danh mục bắt buộc";
    if (!formData.instructor) errs.instructor = "Giảng viên bắt buộc";

    if (!formData.audience.length) errs.audience = "Nhập ít nhất 1 đối tượng";

    if (!formData.requirements.length)
      errs.requirements = "Nhập ít nhất 1 yêu cầu";

    if (!formData.isFree && formData.price <= 0)
      errs.price = "Giá phải lớn hơn 0";

    if (
      !formData.isFree &&
      formData.discountPrice &&
      formData.discountPrice >= formData.price
    )
      errs.discountPrice = "Giá giảm phải nhỏ hơn giá gốc";

    return errs;
  }, [formData]);

  const uploadFile = async (file, type) => {
    if (!file) return null;

    setUploading((prev) => ({ ...prev, [type]: true }));
    setUploadError((prev) => ({ ...prev, [type]: null }));

    try {
      const res = await uploadToCloudinary(file, "LMS-2025");
      const url = normalizeUrl(res);

      setFormData((prev) => ({
        ...prev,
        [type === "cover" ? "coverImage" : "videoURL"]: url,
      }));

      setFiles((prev) => ({ ...prev, [type]: null }));

      return url;
    } catch (err) {
      console.error(err);
      setUploadError((prev) => ({
        ...prev,
        [type]: "Upload thất bại",
      }));
      return null;
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    let finalVideo = formData.videoURL;
    let finalCover = formData.coverImage;

    if (files.video) finalVideo = await uploadFile(files.video, "video");
    if (files.cover) finalCover = await uploadFile(files.cover, "cover");

    const payload = {
      ...formData,
      instructor:
        authUser?.activeRole?.name === "instructor"
          ? authUser.id
          : formData.instructor,
      videoURL: normalizeUrl(finalVideo),
      coverImage: normalizeUrl(finalCover),

      whatYouWillLearn: cleanArray(formData.whatYouWillLearn),
      audience: cleanArray(formData.audience),
      requirements: cleanArray(formData.requirements),

      duration: Number(formData.duration) || 0,
      rating: Number(formData.rating) || 0,
      price: formData.isFree ? 0 : Number(formData.price),
      discountPrice: formData.isFree ? 0 : Number(formData.discountPrice),
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

    uploadCover: () => uploadFile(files.cover, "cover"),
    uploadVideo: () => uploadFile(files.video, "video"),

    authUser,
  };
}
