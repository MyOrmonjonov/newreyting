// Katta suratlarni saqlashdan oldin kichraytiramiz (data URL sifatida backendga
// yuboriladi va reytingda/ro'yxatlarda ham shu surat ishlatiladi).
const MAX_PHOTO_DIMENSION = 480;

export function readAndResizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas kontekstini ochib bo'lmadi."));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Suratni o'qib bo'lmadi."));
    };
    image.src = url;
  });
}
