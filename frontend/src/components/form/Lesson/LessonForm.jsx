import FormField from "../../common/FormField";
import UploadField from "../../upload/UploadField";
import { useLessonForm } from "./useLessonForm";

const LessonForm = ({
  initialData,
  onSubmit,
  isLoading,
  courseOptions = [],
}) => {
  const {
    formData,
    errors,
    handleChange,
    handleSubmit,
    files,
    setFiles,
    uploading,
    uploadError,
    uploadVideo,
    setFormData,
  } = useLessonForm(initialData, onSubmit);

  return (
    <form
      onSubmit={handleSubmit}
      className="p-8  rounded-xl shadow-xl max-w-[900px] mx-auto space-y-6"
    >
      <h2 className="text-2xl font-semibold border-b pb-2">
        {initialData ? "Cập nhật bài học" : "Tạo bài học mới"}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT */}
        <div className="space-y-4">
          <FormField
            label="Tên bài học"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            required
          />

          <FormField
            label="Thuộc khóa học"
            name="course"
            type="select"
            value={formData.course}
            onChange={handleChange}
            options={courseOptions}
            error={errors.course}
            required
          />

          <FormField
            label="Nội dung bài học"
            name="content"
            type="textarea"
            rows={6}
            value={formData.content}
            onChange={handleChange}
          />

          <div className="flex gap-4">
            <FormField
              label="Thời lượng (phút)"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              error={errors.duration}
            />

            <FormField
              label="Thứ tự"
              name="order"
              type="number"
              value={formData.order}
              onChange={handleChange}
              error={errors.order}
            />
          </div>

          <FormField
            label="Công khai bài học"
            name="isPublished"
            type="checkbox"
            checked={formData.isPublished}
            onChange={handleChange}
          />
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <div className="p-4 border rounded-xl  shadow-sm">
            <h3 className="font-semibold mb-3 text-gray-700">Video bài học</h3>

            <UploadField
              file={files.video}
              setFile={(f) => setFiles((p) => ({ ...p, video: f }))}
              progress={uploading.video}
              error={uploadError.video}
              onUpload={uploadVideo}
              accept="video/*"
              initialPreview={formData.videoUrl}
              onLinkChange={(url) =>
                setFormData((prev) => ({ ...prev, videoUrl: url }))
              }
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition disabled:opacity-50"
        >
          {isLoading ? "Đang lưu..." : "Lưu bài học"}
        </button>
      </div>
    </form>
  );
};

export default LessonForm;
