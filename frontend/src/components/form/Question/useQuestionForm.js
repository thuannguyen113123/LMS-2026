import { useState, useCallback, useEffect } from "react";

const defaultData = {
  quiz: "",
  type: "multiple_choice",
  content: "",
  options: [
    { text: "", isCorrect: false, feedback: "" },
    { text: "", isCorrect: false, feedback: "" },
    { text: "", isCorrect: false, feedback: "" },
    { text: "", isCorrect: false, feedback: "" },
  ],
  correctAnswers: [],
  explanation: "",
  difficulty: "medium",
  tags: "",
  points: 1,
};

export function useQuestionForm(initialData = {}, onSubmit) {
  const [formData, setFormData] = useState({ ...defaultData, ...initialData });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!initialData) return;

    const normalized = {
      ...defaultData,
      ...initialData,

      quiz: initialData.quiz?.id || initialData.quiz || "",

      // CHUẨN : TRUE/FALSE tự generate options
      options:
        initialData.type === "true_false"
          ? [
              {
                text: "Đúng",
                isCorrect: initialData.correctAnswers?.[0] === "đúng",
              },
              {
                text: "Sai",
                isCorrect: initialData.correctAnswers?.[0] === "sai",
              },
            ]
          : initialData.type === "multiple_choice"
          ? initialData.options
          : undefined, // CHUẨN: loại bỏ options khi không cần

      // correctAnswers CHO EDIT
      correctAnswers:
        initialData.type === "multiple_choice"
          ? initialData.correctAnswers
          : initialData.type === "true_false"
          ? [initialData.correctAnswers?.[0]]
          : initialData.correctAnswers || [],

      // tags input dạng string
      tags: Array.isArray(initialData.tags)
        ? initialData.tags.join(", ")
        : initialData.tags || "",
    };

    setFormData(normalized);
    setErrors({});
  }, [initialData]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleOptionChange = useCallback(
    (index, field, value) => {
      const updatedOptions = [...formData.options];
      updatedOptions[index][field] = field === "isCorrect" ? value : value;
      setFormData((prev) => ({ ...prev, options: updatedOptions }));
    },
    [formData.options]
  );

  const validate = useCallback(() => {
    const errs = {};
    if (!formData.quiz) errs.quiz = "Câu hỏi phải thuộc một bài quiz";
    if (!formData.content.trim()) errs.content = "Nội dung câu hỏi bắt buộc";
    if (!formData.type) errs.type = "Chọn loại câu hỏi";
    if (formData.points <= 0) errs.points = "Điểm phải lớn hơn 0";
    if (
      formData.type === "multiple_choice" &&
      !formData.options.some((o) => o.isCorrect)
    ) {
      errs.options = "Phải có ít nhất 1 đáp án đúng";
    }
    return errs;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const finalData = {
      quiz: formData.quiz,
      type: formData.type,
      content: formData.content,
      explanation: formData.explanation,
      difficulty: formData.difficulty,
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
      points: Number(formData.points) || 1,
    };

    if (formData.type === "multiple_choice") {
      finalData.options = formData.options;
      finalData.correctAnswers = formData.options
        .filter((o) => o.isCorrect)
        .map((o) => o.text);
    }

    if (formData.type === "true_false") {
      finalData.correctAnswers = [formData.correctAnswers[0]];
    }

    if (formData.type === "short_answer" || formData.type === "coding") {
      finalData.correctAnswers = formData.correctAnswers;
    }

    const result = await onSubmit(finalData);

    // CREATE MODE -> reset form
    if (!initialData?.id && !initialData?._id) {
      setFormData(defaultData);
      setErrors({});
    }

    return result;
  };

  return {
    formData,
    errors,
    handleChange,
    handleOptionChange,
    handleSubmit,
    setFormData,
  };
}
