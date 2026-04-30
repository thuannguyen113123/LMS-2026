const readyUsers = new Set();

export const ReadyStore = {
  add(userId) {
    readyUsers.add(userId.toString());
  },

  remove(userId) {
    readyUsers.delete(userId.toString());
  },

  isReady(userId) {
    return readyUsers.has(userId.toString());
  },
};
