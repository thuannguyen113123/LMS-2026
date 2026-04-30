import mongoose from "mongoose";

const userPresenceSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: "User", unique: true },
  status: {
    type: String,
    enum: ["online", "busy", "offline", "teaching"],
    default: "offline",
  },
  lastActiveAt: Date,
});
export default mongoose.model("userPresence", userPresenceSchema);
