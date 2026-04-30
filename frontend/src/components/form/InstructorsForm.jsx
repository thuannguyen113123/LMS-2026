import React, { useState, useEffect, useCallback } from "react";
import FormField from "../common/FormField";

const defaultData = {
  fullname: "",
  bio: "",
  specialization: "",
  expertise: [],
  totalStudents: 0,
  avatar: "",
  user: "",

  github: "",
  linkedin: "",
  youtube: "",
  website: "",
  rating: { average: 0, count: 0 },
  coursesTaught: [],
};

const InstructorForm = ({
  initialData = defaultData,
  onSubmit,
  isLoading = false,
  users = [],
  mode = "create",
}) => {
  const [formData, setFormData] = useState(defaultData);
  const [errors, setErrors] = useState({});

  // 🧩 Chuẩn hóa dữ liệu khi load form
  useEffect(() => {
    if (!initialData) return;

    const normalizedData = {
      ...defaultData,
      ...initialData,
      fullname: initialData.user?.fullname || "",
      bio: initialData.bio || "",
      specialization: initialData.specialization || "",
      totalStudents: initialData.totalStudents || 0,
      user: initialData?.user?._id || initialData?.user || "",

      rating: {
        average: initialData?.rating?.average || 0,
        count: initialData?.rating?.count || 0,
      },
      expertise: Array.isArray(initialData?.expertise)
        ? initialData.expertise.join(", ")
        : initialData?.expertise || "",
      github: initialData?.socialLinks?.github || "",
      linkedin: initialData?.socialLinks?.linkedin || "",
      youtube: initialData?.socialLinks?.youtube || "",
      website: initialData?.socialLinks?.website || "",
    };

    setFormData(normalizedData);
    setErrors({});
  }, [initialData]);

  // 🧩 Handle change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  // 🧩 Validate cơ bản
  const validate = useCallback(() => {
    const errs = {};
    if (!formData.fullname.trim())
      errs.fullname = "Tên giảng viên không được để trống";
    if (!formData.bio.trim()) errs.bio = "Tiểu sử bắt buộc";
    if (formData.rating.average < 0 || formData.rating.average > 5)
      errs.ratingAverage = "Đánh giá phải từ 0 đến 5";
    return errs;
  }, [formData]);

  //  Submit form về API
  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Chuẩn hóa payload trước khi gửi
    const finalData = {
      fullname: formData.fullname.trim(),
      bio: formData.bio.trim(),
      specialization: formData.specialization.trim(),
      totalStudents: Number(formData.totalStudents) || 0,

      rating: {
        average: Number(formData.rating.average) || 0,
        count: Number(formData.rating.count) || 0,
      },

      expertise: formData.expertise
        ? formData.expertise.split(",").map((e) => e.trim())
        : [],

      socialLinks: {
        github: formData.github.trim(),
        linkedin: formData.linkedin.trim(),
        youtube: formData.youtube.trim(),
        website: formData.website.trim(),
      },
    };

    if (mode === "create") {
      finalData.user = formData.user;
    }

    onSubmit(finalData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-3xl mx-auto p-6  rounded-lg shadow-lg"
    >
      <FormField
        label="Tên giảng viên"
        name="fullname"
        value={formData.fullname}
        onChange={handleChange}
        error={errors.fullname}
        required
        placeholder="VD: Nguyễn Minh Thuận"
      />

      <FormField
        label="Tiểu sử (Bio)"
        name="bio"
        type="textarea"
        value={formData.bio}
        onChange={handleChange}
        error={errors.bio}
        required
        placeholder="Giới thiệu ngắn gọn về giảng viên"
      />

      <FormField
        label="Chuyên môn (Expertise)"
        name="expertise"
        value={formData.expertise}
        onChange={handleChange}
        placeholder="VD: React, Node.js, UI/UX"
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Đánh giá trung bình"
          name="rating.average"
          type="number"
          value={formData.rating.average}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              rating: { ...prev.rating, average: e.target.value },
            }))
          }
          error={errors.ratingAverage}
          placeholder="VD: 4.5"
        />

        <FormField
          label="Tổng học viên"
          name="totalStudents"
          type="number"
          value={formData.totalStudents}
          onChange={handleChange}
          error={errors.totalStudents}
          placeholder="VD: 120"
        />
      </div>

      {mode === "create" && (
        <FormField
          label="Liên kết tài khoản người dùng"
          name="user"
          type="select"
          value={formData.user || ""}
          onChange={handleChange}
          options={users.map((u) => ({
            value: u._id || u.id,
            label: u.fullname || u.email,
          }))}
        />
      )}

      {/* Social Links */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="GitHub"
          name="github"
          value={formData.github}
          onChange={handleChange}
        />
        <FormField
          label="LinkedIn"
          name="linkedin"
          value={formData.linkedin}
          onChange={handleChange}
        />
        <FormField
          label="YouTube"
          name="youtube"
          value={formData.youtube}
          onChange={handleChange}
        />
        <FormField
          label="Website"
          name="website"
          value={formData.website}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-700 text-white px-6 py-3 rounded-md hover:bg-indigo-800 disabled:opacity-50 transition"
        >
          {isLoading ? "Đang lưu..." : "Lưu giảng viên"}
        </button>
      </div>
    </form>
  );
};

export default InstructorForm;
