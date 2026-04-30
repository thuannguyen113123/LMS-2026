import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import FormField from "../common/FormField";

// Dữ liệu mặc định nếu không có initialData truyền vào
const defaultData = {
  roomName: "",
  senderName: "",
  content: "",
  messageType: "text",
  attachmentsCount: 0,
  reactionsCount: 0,
  replyToContent: "",
  createdAt: new Date().toISOString().slice(0, 16), // datetime-local format
  status: "ok",
};

const MessageForm = ({ initialData = {}, onSubmit }) => {
  const loading = useSelector((state) => state.ui.loadingCount > 0);
  const [formData, setFormData] = useState(defaultData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Convert ISO to datetime-local if available
    const formattedData = {
      ...defaultData,
      ...initialData,
      createdAt: initialData.createdAt
        ? new Date(initialData.createdAt).toISOString().slice(0, 16)
        : defaultData.createdAt,
    };
    setFormData(formattedData);
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const errs = {};
    if (!formData.roomName.trim()) errs.roomName = "Phòng chat bắt buộc";
    if (!formData.senderName.trim()) errs.senderName = "Người gửi bắt buộc";
    if (!formData.content.trim()) errs.content = "Nội dung không được để trống";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === "number" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);

    const finalData = {
      ...formData,
      createdAt: new Date(formData.createdAt).toISOString(), // ISO format for backend
    };

    if (onSubmit) onSubmit(finalData);
  };

  return (
    <div>
      {loading && (
        <div className="mb-2 text-blue-600 font-semibold">Đang tải...</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          name="roomName"
          label="Phòng chat"
          value={formData.roomName}
          onChange={handleChange}
          error={errors.roomName}
          required
        />

        <FormField
          name="senderName"
          label="Người gửi"
          value={formData.senderName}
          onChange={handleChange}
          error={errors.senderName}
          required
        />

        <FormField
          name="content"
          label="Nội dung"
          value={formData.content}
          onChange={handleChange}
          error={errors.content}
          type="textarea"
          required
        />

        <FormField
          name="messageType"
          label="Loại tin nhắn"
          type="select"
          value={formData.messageType}
          onChange={handleChange}
          options={[
            { value: "text", label: "Text" },
            { value: "system", label: "System" },
            { value: "attachment", label: "Attachment" },
          ]}
        />

        <FormField
          name="attachmentsCount"
          label="Số file đính kèm"
          type="number"
          value={formData.attachmentsCount}
          onChange={handleChange}
        />

        <FormField
          name="reactionsCount"
          label="Số lượt reaction"
          type="number"
          value={formData.reactionsCount}
          onChange={handleChange}
        />

        <FormField
          name="replyToContent"
          label="Nội dung trả lời"
          type="textarea"
          value={formData.replyToContent}
          onChange={handleChange}
        />

        <FormField
          name="createdAt"
          label="Thời gian gửi"
          type="datetime-local"
          value={formData.createdAt}
          onChange={handleChange}
        />

        <FormField
          name="status"
          label="Trạng thái"
          type="select"
          value={formData.status}
          onChange={handleChange}
          options={[
            { value: "ok", label: "OK" },
            { value: "edited", label: "Đã chỉnh sửa" },
            { value: "deleted", label: "Đã xoá" },
          ]}
        />

        <div className="flex justify-end">
          <button
            type="submit"
            className={`px-4 py-2 rounded text-white ${
              loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            disabled={loading}
          >
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageForm;
