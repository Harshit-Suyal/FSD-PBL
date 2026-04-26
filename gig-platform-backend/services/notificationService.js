import Notification from "../models/Notification.js";
import { emitToUser } from "../utils/socket.js";

export const createNotification = async ({
  recipientId,
  senderId = null,
  type = "general",
  title,
  message,
  relatedGigId = null,
}) => {
  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message,
    relatedGig: relatedGigId,
  });

  const populated = await Notification.findById(notification._id)
    .populate("sender", "name email role")
    .populate("relatedGig", "title status paymentStatus budget");

  emitToUser(recipientId, "notification:new", populated);
  return populated;
};