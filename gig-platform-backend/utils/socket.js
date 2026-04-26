let ioInstance = null;

export const setSocketIO = (io) => {
  ioInstance = io;
};

export const getSocketIO = () => ioInstance;

export const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(eventName, payload);
};

export const emitToGig = (gigId, eventName, payload) => {
  if (!ioInstance || !gigId) return;
  ioInstance.to(`gig:${gigId}`).emit(eventName, payload);
};