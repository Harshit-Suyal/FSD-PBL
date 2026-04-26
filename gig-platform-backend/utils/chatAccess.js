import Gig from "../models/Gig.js";
import Application from "../models/Application.js";

export const buildGigParticipants = async (gigId, gig) => {
  const applicantIds = await Application.distinct("worker", { gig: gigId });
  return new Set([
    gig.client.toString(),
    ...gig.assignedWorkers.map((workerId) => workerId.toString()),
    ...applicantIds.map((workerId) => workerId.toString()),
  ]);
};

export const canAccessGigChat = async (gigId, userId, role) => {
  const gig = await Gig.findById(gigId);
  if (!gig) {
    return { ok: false, status: 404, message: "Gig not found" };
  }

  if (role === "admin") {
    return { ok: true, gig, participants: new Set() };
  }

  const participants = await buildGigParticipants(gigId, gig);
  if (!participants.has(userId)) {
    return { ok: false, status: 403, message: "Unauthorized chat access" };
  }

  return { ok: true, gig, participants };
};