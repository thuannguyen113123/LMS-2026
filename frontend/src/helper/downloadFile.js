export const downloadFile = (buffer, fileName, contentType) => {
  const blob = new Blob([buffer], { type: contentType });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};
