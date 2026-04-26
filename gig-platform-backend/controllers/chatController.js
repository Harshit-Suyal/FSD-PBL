import Message from "../models/Message.js";
import { canAccessGigChat } from "../utils/chatAccess.js";
import { emitToGig, emitToUser } from "../utils/socket.js";

export const getGigMessages = async (req, res) => {
  try {
    const access = await canAccessGigChat(req.params.gigId, req.user.id, req.user.role);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const query = { gig: req.params.gigId };

    if (req.user.role === "worker") {
      // Workers should only see messages in their own thread (to/from themselves).
      query.$or = [{ sender: req.user.id }, { receiver: req.user.id }];
    } else if (req.user.role === "client") {
      // Clients should only see messages in their own thread with workers.
      query.$or = [{ sender: req.user.id }, { receiver: req.user.id }];
    }

    const messages = await Message.find(query)
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendGigMessage = async (req, res) => {
  try {
    const { receiverId, message, messageType = "text", amountOffer } = req.body;

    const cleanMessage = String(message || "").trim();
    const hasOffer = amountOffer !== undefined && amountOffer !== null && amountOffer !== "";
    if (!cleanMessage && !hasOffer) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    if (!["text", "offer"].includes(messageType)) {
      return res.status(400).json({ message: "Invalid message type" });
    }

    let parsedOffer = null;
    if (hasOffer) {
      parsedOffer = Number(amountOffer);
      if (!parsedOffer || parsedOffer <= 0) {
        return res.status(400).json({ message: "Offer amount must be greater than zero" });
      }
    }

    const access = await canAccessGigChat(req.params.gigId, req.user.id, req.user.role);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const gig = access.gig;

    let allowedReceivers = [];
    if (req.user.role === "worker") {
      // Workers can message only the gig client.
      allowedReceivers = [gig.client.toString()];
    } else if (req.user.role === "client") {
      // Clients can message workers who are part of this gig/application thread.
      allowedReceivers = Array.from(access.participants).filter((id) => id !== gig.client.toString());
    } else {
      allowedReceivers = Array.from(access.participants);
    }

    if (req.user.role !== "admin" && !allowedReceivers.includes(receiverId)) {
      return res.status(403).json({ message: "Receiver is not part of this chat" });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ message: "Cannot send message to yourself" });
    }

    const created = await Message.create({
      gig: req.params.gigId,
      sender: req.user.id,
      receiver: receiverId,
      message: cleanMessage || `Offer: ₹${parsedOffer.toLocaleString("en-IN")}`,
      messageType,
      amountOffer: parsedOffer,
    });

    const populated = await Message.findById(created._id)
      .populate("sender", "name email")
      .populate("receiver", "name email");

    emitToGig(req.params.gigId, "message:new", populated);
    emitToUser(receiverId, "message:new", populated);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};