// Minimal image validation and preview helpers for OPUc.
(function () {
  "use strict";

  const root = window.Cudloun;
  const runtime = root.opuc = root.opuc || {};

  runtime.imagePipeline = {
    validateFile,
    describeFile,
    formatBytes,
  };

  function validateFile(file, maxBytes) {
    if (!(file instanceof Blob)) throw new Error("Choose an image file first.");
    if (!String(file.type || "").startsWith("image/")) throw new Error("The selected file is not an image.");
    if (!file.size) throw new Error("The selected image is empty.");
    if (maxBytes > 0 && file.size > maxBytes) {
      throw new Error(`The image is larger than the ${formatBytes(maxBytes)} upload limit.`);
    }
    return file;
  }

  function describeFile(file) {
    return {
      name: String(file?.name || "image"),
      type: String(file?.type || "application/octet-stream"),
      size: Number(file?.size || 0),
      sizeText: formatBytes(Number(file?.size || 0)),
    };
  }

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const amount = value / Math.pow(1024, index);
    return `${Number(amount.toFixed(index ? 1 : 0))} ${units[index]}`;
  }
})();
