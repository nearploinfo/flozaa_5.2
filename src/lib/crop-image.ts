export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.crossOrigin = "anonymous";
    image.src = src;
  });
}

function getRadianAngle(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Bounding box of an `image.width` x `image.height` rect rotated by `rotation` degrees. */
function rotatedSize(width: number, height: number, rotation: number) {
  const radians = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height),
    height: Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height),
  };
}

/** Crops `imageSrc` to the given pixel region (post-rotation) and returns a JPEG File ready to upload. */
export async function getCroppedImageFile(
  imageSrc: string,
  crop: PixelCrop,
  rotation = 0,
  fileName = "profile.jpg"
): Promise<File> {
  const image = await loadImage(imageSrc);
  const { width: rotatedWidth, height: rotatedHeight } = rotatedSize(image.width, image.height, rotation);

  // Draw the full image rotated onto a canvas sized to its rotated bounding
  // box, then lift the crop rectangle (already given in rotated-image
  // coordinates by react-easy-crop) out of that canvas.
  const rotateCanvas = document.createElement("canvas");
  rotateCanvas.width = rotatedWidth;
  rotateCanvas.height = rotatedHeight;
  const rotateCtx = rotateCanvas.getContext("2d");
  if (!rotateCtx) throw new Error("Canvas is not supported.");

  rotateCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
  rotateCtx.rotate(getRadianAngle(rotation));
  rotateCtx.drawImage(image, -image.width / 2, -image.height / 2);

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported.");

  ctx.drawImage(rotateCanvas, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) throw new Error("Failed to crop image.");

  return new File([blob], fileName, { type: "image/jpeg" });
}
