"use client";

/**
 * High-quality client-side image compression (no npm dependency).
 * Uses canvas + WebP (fallback JPEG) at quality 0.92 so fashion
 * product photos stay sharp while file size drops.
 */

export const IMAGE_COMPRESS = {
  maxEdge: 2000,
  /** 0.92 ≈ visually lossless for retail product imagery */
  quality: 0.92,
  /** Skip re-encode if already under this size */
  skipBelowBytes: 220 * 1024,
};

export type CompressResult = {
  file: File;
  originalBytes: number;
  compressedBytes: number;
  savedPercent: number;
};

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Compression failed"));
        else resolve(blob);
      },
      type,
      quality
    );
  });
}

function supportsWebP(): boolean {
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    return c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

/**
 * Compress on-device before upload. Quality stays high (0.92);
 * only oversized dimensions / bulky files are reduced.
 */
export async function compressImageForUpload(
  file: File,
  onProgress?: (pct: number) => void
): Promise<CompressResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  const originalBytes = file.size;
  onProgress?.(10);

  if (originalBytes <= IMAGE_COMPRESS.skipBelowBytes) {
    onProgress?.(100);
    return {
      file,
      originalBytes,
      compressedBytes: originalBytes,
      savedPercent: 0,
    };
  }

  const img = await loadImage(file);
  onProgress?.(40);

  const { maxEdge, quality } = IMAGE_COMPRESS;
  let { width, height } = img;

  if (width > maxEdge || height > maxEdge) {
    const scale = maxEdge / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // High-quality downscale
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  onProgress?.(70);

  const useWebP = supportsWebP();
  const mime = useWebP ? "image/webp" : "image/jpeg";
  const blob = await canvasToBlob(canvas, mime, quality);
  onProgress?.(90);

  const ext = useWebP ? "webp" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  const outFile = new File([blob], `${base}.${ext}`, {
    type: mime,
    lastModified: Date.now(),
  });

  // Never keep a larger re-encode
  if (outFile.size >= originalBytes) {
    onProgress?.(100);
    return {
      file,
      originalBytes,
      compressedBytes: originalBytes,
      savedPercent: 0,
    };
  }

  onProgress?.(100);
  return {
    file: outFile,
    originalBytes,
    compressedBytes: outFile.size,
    savedPercent: Math.round(
      ((originalBytes - outFile.size) / originalBytes) * 100
    ),
  };
}
