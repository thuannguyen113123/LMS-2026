import React from "react";
import FormField from "../../common/FormField";
import { useQuestionForm } from "./useQuestionForm";

const QuestionForm = ({
  initialData,
  onSubmit,
  isLoading,
  quizOptions = [],
  quizOptionsLoading = false,
}) => {
  const {
    formData,
    errors,
    handleChange,
    handleOptionChange,
    handleSubmit,
    setFormData,
  } = useQuestionForm(initialData, onSubmit);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-4xl mx-auto p-6  rounded-lg shadow-lg"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-2">
          <FormField
            label="Thuộc bài Quiz"
            name="quiz"
            type="select"
            value={formData.quiz}
            onChange={handleChange}
            error={errors.quiz}
            required
            options={quizOptions}
            disabled={quizOptionsLoading}
          />
          <FormField
            label="Nội dung câu hỏi"
            name="content"
            type="textarea"
            value={formData.content}
            onChange={handleChange}
            error={errors.content}
            placeholder="Nhập nội dung câu hỏi..."
          />
          {formData.type === "multiple_choice" && (
            <div className="space-y-4">
              {formData.options.map((opt, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center  p-2 rounded"
                >
                  <div className="col-span-7">
                    <FormField
                      label={`Đáp án ${index + 1}`}
                      value={opt.text}
                      onChange={(e) =>
                        handleOptionChange(index, "text", e.target.value)
                      }
                      placeholder="Nhập nội dung đáp án..."
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={opt.isCorrect}
                        onChange={(e) =>
                          handleOptionChange(
                            index,
                            "isCorrect",
                            e.target.checked
                          )
                        }
                      />
                      <span className="text-sm">Đúng</span>
                    </label>
                  </div>
                  <div className="col-span-3">
                    <FormField
                      label="Feedback"
                      value={opt.feedback}
                      onChange={(e) =>
                        handleOptionChange(index, "feedback", e.target.value)
                      }
                      placeholder="Phản hồi (tùy chọn)"
                    />
                  </div>
                </div>
              ))}
              {errors.options && (
                <p className="text-red-600 text-sm">{errors.options}</p>
              )}
            </div>
          )}

          {formData.type === "true_false" && (
            <div className="flex gap-6 mt-4 justify-center">
              {["Đúng", "Sai"].map((text, index) => {
                const isSelected =
                  formData.correctAnswers[0] === text.toLowerCase();
                return (
                  <FormField
                    key={index}
                    type="radio"
                    name="correctAnswers"
                    label={text}
                    value={text.toLowerCase()}
                    checked={isSelected}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        correctAnswers: [text.toLowerCase()],
                      }))
                    }
                    className={`
            flex-1 text-center py-4 text-xl font-semibold rounded-lg cursor-pointer
            border-2 transition-all duration-200
            ${
              isSelected
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300"
            }
            hover:bg-indigo-100
          `}
                  />
                );
              })}
            </div>
          )}
          {formData.type === "short_answer" && (
            <div className="mt-4">
              <FormField
                label="Câu trả lời đúng"
                name="correctAnswers"
                type="textarea"
                value={formData.correctAnswers.join("\n")}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    correctAnswers: e.target.value
                      .split("\n")
                      .map((t) => t.trim()),
                  }))
                }
                placeholder="Nhập các câu trả lời đúng, mỗi câu trên một dòng"
                rows={3}
                className="text-lg"
              />
              {errors.correctAnswers && (
                <p className="text-red-600 text-sm">{errors.correctAnswers}</p>
              )}
            </div>
          )}
          {formData.type === "coding" && (
            <div className="mt-4">
              <FormField
                label="Đáp án mẫu (Code)"
                name="correctAnswers"
                type="textarea"
                value={formData.correctAnswers.join("\n")}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    correctAnswers: e.target.value.split("\n").map((t) => t),
                  }))
                }
                placeholder={`Nhập code mẫu cho câu hỏi.\nCó thể dùng nhiều dòng.`}
                rows={8}
                className="text-lg font-mono"
              />
              {errors.correctAnswers && (
                <p className="text-red-600 text-sm">{errors.correctAnswers}</p>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Loại câu hỏi"
              name="type"
              type="select"
              value={formData.type}
              onChange={handleChange}
              options={[
                { label: "Trắc nghiệm", value: "multiple_choice" },
                { label: "Đúng / Sai", value: "true_false" },
                { label: "Tự luận ngắn", value: "short_answer" },
                { label: "Lập trình", value: "coding" },
              ]}
              error={errors.type}
            />

            <FormField
              label="Độ khó"
              name="difficulty"
              type="select"
              value={formData.difficulty}
              onChange={handleChange}
              options={[
                { label: "Dễ", value: "easy" },
                { label: "Trung bình", value: "medium" },
                { label: "Khó", value: "hard" },
              ]}
            />
          </div>

          <FormField
            label="Giải thích (Explanation)"
            name="explanation"
            type="textarea"
            value={formData.explanation}
            onChange={handleChange}
            placeholder="Giải thích cho đáp án đúng (nếu có)"
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Tags (phân loại)"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="VD: JS, React, Căn bản"
            />
            <FormField
              label="Điểm"
              name="points"
              type="number"
              value={formData.points}
              onChange={handleChange}
              error={errors.points}
              placeholder="VD: 1"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-700 text-white px-6 py-3 rounded-md hover:bg-indigo-800 disabled:opacity-50 transition"
        >
          {isLoading ? "Đang lưu..." : "Lưu câu hỏi"}
        </button>
      </div>
    </form>
  );
};

export default QuestionForm;
