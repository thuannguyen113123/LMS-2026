const onlineUsers = new Map();

export const PresenceStore = {
  add(userId, socketId) {
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId).add(socketId);
  },

  remove(userId, socketId) {
    const sockets = onlineUsers.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);

    if (sockets.size === 0) {
      onlineUsers.delete(userId);
    }
  },

  isOnline(userId) {
    return onlineUsers.has(userId);
  },

  getAllOnline() {
    return [...onlineUsers.keys()];
  },
};
