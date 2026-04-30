import mongoose from "mongoose";
import slugify from "slugify";
import Instructor from "../../models/instructor/instructor.model.js";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    whatYouWillLearn: {
      type: [String],
      default: [],
    },
    audience: {
      type: [String],
      default: [],
      trim: true,
    },
    requirements: {
      type: [String],
      default: [],
      trim: true,
    },
    description: { type: String, default: "", trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    coverImage: { type: String, default: "" },
    videoURL: { type: String, default: "" },
    price: { type: Number, default: 0 },
    discountPrice: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    duration: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "published"],
      lowercase: true,
      default: "draft",
    },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" },
  },
  { timestamps: true }
);

courseSchema.pre("save", async function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }

  if (this.isNew && this.instructor) {
    await Instructor.updateOne(
      {
        _id: this.instructor,
        "coursesTaught.course": { $ne: this._id },
      },
      {
        $push: {
          coursesTaught: {
            course: this._id,
            assignedAt: new Date(),
            status: this.status === "draft" ? "draft" : "active",
          },
        },
      }
    );
  }

  next();
});

courseSchema.pre("insertMany", function (next, docs) {
  for (const doc of docs) {
    if (doc.title && !doc.slug) {
      doc.slug = slugify(doc.title, { lower: true, strict: true });
    }
  }
  next();
});

courseSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (!update.instructor) return next();

  const course = await this.model.findOne(this.getQuery());

  if (!course) return next();

  const oldInstructor = course.instructor?.toString();
  const newInstructor = update.instructor.toString();

  if (oldInstructor === newInstructor) return next();
  if (oldInstructor) {
    await Instructor.updateOne(
      { _id: oldInstructor },
      {
        $pull: {
          coursesTaught: { course: course._id },
        },
      }
    );
  }

  await Instructor.updateOne(
    {
      _id: newInstructor,
      "coursesTaught.course": { $ne: course._id },
    },
    {
      $push: {
        coursesTaught: {
          course: course._id,
          assignedAt: new Date(),
          status: "active",
        },
      },
    }
  );

  next();
});

courseSchema.post("save", async function (doc) {
  if (!doc.instructor) return;

  const statusMap = {
    draft: "draft",
    published: "active",
  };

  await Instructor.updateOne(
    {
      _id: doc.instructor,
      "coursesTaught.course": doc._id,
    },
    {
      $set: {
        "coursesTaught.$.status": statusMap[doc.status] || "archived",
      },
    }
  );
});

export default mongoose.model("Course", courseSchema);
