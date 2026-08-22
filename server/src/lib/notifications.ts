import mongoose from "mongoose";

import NotificationModel from "../models/Notification";
import { getSocketIO } from "./socket";

export async function emitNotificationCount(userId: string): Promise<void> {
  const io = getSocketIO();
  if (!io) return;

  const unreadCount = await NotificationModel.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    isRead: false,
  });

  io.to(userId).emit("notification_count", { unreadCount, count: unreadCount });
}
