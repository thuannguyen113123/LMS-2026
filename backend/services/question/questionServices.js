import mongoose from "mongoose";
import Question from "../../models/quiz/question.model.js";
import Quiz from "../../models/quiz/quiz.model.js";
import AppError from "../../utils/AppError.js";
import { QUESTION_CODES } from "../../constants/question.codes.js";
import { questionBulkItemSchema } from "../../validators/quiz/question.validator.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import {
  exportQuestionsFile,
  mapQuestionExportData,
} from "./question.export.js";

export const mapQuestion = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id.toString(),

    quiz: doc.quiz
      ? {
          id: doc.quiz._id?.toString?.() || doc.quiz,
          title: doc.quiz.title,
          slug: doc.quiz.slug,
        }
      : null,

    type: doc.type,
    content: doc.content,

    options: Array.isArray(doc.options)
      ? doc.options.map((opt) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          feedback: opt.feedback,
        }))
      : [],

    correctAnswers: doc.correctAnswers || [],

    explanation: doc.explanation,

    difficulty: doc.difficulty,

    tags: doc.tags || [],

    points: doc.points,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
export async function buildQuestionFilter({ query, role, userId, quizSlug }) {
  const filter = {};

  // ===== ROLE =====
  if (role === "instructor") {
    const myQuizzes = await Quiz.find({ createdBy: userId })
      .select("_id")
      .lean();

    const myQuizIds = myQuizzes.map((q) => q._id);

    if (myQuizIds.length === 0) {
      filter._id = null;
      return filter;
    }

    filter.quiz = { $in: myQuizIds };
  }

  // ===== QUIZ FILTER =====
  if (query.quiz && query.quiz !== "All") {
    let quiz = null;

    if (mongoose.Types.ObjectId.isValid(query.quiz)) {
      quiz = await Quiz.findById(query.quiz);
    } else {
      quiz = await Quiz.findOne({ slug: query.quiz });
    }

    if (quiz) filter.quiz = quiz._id;
  }

  // ===== TYPE =====
  if (query.type && query.type !== "All")
    filter.type = Array.isArray(query.type) ? { $in: query.type } : query.type;

  // ===== DIFFICULTY =====
  if (query.difficulty)
    filter.difficulty = Array.isArray(query.difficulty)
      ? { $in: query.difficulty }
      : query.difficulty;

  // ===== TAGS =====
  if (query.tags)
    filter.tags = Array.isArray(query.tags)
      ? { $in: query.tags }
      : { $in: [query.tags] };

  // ===== SEARCH =====
  if (query.search?.trim())
    filter.content = { $regex: query.search.trim(), $options: "i" };

  return filter;
}
export function applyQuestionTypeFilter(filter, type) {
  switch (type) {
    case "new":
      filter.createdAt = {
        $gte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      };
      break;

    case "popular":
      filter.usedCount = { $gte: 10 };
      break;

    case "easy":
      filter.difficulty = "easy";
      break;

    case "hard":
      filter.difficulty = "hard";
      break;
  }

  return filter;
}
export function buildQuestionSort({ sort, type }) {
  if (type === "new") return { createdAt: -1, _id: -1 };
  if (type === "popular") return { usedCount: -1, _id: -1 };

  switch (sort) {
    case "difficulty_asc":
      return { difficulty: 1, _id: 1 };

    case "difficulty_desc":
      return { difficulty: -1, _id: -1 };

    case "latest":
      return { createdAt: -1, _id: -1 };

    default:
      return { _id: 1 };
  }
}

export function mapQuestionByRole(doc, role) {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  const base = {
    id: doc._id.toString(),

    quiz: doc.quiz
      ? {
          id: doc.quiz._id?.toString?.() || doc.quiz,
          title: doc.quiz.title,
          slug: doc.quiz.slug,
        }
      : null,

    type: doc.type,
    content: doc.content,
    difficulty: doc.difficulty,
    tags: doc.tags || [],
    points: doc.points,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  if (role === "student") {
    return {
      ...base,
      options: doc.options?.map((opt) => ({
        text: opt.text,
        feedback: opt.feedback,
      })),
    };
  }

  return {
    ...base,
    options: doc.options?.map((opt) => ({
      text: opt.text,
      isCorrect: opt.isCorrect,
      feedback: opt.feedback,
    })),
    correctAnswers: doc.correctAnswers,
    explanation: doc.explanation,
  };
}
export const validateQuestionExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      QUESTION_CODES.QUESTION_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      QUESTION_CODES.QUESTION_EXPORT_SELECTED_EMPTY,
      "Chưa chọn câu hỏi để export",
      400
    );
  }
};

export const validateQuestionExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      QUESTION_CODES.QUESTION_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};
const QuestionServices = {
  async createQuestion(data, user) {
    try {
      if (!data.content?.trim()) {
        throw new AppError(
          QUESTION_CODES.QUESTION_CREATE_FAILED,
          "Nội dung câu hỏi không hợp lệ",
          400
        );
      }

      if (!data.quiz) {
        throw new AppError(
          QUESTION_CODES.QUESTION_CREATE_FAILED,
          "Quiz là bắt buộc",
          400
        );
      }

      const created = await Question.create({
        ...data,
        createdBy: user?.id || user?._id,
      });

      // ✅ audit log trong service
      await saveAuditLogs({
        entityType: "questions",
        entityId: created._id,
        action: "create",
        oldData: {},
        newData: {
          content: created.content,
          type: created.type,
          difficulty: created.difficulty,
          points: created.points,
        },
        updatedBy: user?.id || user?._id,
      });

      // ✅ trả mapped
      return mapQuestion(created);
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("CreateQuestion service error:", err);

      throw new AppError(
        QUESTION_CODES.QUESTION_CREATE_FAILED,
        "Tạo câu hỏi thất bại",
        500
      );
    }
  },

  async bulkCreateQuestions(inputList = [], updatedBy) {
    if (!Array.isArray(inputList) || inputList.length === 0) {
      throw new AppError(
        QUESTION_CODES.QUESTION_BULK_INVALID_PAYLOAD,
        "Danh sách question không hợp lệ"
      );
    }

    const validItems = [];
    const errors = [];

    // 1️⃣ Validate từng dòng
    inputList.forEach((item, index) => {
      const { error, value } = questionBulkItemSchema.validate(item, {
        abortEarly: false,
      });

      if (error) {
        errors.push({
          index,
          code: QUESTION_CODES.QUESTION_BULK_VALIDATION_FAILED,
          content: item?.content || null,
          reason: error.details.map((d) => d.message),
        });
      } else {
        validItems.push(value);
      }
    });

    // 2️⃣ Duplicate content trong file
    const seen = new Set();
    const uniqueValid = [];

    validItems.forEach((item) => {
      const key = item.content.toLowerCase();

      if (seen.has(key)) {
        errors.push({
          code: QUESTION_CODES.QUESTION_DUPLICATE_IN_FILE,
          content: item.content,
          reason: ["Trùng content trong file import"],
        });
      } else {
        seen.add(key);
        uniqueValid.push(item);
      }
    });

    // 3️⃣ Map quizTitle → quizId (FK theo name chuẩn)
    const quizTitles = [
      ...new Set(uniqueValid.map((i) => i.quizTitle.toLowerCase())),
    ];

    const quizzes = await Quiz.find({
      title: {
        $in: quizTitles.map((t) => new RegExp(`^${t}$`, "i")),
      },
    })
      .select("_id title")
      .lean();

    const quizMap = new Map(quizzes.map((q) => [q.title.toLowerCase(), q._id]));

    const mappedItems = [];

    uniqueValid.forEach((item, index) => {
      const quizId = quizMap.get(item.quizTitle.toLowerCase());

      if (!quizId) {
        errors.push({
          index,
          code: QUESTION_CODES.QUESTION_QUIZ_NOT_FOUND,
          content: item.content,
          reason: [`Quiz "${item.quizTitle}" không tồn tại`],
        });
        return;
      }

      mappedItems.push({
        quiz: quizId,
        type: item.type,
        content: item.content,
        options: item.options || [],
        correctAnswers: item.correctAnswers || [],
        explanation: item.explanation,
        difficulty: item.difficulty || "medium",
        tags: item.tags || [],
        points: item.points || 1,
        createdBy: updatedBy,
        updatedBy,
      });
    });

    // 4️⃣ Check trùng DB (content + quiz)
    const existing = await Question.find({
      $or: mappedItems.map((i) => ({
        content: i.content,
        quiz: i.quiz,
      })),
    })
      .select("content quiz")
      .lean();

    const existSet = new Set(existing.map((e) => `${e.content}_${e.quiz}`));

    const toCreate = [];
    const skipped = [];

    mappedItems.forEach((item) => {
      const key = `${item.content}_${item.quiz}`;

      if (existSet.has(key)) {
        skipped.push({
          code: QUESTION_CODES.QUESTION_EXISTS,
          content: item.content,
        });
      } else {
        toCreate.push(item);
      }
    });

    if (toCreate.length === 0) {
      return {
        created: [],
        skipped,
        errors,
        summary: {
          total: inputList.length,
          created: 0,
          skipped: skipped.length,
          failed: errors.length,
        },
      };
    }

    const createdDocs = await Question.insertMany(toCreate, {
      ordered: false,
    });

    // 5️⃣ Push question vào quiz.questions
    await Promise.all(
      createdDocs.map((q) =>
        Quiz.findByIdAndUpdate(q.quiz, {
          $push: { questions: q._id },
        })
      )
    );

    // 6️⃣ Audit log
    await Promise.all(
      createdDocs.map((q) =>
        saveAuditLogs({
          entityType: "questions",
          entityId: q._id,
          oldData: {},
          newData: mapQuestion(q),
          updatedBy,
        })
      )
    );

    return {
      created: createdDocs.map(mapQuestion),
      skipped,
      errors,
      summary: {
        total: inputList.length,
        created: createdDocs.length,
        skipped: skipped.length,
        failed: errors.length,
      },
    };
  },

  async listAdminQuestionsUseCase({ query, role, userId, quizSlug }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const skip = (page - 1) * limit;

    let filter = await buildQuestionFilter({
      query,
      role,
      userId,
      quizSlug,
    });

    const sort = buildQuestionSort({
      sort: query.sort,
      type: query.type,
    });

    const [docs, total] = await Promise.all([
      Question.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("quiz", "title slug")
        .lean(),

      Question.countDocuments(filter),
    ]);

    const data = docs.map((doc) => mapQuestionByRole(doc, role));

    return {
      data,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },
  async listPublicQuestionsUseCase({ query, quizSlug }) {
    const limit = Number(query.limit) || 10;
    const cursor = query.cursor;

    let filter = await buildQuestionFilter({
      query,
      role: "student",
      userId: null,
      quizSlug,
    });

    const sort = buildQuestionSort({
      sort: query.sort,
      type: query.type,
    });

    if (cursor) {
      const cursorDoc = await Question.findById(cursor).select("_id createdAt");

      if (cursorDoc) {
        filter.$or = [
          {
            createdAt: { $lt: cursorDoc.createdAt },
          },
          {
            createdAt: cursorDoc.createdAt,
            _id: { $lt: cursor },
          },
        ];
      }
    }

    const docs = await Question.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("quiz", "title slug")
      .lean();

    const hasNext = docs.length > limit;

    if (hasNext) docs.pop();

    const data = docs.map((doc) => mapQuestion(doc));

    return {
      data,

      pagination: {
        nextCursor: hasNext ? data[data.length - 1].id : null,
        hasNext,
      },
    };
  },

  async getByQuizUseCase({ quizId, role, userId }) {
    const filter = { quiz: quizId };

    // ===== ROLE SECURITY =====
    if (role === "instructor") {
      const quiz = await Quiz.findOne({
        _id: quizId,
        createdBy: userId,
      }).lean();

      if (!quiz) return { data: [], total: 0 };
    }

    if (role === "student") {
      const quiz = await Quiz.findOne({
        _id: quizId,
        isPublished: true,
      }).lean();

      if (!quiz) return { data: [], total: 0 };
    }

    const docs = await Question.find(filter)
      .sort({ createdAt: 1 })
      .populate("quiz", "title slug")
      .lean();

    const mapped = docs.map((doc) => mapQuestionByRole(doc, role));

    return {
      data: mapped,
      total: mapped.length,
    };
  },

  async getDetail(id) {
    return await Question.findById(id).populate("quiz", "title slug type");
  },

  async updateQuestionUseCase({ id, data, user }) {
    const oldDoc = await Question.findById(id).populate("quiz", "title slug");

    if (!oldDoc) {
      throw new AppError(
        QUESTION_CODES.QUESTION_NOT_FOUND,
        "Không tìm thấy câu hỏi",
        404
      );
    }

    const oldData = mapQuestion(oldDoc);

    // normalize quiz
    if (data.quiz && typeof data.quiz === "object") {
      data.quiz = data.quiz.id;
    }

    const updatedDoc = await Question.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("quiz", "title slug");

    const newData = mapQuestion(updatedDoc);

    await saveAuditLogs({
      entityType: "questions",
      entityId: id,
      action: "update",
      oldData,
      newData,
      updatedBy: user?.id || user?._id,
    });

    return newData;
  },

  async deleteQuestion(id) {
    return await Question.findByIdAndDelete(id);
  },

  async removeManyQuestions(ids = [], actor) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        QUESTION_CODES.QUESTION_MANY_DELETE_FAILED,
        "Không có câu hỏi để xóa",
        400
      );
    }

    // lấy data cũ
    const questions = await Question.find({
      _id: { $in: ids },
    }).populate("quiz", "title slug");

    if (questions.length !== ids.length) {
      const foundIds = questions.map((q) => q._id.toString());

      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      throw new AppError(
        QUESTION_CODES.QUESTION_NOT_FOUND,
        `Không tìm thấy: ${notFoundIds.join(", ")}`,
        404
      );
    }

    const mappedOld = questions.map(mapQuestion);

    // delete
    await Question.deleteMany({
      _id: { $in: ids },
    });

    // audit log
    await Promise.all(
      questions.map((q, index) =>
        saveAuditLogs({
          entityType: "questions",
          entityId: q._id,
          action: "delete",
          oldData: mappedOld[index],
          newData: {},
          updatedBy: actor?.id || actor?._id,
        })
      )
    );

    return {
      deletedIds: ids,
      deletedCount: ids.length,
    };
  },
  async getQuestionsForExport({ scope, selectedIds, filters }) {
    const query = {};

    if (filters?.search) {
      query.content = { $regex: filters.search, $options: "i" };
    }

    if (filters?.quiz && mongoose.Types.ObjectId.isValid(filters.quiz)) {
      query.quiz = filters.quiz;
    }

    if (Array.isArray(filters?.difficulty) && filters.difficulty.length > 0) {
      query.difficulty = { $in: filters.difficulty };
    }

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    return Question.find(query)
      .populate("quiz", "title")
      .populate("createdBy", "fullname")
      .sort({ createdAt: -1 })
      .lean();
  },
  async previewExportQuestions({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validateQuestionExportScope({ scope, selectedIds });

    const questions = await this.getQuestionsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!questions.length) {
      throw new AppError(
        QUESTION_CODES.QUESTION_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    const mapped = mapQuestionExportData(questions);

    return {
      total: mapped.length,
      columns: Object.keys(mapped[0]),
      preview: mapped.slice(0, 10),
    };
  },
  async exportQuestions({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateQuestionExportScope({ scope, selectedIds });
    validateQuestionExportFormat(format);

    const questions = await this.getQuestionsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!questions.length) {
      throw new AppError(
        QUESTION_CODES.QUESTION_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportQuestionsFile({
      questions,
      format,
    });

    await saveAuditLogs({
      entityType: "questions",
      action: "export",
      entityId: null,
      oldData: {},
      newData: { count: questions.length, format },
      updatedBy: user?.id || user?._id,
    });

    return {
      buffer,
      fileName: `questions_${Date.now()}.${
        format === "excel" ? "xlsx" : "pdf"
      }`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },
};

export default QuestionServices;
