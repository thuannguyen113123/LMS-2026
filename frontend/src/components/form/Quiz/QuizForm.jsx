import React from "react";
import FormField from "../../common/FormField";
import { useQuizForm } from "./useQuizForm";

const QuizForm = ({
  initialData,
  onSubmit,
  isLoading = false,
  courseOptions = [],

  instructorOptions = [],
  lessonOptions = [],
  currentUser = null,
  onCourseChange,
}) => {
  const { formData, errors, handleChange, handleSubmit, lessonsLoading } =
    useQuizForm(initialData, onSubmit, currentUser);

  console.log(currentUser);
  console.log("createdBy:", formData.createdBy);
  console.log("options:", instructorOptions);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-3xl mx-auto p-6  rounded-lg shadow-lg"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <FormField
          label="Tiêu đề Quiz"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          required
          placeholder="VD: Bài kiểm tra chương 1"
        />
        <FormField
          label="Scope (Phạm vi)"
          name="scope"
          type="select"
          value={formData.scope}
          onChange={handleChange}
          options={[
            { value: "course", label: "Thuộc khóa học" },
            { value: "lesson", label: "Thuộc bài học" },
          ]}
          required
        />

        <FormField
          label="Thuộc khóa học"
          name="course"
          type="select"
          value={formData.course}
          onChange={(e) => {
            handleChange(e);

            const selected = courseOptions.find(
              (c) => c.value === e.target.value
            );

            if (selected) {
              onCourseChange?.(selected.value);
            }

            handleChange({
              target: { name: "lesson", value: "" },
            });
          }}
          options={courseOptions}
          error={errors.course}
          required
        />
        <FormField
          label="Bài học"
          name="lesson"
          type="select"
          value={formData.lesson}
          onChange={handleChange}
          options={lessonOptions}
          disabled={
            formData.scope !== "lesson" || !formData.course || lessonsLoading
          }
          placeholder={
            !formData.course
              ? "Chọn khóa học trước"
              : lessonsLoading
              ? "Đang tải..."
              : "Chọn bài học"
          }
        />

        <FormField
          label="Loại quiz"
          name="type"
          type="select"
          value={formData.type}
          onChange={handleChange}
          options={[
            { value: "quiz", label: "Quiz thường" },
            { value: "exam", label: "Bài thi" },
            { value: "practice", label: "Luyện tập" },
          ]}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Thời gian (phút)"
            name="timeLimit"
            type="number"
            value={formData.timeLimit}
            onChange={handleChange}
            error={errors.timeLimit}
            placeholder="VD: 30"
          />

          <FormField
            label="Điểm qua môn (%)"
            name="passingScore"
            type="number"
            value={formData.passingScore}
            onChange={handleChange}
            error={errors.passingScore}
            placeholder="VD: 70"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Số lần làm tối đa"
            name="maxAttempts"
            type="number"
            value={formData.maxAttempts}
            onChange={handleChange}
            error={errors.maxAttempts}
            placeholder="VD: 1"
          />

          <FormField
            label="Người tạo Quiz"
            name="createdBy"
            type={
              currentUser?.activeRole?.name === "admin" ||
              currentUser?.activeRole?.name === "superadmin"
                ? "select"
                : "text"
            }
            value={formData.createdBy}
            onChange={handleChange}
            options={
              currentUser?.activeRole?.name === "instructor"
                ? []
                : instructorOptions
            }
            disabled={currentUser?.activeRole?.name === "instructor"}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Xáo trộn câu hỏi"
            name="shuffleQuestions"
            type="checkbox"
            checked={formData.shuffleQuestions}
            onChange={handleChange}
          />

          <FormField
            label="Xáo trộn đáp án"
            name="shuffleOptions"
            type="checkbox"
            checked={formData.shuffleOptions}
            onChange={handleChange}
          />
        </div>

        <FormField
          label="Công khai (Publish)"
          name="isPublished"
          type="checkbox"
          checked={formData.isPublished}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-700 text-white px-6 py-3 rounded-md hover:bg-indigo-800 disabled:opacity-50 transition"
        >
          {isLoading ? "Đang lưu..." : "Lưu Quiz"}
        </button>
      </div>
    </form>
  );
};

export default QuizForm;
