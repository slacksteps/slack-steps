const MAX_PROFILE_IMAGE_DIMENSION = 640;
const JPEG_QUALITY = 0.8;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    const cleanup = () => URL.revokeObjectURL(objectUrl);
    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error('Unsupported image format'));
    };
    image.src = objectUrl;
  });
}

function getResizedDimensions(width: number, height: number) {
  const longestSide = Math.max(width, height);
  if (longestSide <= MAX_PROFILE_IMAGE_DIMENSION) return { width, height };

  const scale = MAX_PROFILE_IMAGE_DIMENSION / longestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Image conversion failed')),
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Image encoding failed'));
      }
    };
    reader.onerror = () => reject(new Error('Image encoding failed'));
    reader.readAsDataURL(blob);
  });
}

export async function compressProfileImage(file: File): Promise<string> {
  const image = await loadImage(file);
  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error('Invalid image dimensions');
  }

  const size = getResizedDimensions(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');

  // JPEG has no transparency, so use white instead of a black transparent background.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(image, 0, 0, size.width, size.height);

  const blob = await canvasToBlob(canvas);
  return blobToDataUrl(blob);
}
