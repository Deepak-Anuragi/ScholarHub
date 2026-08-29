import crypto from "crypto";

import { describe, expect, it } from "vitest";

import { isCloudinaryConfigured, isCloudinaryUrl, signUpload } from "./cloudinary";

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME as string;

describe("signUpload", () => {
  it("signs exactly the parameters the browser sends back", () => {
    expect(isCloudinaryConfigured).toBe(true);

    const folder = "scholarshub/libraries/64b8d9f0c1a2b3d4e5f6071a";
    const sig = signUpload(folder);

    expect(sig.folder).toBe(folder);
    expect(sig.uploadUrl).toBe(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`);
    expect(sig.timestamp).toBeGreaterThan(1_700_000_000);

    // Cloudinary verifies sha1 of the sorted params followed by the secret.
    const expected = crypto
      .createHash("sha1")
      .update(`folder=${sig.folder}&timestamp=${sig.timestamp}${process.env.CLOUDINARY_API_SECRET}`)
      .digest("hex");
    expect(sig.signature).toBe(expected);
  });
});

describe("isCloudinaryUrl", () => {
  // Anything a client posts is checked with this before it is stored, so a
  // hand-crafted URL cannot turn into a library photo.
  const accepted = [
    `https://res.cloudinary.com/${CLOUD}/image/upload/v1/scholarshub/libraries/a.jpg`,
    `https://res.cloudinary.com/${CLOUD}/image/upload/w_800,c_fill/v1712/a.webp`,
  ];

  const rejected = [
    `https://res.cloudinary.com/someone-else/image/upload/v1/a.jpg`,
    `https://res.cloudinary.com/${CLOUD}/image/fetch/https://example.com/a.jpg`,
    `https://res.cloudinary.com/${CLOUD}/raw/upload/a.svg`,
    `https://res.cloudinary.com/${CLOUD}/image/upload/`,
    `https://res.cloudinary.com/${CLOUD}`,
    `http://res.cloudinary.com/${CLOUD}/image/upload/v1/a.jpg`,
    `https://res.cloudinary.com.example.com/${CLOUD}/image/upload/a.jpg`,
    `https://res.cloudinary.com@example.com/${CLOUD}/image/upload/a.jpg`,
    `https://example.com/${CLOUD}/image/upload/a.jpg`,
    "javascript:alert(1)",
    "not a url",
    "",
  ];

  it.each(accepted)("accepts %s", (url) => {
    expect(isCloudinaryUrl(url)).toBe(true);
  });

  it.each(rejected)("rejects %s", (url) => {
    expect(isCloudinaryUrl(url)).toBe(false);
  });
});
