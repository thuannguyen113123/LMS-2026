import mongoose from "mongoose";
import slugify from "slugify";

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    enrolledCourses: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        enrolledAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        lastAccessed: { type: Date, default: null },
      },
    ],
    bookmarks: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    certificates: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },

        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true,
          index: true,
        },

        certificateNumber: {
          type: String,
          required: true,
        },

        certificateUrl: { type: String, default: "" },

        status: {
          type: String,
          enum: ["pending", "issued", "revoked", "expired"],
          default: "pending",
          index: true,
        },

        issuedAt: { type: Date, default: null },

        issuedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Instructor",
          default: null,
        },
      },
    ],
    instructorRatings: [
      {
        instructor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Instructor",
          required: true,
          index: true,
        },

        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);
async function generateStudentSlug(userId) {
  const User = mongoose.model("User");
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found for Student");

  const baseSlug = slugify(user.fullname, {
    lower: true,
    strict: true,
  });

  const shortId = userId.toString().slice(-4);

  return `${baseSlug}-${shortId}`;
}

// ✅ Pre-save (create / update user)
studentSchema.pre("save", async function (next) {
  if (this.slug) return next();

  try {
    this.slug = await generateStudentSlug(this.user);
    next();
  } catch (err) {
    next(err);
  }
});

// ✅ Pre-insertMany (batch insert – vẫn an toàn)
studentSchema.pre("insertMany", async function (next, docs) {
  try {
    for (const doc of docs) {
      if (!doc.slug && doc.user) {
        doc.slug = await generateStudentSlug(doc.user);
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});
// user unique
studentSchema.index({ user: 1 }, { unique: true });

// certificate queries
studentSchema.index({
  _id: 1,
  "certificates.course": 1,
});

studentSchema.index({
  "certificates.course": 1,
  "certificates.status": 1,
});

studentSchema.index({
  "certificates.issuedAt": -1,
});
studentSchema.index({
  "instructorRatings.instructor": 1,
});

studentSchema.index({
  _id: 1,
  "certificates.status": 1,
  "certificates.issuedAt": -1,
});

export default mongoose.model("Student", studentSchema);
