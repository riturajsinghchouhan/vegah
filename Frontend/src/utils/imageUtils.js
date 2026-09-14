/**
 * Compresses an image file and converts it to a Base64 string.
 * This is used to store images in localStorage without exceeding the 5MB limit.
 * 
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - The maximum width of the compressed image
 * @returns {Promise<Object>} - A promise that resolves to an object containing name and base64 data URL
 */
export const compressImageToBase64 = (file, maxWidth = 800) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = maxWidth / img.width;
        
        // Only scale down if the image is wider than maxWidth
        const scale = ratio < 1 ? ratio : 1;
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Compress as JPEG with 0.7 quality
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve({
          name: file.name,
          dataUrl: dataUrl
        });
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
