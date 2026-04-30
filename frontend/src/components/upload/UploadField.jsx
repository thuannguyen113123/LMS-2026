import React, { useEffect, useState, useRef } from "react";

const formatBytes = (bytes) => {
  if (!bytes) return "0 KB";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
};

const UploadField = ({
  label,
  file,
  setFile,
  progress,
  error,
  onUpload,
  accept = "",
  initialPreview = null,
  onLinkChange,
  variant = "default",
}) => {
  const [previewURL, setPreviewURL] = useState(initialPreview || null);
  const [linkURL, setLinkURL] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef(null);
  const lastSyncedRef = useRef("");

  // LOAD PREVIEW WHEN EDIT
  useEffect(() => {
    if (!initialPreview) return;
    if (file) return;

    setPreviewURL(initialPreview);
    setLinkURL(initialPreview);
  }, [initialPreview, file]);
  // PREVIEW FILE
  useEffect(() => {
    if (!file) return;

    const objectURL = URL.createObjectURL(file);
    setPreviewURL(objectURL);

    return () => URL.revokeObjectURL(objectURL);
  }, [file]);

  // LINK PREVIEW
  useEffect(() => {
    if (!linkURL) return;
    setPreviewURL(linkURL);
  }, [linkURL]);

  // SYNC LINK
  useEffect(() => {
    if (!onLinkChange) return;
    // tránh loop nếu giống nhau
    if (lastSyncedRef.current === linkURL) return;

    lastSyncedRef.current = linkURL;
    onLinkChange(linkURL);
  }, [linkURL, onLinkChange]);

  const clearAll = () => {
    setFile(null);
    setPreviewURL(null);
    setLinkURL("");

    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    setFile(droppedFile);
  };

  const renderPreview = () => {
    if (!previewURL) return null;

    if (accept.includes("image"))
      return (
        <img
          src={previewURL}
          alt="preview"
          className="w-full h-56 object-cover"
        />
      );

    if (accept.includes("video"))
      return (
        <video src={previewURL} controls className="w-full h-56 bg-black" />
      );

    return null;
  };
  if (variant === "avatar") {
    return (
      <div className="flex flex-col items-center gap-2">
        <div
          className="relative w-32 h-32 rounded-full overflow-hidden border cursor-pointer group"
          onClick={() => inputRef.current.click()}
        >
          {previewURL ? (
            <img
              src={previewURL}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              Upload
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm transition">
            Đổi ảnh
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {label && <p className="font-semibold">{label}</p>}

      <input
        type="text"
        placeholder="Dán link..."
        value={linkURL}
        onChange={(e) => setLinkURL(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />

      {previewURL ? (
        <div className="relative group">
          <button
            type="button"
            onClick={clearAll}
            className="absolute top-2 right-2 bg-white rounded-full w-8 h-8"
          >
            ✕
          </button>

          {renderPreview()}

          {file && (
            <div className="text-sm text-gray-500 flex justify-between">
              <span>{file.name}</span>
              <span>{formatBytes(file.size)}</span>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`h-40 border-2 border-dashed flex items-center justify-center cursor-pointer transition
          ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300"}`}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          Kéo thả hoặc click
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => setFile(e.target.files[0])}
      />

      {(file || linkURL) && !progress && (
        <button
          type="button"
          onClick={onUpload}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Upload
        </button>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default UploadField;
