import React, { useState, useEffect, useCallback } from "react";
import FormField from "../common/FormField";

const defaultData = {
  student: "",
  quiz: "",
  startTime: "",
  endTime: "",
  duration: 0,
  score: 0,
  status: "in_progress",
  answers: [],
};

const StudentAnswerForm = ({
  initialData = defaultData,
  onSubmit,
  isLoading = false,
  students = [],
  quizzes = [],
  answersList = [], // danh sách câu trả lời có thể chọn
}) => {
  const [formData, setFormData] = useState(defaultData);
  const [errors, setErrors] = useState({});

  // 🧩 Chuẩn hóa dữ liệu khi load form
  useEffect(() => {
    if (!initialData) return;

    const normalized = {
      ...defaultData,
      ...initialData,
      student:
        initialData?.student?._id ||
        initialData?.student?.id ||
        initialData?.student ||
        "",
      quiz:
        initialData?.quiz?._id ||
        initialData?.quiz?.id ||
        initialData?.quiz ||
        "",
      startTime: initialData?.startTime
        ? new Date(initialData.startTime).toISOString().slice(0, 16)
        : "",
      endTime: initialData?.endTime
        ? new Date(initialData.endTime).toISOString().slice(0, 16)
        : "",
      duration: initialData?.duration || 0,
      score: initialData?.score || 0,
      status: initialData?.status || "in_progress",
      answers: Array.isArray(initialData?.answers)
        ? initialData.answers.map((a) => a._id || a)
        : [],
    };

    setFormData(normalized);
    setErrors({});
  }, [initialData]);

  // 🧩 Handle change chung
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  // 🧩 Handle chọn nhiều câu trả lời
  const handleAnswerSelect = useCallback((e) => {
    const options = e.target.options;
    const selectedValues = Array.from(options)
      .filter((opt) => opt.selected)
      .map((opt) => opt.value);

    setFormData((prev) => ({
      ...prev,
      answers: selectedValues,
    }));
  }, []);

  // 🧩 Validate cơ bản
  const validate = useCallback(() => {
    const errs = {};
    if (!formData.student) errs.student = "Vui lòng chọn học viên";
    if (!formData.quiz) errs.quiz = "Vui lòng chọn bài quiz";
    if (formData.score < 0 || formData.score > 100)
      errs.score = "Điểm phải nằm trong khoảng 0 - 100";
    if (formData.duration < 0) errs.duration = "Thời lượng không hợp lệ";
    return errs;
  }, [formData]);

  // 🧩 Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      student: formData.student,
      quiz: formData.quiz,
      startTime: formData.startTime ? new Date(formData.startTime) : null,
      endTime: formData.endTime ? new Date(formData.endTime) : null,
      duration: Number(formData.duration) || 0,
      score: Number(formData.score) || 0,
      status: formData.status,
      answers: formData.answers,
    };

    onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg"
    >
      <FormField
        label="Học viên"
        name="student"
        type="select"
        value={formData.student}
        onChange={handleChange}
        error={errors.student}
        options={students.map((s) => ({
          value: s._id || s.id,
          label: s.fullname || s.name || s.email,
        }))}
        required
      />

      <FormField
        label="Bài Quiz"
        name="quiz"
        type="select"
        value={formData.quiz}
        onChange={handleChange}
        error={errors.quiz}
        options={quizzes.map((q) => ({
          value: q._id || q.id,
          label: q.title || q.name,
        }))}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Thời gian bắt đầu"
          name="startTime"
          type="datetime-local"
          value={formData.startTime}
          onChange={handleChange}
        />
        <FormField
          label="Thời gian kết thúc"
          name="endTime"
          type="datetime-local"
          value={formData.endTime}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Thời lượng (giây)"
          name="duration"
          type="number"
          value={formData.duration}
          onChange={handleChange}
          error={errors.duration}
          placeholder="VD: 1800 (30 phút)"
        />

        <FormField
          label="Điểm (0 - 100)"
          name="score"
          type="number"
          value={formData.score}
          onChange={handleChange}
          error={errors.score}
          placeholder="VD: 85"
        />
      </div>

      <FormField
        label="Trạng thái"
        name="status"
        type="select"
        value={formData.status}
        onChange={handleChange}
        options={[
          { value: "in_progress", label: "Đang làm" },
          { value: "completed", label: "Hoàn thành" },
          { value: "graded", label: "Đã chấm điểm" },
        ]}
      />

      <FormField
        label="Câu trả lời (Answers)"
        name="answers"
        type="multiselect"
        value={formData.answers}
        onChange={handleAnswerSelect}
        options={answersList.map((a) => ({
          value: a._id || a.id,
          label: `Câu hỏi ${a.question?.text?.slice(0, 40) || "Không rõ"}`,
        }))}
      />

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-700 text-white px-6 py-3 rounded-md hover:bg-indigo-800 disabled:opacity-50 transition"
        >
          {isLoading ? "Đang lưu..." : "Lưu bài làm"}
        </button>
      </div>
    </form>
  );
};

export default StudentAnswerForm;
