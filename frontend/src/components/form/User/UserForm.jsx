import FormField from "../../common/FormField";
import { useUserForm } from "./useUserForm";
import SwitchMethodButton from "./../../common/SwitchMethodButton";

const UserForm = ({ initialData, onSubmit, isLoading, roleOptions = [] }) => {
  const { formData, errors, method, handleChange, handleSubmit, toggleMethod } =
    useUserForm(initialData, onSubmit);

  return (
    <form
      onSubmit={handleSubmit}
      className="p-8  rounded-xl shadow max-w-md mx-auto space-y-4"
    >
      <h2 className="text-xl font-semibold border-b pb-2">
        {initialData ? "Cập nhật người dùng" : "Tạo người dùng"}
      </h2>

      <FormField
        label="Tên người dùng"
        name="fullname"
        value={formData.fullname}
        onChange={handleChange}
        error={errors.fullname}
        required
      />

      {method === "email" ? (
        <FormField
          label="Email"
          name="email"
          type="email"
          disabled={!!initialData}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
      ) : (
        <FormField
          label="Số điện thoại"
          name="phone"
          type="phone"
          disabled={!!initialData}
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          required
        />
      )}

      <SwitchMethodButton method={method} toggleMethod={toggleMethod} />

      {!initialData && (
        <FormField
          label="Vai trò"
          name="role_id"
          type="select"
          value={formData.role_id}
          onChange={handleChange}
          error={errors.role_id}
          options={roleOptions}
          required
        />
      )}
      <div className="flex justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
        >
          {isLoading ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
