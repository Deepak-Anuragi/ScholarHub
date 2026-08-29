import mongoose from "mongoose";

/**
 * True when the request failed because the database was unreachable, as
 * opposed to a bug in the handler. Used only to pick 503 over 500 — it must
 * never be used to substitute mock data for real data.
 */
export function isDatabaseUnavailable(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof mongoose.Error) return true;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    const code = (err as { code?: string }).code;
    return (
      msg.includes("mongodb_uri") ||
      msg.includes("enotfound") ||
      msg.includes("econnrefused") ||
      msg.includes("querysrv") ||
      msg.includes("timed out") ||
      msg.includes("serverselection") ||
      msg.includes("topology") ||
      code === "ENOTFOUND" ||
      code === "ECONNREFUSED" ||
      err.name === "MongoServerSelectionError" ||
      err.name === "MongoNetworkError" ||
      err.name === "MongoTimeoutError"
    );
  }
  return false;
}
