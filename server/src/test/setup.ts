import { inject } from "vitest";

// Env every test file depends on, set before any module under src/ is
// imported: lib/auth throws at import time without JWT_SECRET, and the booking
// tests sign Razorpay payloads with these keys.
process.env.JWT_SECRET ??= "test-jwt-secret-not-used-anywhere-real";
process.env.RAZORPAY_KEY_ID ??= "rzp_test_key";
process.env.RAZORPAY_KEY_SECRET ??= "rzp_test_secret";
// Photo upload reads these at module load, so they cannot be stubbed later.
process.env.CLOUDINARY_CLOUD_NAME ??= "test-cloud";
process.env.CLOUDINARY_API_KEY ??= "test-api-key";
process.env.CLOUDINARY_API_SECRET ??= "test-api-secret";
process.env.MONGODB_URI = inject("mongoUri");
