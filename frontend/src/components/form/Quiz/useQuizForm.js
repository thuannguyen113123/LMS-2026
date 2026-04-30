import { useState, useEffect, useCallback } from "react";

const defaultData = {
  title: "",
  course: "",
  lesson: "",
  scope: "course",
  type: "quiz",
  timeLimit: "",
  passingScore: 0,
  shuffleQuestions: false,
  shuffleOptions: false,
  maxAttempts: 1,
  isPublished: false,
  createdBy: "",
};

export function useQuizForm(initialData = null, onSubmit, currentUser) {
  const [formData, setFormData] = useState(defaultData);
  const [errors, setErrors] = useState({});

  // auto set instructor
  useEffect(() => {
    if (!initialData && currentUser?.activeRole?.name === "instructor") {
      setFormData((prev) => ({
        ...prev,
        createdBy: currentUser.id,
      }));
    }
  }, [currentUser, initialData]);

  // normalize edit data
  useEffect(() => {
    if (!initialData) return;

    const normalized = {
      ...defaultData,
      ...initialData,
      course:
        initialData?.course?.id ||
        initialData?.course?._id ||
        initialData.course ||
        "",
      lesson:
        initialData?.lesson?.id ||
        initialData?.lesson?._id ||
        initialData.lesson ||
        "",
      createdBy:
        initialData?.createdBy?.id ||
        initialData?.createdBy?._id?.toString() ||
        initialData.createdBy?.toString?.() ||
        "",
    };

    setFormData(normalized);
  }, [initialData]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const validate = useCallback(() => {
    const errs = {};

    if (!formData.title.trim()) errs.title = "Tiêu đề không được để trống";
    if (!formData.course) errs.course = "Phải chọn khóa học";

    if (!formData.scope) errs.scope = "Phải chọn scope";

    if (formData.scope === "lesson" && !formData.lesson) {
      errs.lesson = "Phải chọn bài học";
    }

    if (!formData.createdBy) {
      errs.createdBy = "Phải chọn người tạo";
    }

    return errs;
  }, [formData]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const validationErrors = validate();

      if (Object.keys(validationErrors).length) {
        setErrors(validationErrors);
        return;
      }

      const finalData = {
        ...formData,
        timeLimit: Number(formData.timeLimit) || null,
        passingScore: Number(formData.passingScore) || 0,
        maxAttempts: Number(formData.maxAttempts) || 1,
        lesson: formData.scope === "lesson" ? formData.lesson : null,
      };

      onSubmit(finalData);
    },
    [formData, validate, onSubmit]
  );

  return {
    formData,
    errors,
    setFormData,
    handleChange,
    handleSubmit,
  };
}
