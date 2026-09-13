import { v2 as cloudinary } from "cloudinary";

/**
 * Signed, owner-scoped uploads.
 *
 * The browser used to upload with an unsigned preset, which meant anyone who
 * read the cloud name out of the page could push files into the account. The
 * browser now asks this server for a short-lived signature that pins the
 * destination folder, and the server only stores URLs that came back from our
 * own account.
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

/** Uploads are unavailable rather than degraded when this is false. */
export const isCloudinaryConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
}

/** The only host a stored photo URL may point at. */
export const CLOUDINARY_HOST = "res.cloudinary.com";

export interface SignedUpload {
  uploadUrl: string;
  apiKey: string;
  /** Seconds since the epoch. Cloudinary rejects a signature older than an hour. */
  timestamp: number;
  signature: string;
  /** Signed, so the upload cannot land anywhere else in the account. */
  folder: string;
}

export function signUpload(folder: string): SignedUpload {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary is not configured.");
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    API_SECRET as string
  );
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    apiKey: API_KEY as string,
    timestamp,
    signature,
    folder,
  };
}

/**
 * True only for a delivery URL from this account. Anything a client posts is
 * checked with this before it is stored, so a hand-crafted URL pointing at
 * someone else's host is rejected rather than rendered as a library photo.
 */
export function isCloudinaryUrl(url: string): boolean {
  if (!isCloudinaryConfigured) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.hostname !== CLOUDINARY_HOST) return false;
  // Shape of every delivery URL an image upload returns:
  //   https://res.cloudinary.com/<cloud>/image/upload/<transforms…>/<public id>
  const [, cloud, resourceType, deliveryType, ...rest] = parsed.pathname.split("/");
  return (
    cloud === CLOUD_NAME &&
    resourceType === "image" &&
    deliveryType === "upload" &&
    rest.join("/").length > 0
  );
}
