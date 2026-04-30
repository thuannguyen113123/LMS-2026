import { SEARCH_CODES } from "../../constants/search.codes.js";
import Course from "../../models/courses/Course.js";
import AppError from "../../utils/AppError.js";

const normalizeSearchQuery = (q) => {
  if (!q) return null;

  return q
    .trim()
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const mapCourse = (doc) => {
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    thumbnail: doc.coverImage,
    price: doc.isFree ? 0 : doc.discountPrice || doc.price,
    rating: doc.rating || 0,
    enrollCount: doc.enrollCount || 0,
    instructor: doc.instructor
      ? {
          id: doc.instructor._id.toString(),
          slug: doc.instructor.slug,
        }
      : null,
    category: doc.category
      ? {
          id: doc.category._id.toString(),
          name: doc.category.name,
          slug: doc.category.slug,
        }
      : null,
  };
};

export const searchCourses = async ({ q, limit = 10, page = 1 }) => {
  try {
    const normalizedQ = normalizeSearchQuery(q);
    if (normalizedQ && normalizedQ.length < 2) {
      return {
        courses: [],
        pagination: {
          page,
          limit,
          hasMore: false,
        },
      };
    }
    const skip = (page - 1) * limit;
    const regex = normalizedQ ? new RegExp(normalizedQ, "i") : null;

    const pipeline = [
      {
        $match: {
          status: "published",
        },
      },

      {
        $lookup: {
          from: "instructors",
          localField: "instructor",
          foreignField: "_id",
          as: "instructor",
        },
      },
      {
        $unwind: {
          path: "$instructor",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "orders",
          let: { courseId: "$_id" },
          pipeline: [
            { $unwind: "$items" },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$items.itemId", "$$courseId"] },
                    { $eq: ["$items.itemType", "course"] },
                    { $eq: ["$status", "paid"] },
                  ],
                },
              },
            },
          ],
          as: "orders",
        },
      },
      {
        $addFields: {
          enrollCount: { $size: "$orders" },
        },
      },
    ];

    if (regex) {
      pipeline.push(
        {
          $addFields: {
            matchScore: {
              $add: [
                {
                  $cond: [{ $regexMatch: { input: "$title", regex } }, 5, 0],
                },
                {
                  $cond: [
                    { $regexMatch: { input: "$description", regex } },
                    2,
                    0,
                  ],
                },
                {
                  $cond: [
                    { $regexMatch: { input: "$category.name", regex } },
                    2,
                    0,
                  ],
                },
                {
                  $cond: [
                    { $regexMatch: { input: "$instructor.slug", regex } },
                    2,
                    0,
                  ],
                },
              ],
            },
          },
        },

        {
          $match: {
            matchScore: { $gt: 0 },
          },
        },

        {
          $addFields: {
            score: {
              $add: [
                "$matchScore",
                { $multiply: ["$enrollCount", 0.02] },
                { $multiply: ["$rating", 0.5] },
              ],
            },
          },
        },
        {
          $sort: {
            score: -1,
            enrollCount: -1,
            rating: -1,
            createdAt: -1,
          },
        }
      );
    } else {
      pipeline.push({
        $sort: {
          enrollCount: -1,
          rating: -1,
          createdAt: -1,
        },
      });
    }

    pipeline.push({ $skip: skip }, { $limit: limit + 1 });

    const docs = await Course.aggregate(pipeline);

    const hasMore = docs.length > limit;

    if (hasMore) {
      docs.pop();
    }
    return {
      courses: docs.map(mapCourse),
      pagination: {
        page,
        limit,
        hasMore,
      },
    };
  } catch (err) {
    console.error(err);

    throw new AppError(
      SEARCH_CODES.SEARCH_FAILED,
      "Tìm kiếm khóa học thất bại",
      500
    );
  }
};
