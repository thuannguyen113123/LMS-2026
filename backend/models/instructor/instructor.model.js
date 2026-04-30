import mongoose from "mongoose";
import slugify from "slugify";

const instructorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    slug: { type: String, unique: true, index: true },
    bio: { type: String, default: "" },
    expertise: [{ type: String }],
    socialLinks: {
      website: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      youtube: { type: String, default: "" },
      github: { type: String, default: "" },
    },
    coursesTaught: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        assignedAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ["active", "draft", "archived"],
          default: "active",
        },
      },
    ],
    totalStudents: { type: Number, default: 0 },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

instructorSchema.pre("save", async function (next) {
  if (!this.isModified("user")) return next();

  const User = mongoose.model("User");
  const user = await User.findById(this.user);
  if (!user) return next(new Error("User not found for Instructor"));

  this.slug = slugify(user.fullname, { lower: true, strict: true });
  next();
});

instructorSchema.pre("insertMany", async function (next, docs) {
  const User = mongoose.model("User");
  for (const doc of docs) {
    const user = await User.findById(doc.user);
    if (user) {
      doc.slug = slugify(user.fullname, { lower: true, strict: true });
    }
  }
  next();
});

export default mongoose.model("Instructor", instructorSchema);
