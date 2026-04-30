import React from "react";
import useStudentForm from "./useStudentForm";
import FormField from "../../common/FormField";

const StudentForm = ({
  initialData,
  onSubmit,
  isLoading = false,
  users = [],
}) => {
  const { formData, errors, handleChange, submitForm } = useStudentForm(
    initialData,
    users
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    submitForm(onSubmit);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-2xl mx-auto p-6  rounded-lg shadow-md"
    >
      <FormField
        label="Liên kết tài khoản người dùng"
        name="user"
        type="select"
        value={formData.user}
        onChange={handleChange}
        error={errors.user}
        required
        options={users.map((u) => ({
          value: u.id,
          label: u.fullname || u.email,
        }))}
        placeholder="Chọn tài khoản"
      />

      <h3 className="text-lg font-semibold mt-6 text-gray-700">
        Tuỳ chọn người dùng
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Ngôn ngữ"
          name="preferences.language"
          type="select"
          value={formData.preferences.language}
          onChange={handleChange}
          options={[
            { value: "vi", label: "Tiếng Việt" },
            { value: "en", label: "English" },
          ]}
        />

        <FormField
          label="Thông báo"
          name="preferences.notifications"
          type="checkbox"
          checked={formData.preferences.notifications}
          onChange={handleChange}
        />

        <FormField
          label="Chế độ tối"
          name="preferences.darkMode"
          type="checkbox"
          checked={formData.preferences.darkMode}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-700 text-white px-6 py-3 rounded-md hover:bg-indigo-800 disabled:opacity-50 transition"
        >
          {isLoading ? "Đang lưu..." : "Lưu sinh viên"}
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
