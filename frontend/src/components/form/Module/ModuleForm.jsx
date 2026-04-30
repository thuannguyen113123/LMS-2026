import FormField from "../../common/FormField";
import UploadField from "../../upload/UploadField";
import { useModuleForm } from "./useModuleForm";

const ModuleForm = ({ initialData, onSubmit, isLoading }) => {
  const {
    formData,
    errors,
    handleChange,
    handleSubmit,
    iconFile,
    setIconFile,
    uploadProgress,
    uploadError,
    handleUploadIcon,
    setFormData,
  } = useModuleForm(initialData, onSubmit);

  return (
    <form
      onSubmit={handleSubmit}
      className="p-10  rounded-xl shadow-xl max-w-[800px] mx-auto space-y-6"
    >
      {/* Header */}
      <h2 className="text-2xl font-semibold border-b pb-2">
        {initialData ? "Cập nhật module" : "Tạo module mới"}
      </h2>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cột trái */}
        <div className="space-y-4">
          <FormField
            label="Tên module"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            placeholder="VD: Quản lý khóa học"
          />

          <FormField
            label="Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            error={errors.code}
            required
            placeholder="VD: COURSE_MANAGEMENT"
          />

          <FormField
            label="Path"
            name="path"
            value={formData.path}
            onChange={handleChange}
            error={errors.path}
            placeholder="/courses"
          />

          <FormField
            label="Thứ tự hiển thị"
            name="order"
            type="number"
            value={formData.order}
            onChange={handleChange}
            error={errors.order}
            placeholder="0"
          />

          <FormField
            label="Nhóm module"
            name="group"
            type="select"
            value={formData.group}
            onChange={handleChange}
            error={errors.group}
            options={[
              { label: "Main", value: "main" },
              { label: "Management", value: "management" },
              { label: "Others", value: "others" },
            ]}
          />

          {/* Visibility */}
          <FormField
            label="Visibility"
            name="visibility"
            type="select"
            value={formData.visibility}
            onChange={handleChange}
            error={errors.visibility}
            options={[
              { label: "Admin", value: "admin" },
              { label: "Public", value: "public" },
              { label: "Instructor", value: "instructor" },

              { label: "Both", value: "both" },
            ]}
          />
          <FormField
            label="Mô tả"
            name="description"
            type="textarea"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
          />

          <FormField
            label="Kích hoạt"
            name="isActive"
            type="checkbox"
            checked={formData.isActive}
            onChange={handleChange}
          />

          <FormField
            label="Module hệ thống (không cho xóa)"
            name="isSystemModule"
            type="checkbox"
            checked={formData.isSystemModule}
            onChange={handleChange}
          />
        </div>

        {/* Cột phải */}
        <div className="space-y-4">
          <div className="p-4 border rounded-xl  shadow-sm">
            <h3 className="font-semibold mb-3 text-gray-700">Icon module</h3>

            <UploadField
              file={iconFile}
              setFile={setIconFile}
              progress={uploadProgress}
              error={uploadError}
              onUpload={handleUploadIcon}
              accept="image/*"
              initialPreview={initialData?.icon}
              onLinkChange={(url) =>
                setFormData((prev) => ({ ...prev, icon: url }))
              }
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-6 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition disabled:opacity-50"
        >
          {isLoading ? "Đang lưu..." : "Lưu module"}
        </button>
      </div>
    </form>
  );
};

export default ModuleForm;
