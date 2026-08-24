import crypto from "crypto";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload image buffer to Cloudinary via REST (no cloudinary npm SDK).
 * Client has already compressed; we ask Cloudinary for gentle delivery transforms only.
 */
export async function uploadToCloudinary(input: {
  buffer: Buffer;
  mimeType: string;
  folder?: string;
}): Promise<{
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
}> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured");
  }

  const folder = input.folder || "dutiheritage/products";
  const timestamp = Math.floor(Date.now() / 1000);

  // Sign: alphabetically sorted params + secret
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  const dataUri = `data:${input.mimeType};base64,${input.buffer.toString("base64")}`;

  const body = new URLSearchParams();
  body.set("file", dataUri);
  body.set("api_key", apiKey);
  body.set("timestamp", String(timestamp));
  body.set("signature", signature);
  body.set("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }
  );

  const json = (await res.json()) as {
    error?: { message?: string };
    secure_url?: string;
    public_id?: string;
    width?: number;
    height?: number;
    bytes?: number;
    format?: string;
  };

  if (!res.ok || !json.secure_url) {
    throw new Error(json.error?.message || "Cloudinary upload failed");
  }

  return {
    url: json.secure_url,
    publicId: json.public_id || "",
    width: json.width,
    height: json.height,
    bytes: json.bytes,
    format: json.format,
  };
}
