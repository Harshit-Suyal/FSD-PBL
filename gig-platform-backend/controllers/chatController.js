import Gig from "../models/Gig.js";
import Message from "../models/Message.js";
import Application from "../models/Application.js";

const buildParticipants = async (gigId, gig) => {
  const applicantIds = await Application.distinct("worker", { gig: gigId });
  return new Set([
    gig.client.toString(),
    ...gig.assignedWorkers.map((workerId) => workerId.toString()),
    ...applicantIds.map((workerId) => workerId.toString()),
  ]);
};

const ensureGigChatAccess = async (gigId, gig, userId, role) => {
  if (!gig) return { ok: false, status: 404, message: "Gig not found" };
  if (role === "admin") {
    return { ok: true, participants: new Set() };
  }

  const participants = await buildParticipants(gigId, gig);
  if (!participants.has(userId)) {
    return { ok: false, status: 403, message: "Unauthorized chat access" };
  }

  return { ok: true, participants };
};

export const getGigMessages = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    const access = await ensureGigChatAccess(req.params.gigId, gig, req.user.id, req.user.role);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const messages = await Message.find({ gig: req.params.gigId })
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

    const gig = await Gig.findById(req.params.gigId);
    const access = await ensureGigChatAccess(req.params.gigId, gig, req.user.id, req.user.role);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const allowedReceivers = req.user.role === "admin" ? [] : Array.from(access.participants);

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

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};