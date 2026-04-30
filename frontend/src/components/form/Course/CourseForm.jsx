import FormField from "../../common/FormField";
import UploadField from "../../upload/UploadField";
import { useCourseForm } from "./useCourseForm";

const CourseForm = ({
  initialData,
  onSubmit,
  isLoading,
  categoryOptions = [],
  instructorOptions = [],
  allowInstructorSelect = false,
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
    uploadCover,
    uploadVideo,
    setFormData,
  } = useCourseForm(initialData, onSubmit);

  return (
    <form
      onSubmit={handleSubmit}
      className="p-10 rounded-xl shadow-xl max-w-[1200px] mx-auto space-y-6"
    >
      {/* Header */}
      <h2 className="text-2xl font-semibold border-b pb-2">
        {initialData ? "Cập nhật khóa học" : "Tạo khóa học mới"}
      </h2>

      {/* GRID 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Cột trái */}
        <div className="space-y-2">
          <FormField
            label="Tiêu đề khóa học"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            required
            placeholder="Nhập tiêu đề khóa học"
          />
          <FormField
            label="Danh mục"
            name="category"
            type="select"
            value={formData.category}
            onChange={handleChange}
            error={errors.category}
            options={categoryOptions}
            required
          />
          {allowInstructorSelect ? (
            <FormField
              label="Giảng viên"
              name="instructor"
              type="select"
              value={formData.instructor}
              onChange={handleChange}
              options={instructorOptions}
            />
          ) : (
            <FormField label="Giảng viên" type="text" value="Bạn" disabled />
          )}
          <FormField
            label="Mô tả"
            name="description"
            type="textarea"
            rows={6}
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            required
          />
          {/* WHAT YOU WILL LEARN */}
          <FormField
            label="Bạn sẽ học được gì? (mỗi dòng 1 mục)"
            name="whatYouWillLearn"
            type="textarea"
            rows={6}
            value={formData.whatYouWillLearn?.join("\n")}
            onChange={(e) => {
              const lines = e.target.value.split("\n");
              setFormData((prev) => ({ ...prev, whatYouWillLearn: lines }));
            }}
            placeholder={`Ví dụ:\nNắm vững Node.js căn bản\nBiết xây dựng REST API\nHiểu Express, JWT\nDeploy dự án lên VPS`}
          />
          {/* ĐỐI TƯỢNG PHÙ HỢP */}
          <FormField
            label="Đối tượng phù hợp (mỗi dòng 1 mục)"
            name="audience"
            type="textarea"
            rows={4}
            value={formData.audience?.join("\n")}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                audience: e.target.value.split("\n"),
              }));
            }}
            placeholder={`Ví dụ:\nNgười mới học Machine Learning\nSinh viên CNTT\nLập trình viên muốn học AI`}
          />{" "}
          {/* YÊU CẦU ĐẦU VÀO */}
          <FormField
            label="Yêu cầu đầu vào (mỗi dòng 1 mục)"
            name="requirements"
            type="textarea"
            rows={4}
            value={formData.requirements?.join("\n")}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                requirements: e.target.value.split("\n"),
              }));
            }}
            placeholder={`Ví dụ:\nToán cơ bản\nPython cơ bản\nCó máy tính kết nối Internet`}
          />
          {/* Miễn phí */}
          <FormField
            label="Khóa học miễn phí"
            name="isFree"
            type="checkbox"
            checked={formData.isFree}
            onChange={handleChange}
          />
          {/* Giá */}
          {!formData.isFree && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Giá khóa học"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                error={errors.price}
              />
              <FormField
                label="Giá giảm"
                name="discountPrice"
                type="number"
                value={formData.discountPrice}
                onChange={handleChange}
                error={errors.discountPrice}
              />
            </div>
          )}
          <FormField
            label="Trạng thái"
            name="status"
            type="select"
            value={formData.status}
            onChange={handleChange}
            error={errors.status}
            options={[
              { value: "draft", label: "Nháp" },
              { value: "published", label: "Công khai" },
            ]}
            required
          />
        </div>

        {/* Cột phải */}
        <div className="space-y-4">
          <div className="flex space-x-4">
            <FormField
              label="Thời lượng (phút)"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              error={errors.duration}
              required
              placeholder="VD: 60"
            />
            <FormField
              label="Đánh giá (1-5)"
              name="rating"
              type="number"
              value={formData.rating}
              onChange={handleChange}
              error={errors.rating}
              required
              placeholder="VD: 4.5"
            />
          </div>

          {/* Ảnh bìa */}
          <div className="p-4 border rounded-lg ">
            <div className="p-4 border rounded-xl  shadow-sm">
              <h3 className="font-semibold mb-3 text-gray-700">Ảnh bìa</h3>
              <UploadField
                file={files.cover}
                setFile={(f) => setFiles((p) => ({ ...p, cover: f }))}
                progress={uploading.cover}
                error={uploadError.cover}
                onUpload={uploadCover}
                accept="image/*"
                initialPreview={formData.coverImage}
                onLinkChange={(url) =>
                  setFormData((prev) => ({ ...prev, coverImage: url }))
                }
              />
            </div>
          </div>

          {/* Video */}
          <div className="p-4 border rounded-xl  shadow-sm">
            <h3 className="font-semibold mb-3 text-gray-700">
              Video bài giảng
            </h3>

            <UploadField
              file={files.video}
              setFile={(f) => setFiles((p) => ({ ...p, video: f }))}
              progress={uploading.video}
              error={uploadError.video}
              onUpload={uploadVideo}
              accept="video/*"
              initialPreview={formData.videoURL}
              onLinkChange={(url) =>
                setFormData((prev) => ({ ...prev, videoURL: url }))
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
          {isLoading ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </form>
  );
};

export default CourseForm;
