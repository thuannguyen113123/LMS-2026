import axios from "axios";

/**
 * Upload file to Cloudinary (image / video / raw)
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = async (file, onProgress) => {
  const cloudName = "damvk9qoe";
  const uploadPreset = "LMS-2025";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const resourceType = file.type.startsWith("video")
    ? "video"
    : file.type.startsWith("image")
    ? "image"
    : "raw";

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    formData,
    {
      onUploadProgress: (e) => {
        const percent = Math.round((e.loaded * 100) / e.total);

        if (onProgress) {
          onProgress(percent);
        }
      },
    }
  );

  const data = response.data;

  data.optimized_url = data.secure_url.replace(
    "/upload/",
    "/upload/q_auto,f_auto/"
  );

  return data;
};
