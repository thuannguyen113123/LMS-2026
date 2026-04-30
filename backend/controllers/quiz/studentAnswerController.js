import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import StudentAnswer from "../../models/quiz/StudentAnswer.model.js";
import Question from "../../models/quiz/question.model.js";

const mapDoc = (doc) => {
  if (doc?.toObject) doc = doc.toObject();
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

const getUserIdentifier = (user) =>
  user?.email || user?.phone || user?._id || "unknown";

export const studentAnswerController = {
  async create(req, res) {
    try {
      const data = req.body;

      if (!data.student || !data.question || !data.selectedOptions) {
        return res
          .status(400)
          .json({ error: "Thiếu student / question / chọn đáp án" });
      }

      const question = await Question.findById(data.question);
      if (!question)
        return res.status(404).json({ error: "Câu hỏi không tồn tại" });

      let isCorrect = false;
      if (question.type !== "short_answer" && question.type !== "coding") {
        isCorrect =
          JSON.stringify(data.selectedOptions.sort()) ===
          JSON.stringify(question.correctAnswers.sort());
      }

      const docRaw = await StudentAnswer.create({
        ...data,
        isCorrect,
        submittedAt: new Date(),
        autoGraded: true,
      });

      const answer = mapDoc(docRaw);

      await saveAuditLogs({
        entityType: "student_answers",
        entityId: answer.id,
        oldData: {},
        newData: answer,
        updatedBy: getUserIdentifier(req.user),
      });

      return res.status(201).json({ success: true, answer });
    } catch (err) {
      console.error("Create student answer error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },

  async createMany(req, res) {
    try {
      const list = req.body;
      if (!Array.isArray(list) || list.length === 0)
        return res.status(400).json({ error: "Danh sách rỗng" });

      const created = await Promise.all(
        list.map(async (item) => {
          const q = await Question.findById(item.question);
          if (!q) throw new Error("Câu hỏi không tồn tại");

          const isCorrect =
            q.type !== "short_answer" && q.type !== "coding"
              ? JSON.stringify(item.selectedOptions.sort()) ===
                JSON.stringify(q.correctAnswers.sort())
              : false;

          return await StudentAnswer.create({
            ...item,
            isCorrect,
            submittedAt: new Date(),
            autoGraded: true,
          });
        })
      );

      const answers = created.map(mapDoc);

      await Promise.all(
        answers.map((a) =>
          saveAuditLogs({
            entityType: "student_answers",
            entityId: a.id,
            oldData: {},
            newData: a,
            updatedBy: getUserIdentifier(req.user),
          })
        )
      );

      return res.status(201).json({ success: true, answers });
    } catch (err) {
      console.error("Create many student answers error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },

  async list(req, res) {
    try {
      const { student, quiz, question } = req.query;
      const filter = {};

      if (student) filter.student = student;
      if (quiz) filter.quiz = quiz;
      if (question) filter.question = question;

      const docs = await StudentAnswer.find(filter)
        .populate("student", "fullname avatar")
        .populate("question", "content type")
        .lean();

      return res.json({ success: true, answers: docs });
    } catch (err) {
      console.error("List student answers error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },

  async detail(req, res) {
    try {
      const { id } = req.params;
      const doc = await StudentAnswer.findById(id)
        .populate("student", "fullname avatar")
        .populate("question", "content type")
        .lean();

      if (!doc)
        return res.status(404).json({ error: "Không tìm thấy câu trả lời" });

      return res.json({ success: true, answer: doc });
    } catch (err) {
      console.error("Detail student answer error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const input = req.body;

      const oldRaw = await StudentAnswer.findById(id);
      if (!oldRaw)
        return res.status(404).json({ error: "Không tồn tại answer" });

      const oldData = mapDoc(oldRaw);

      const updatedRaw = await StudentAnswer.findByIdAndUpdate(id, input, {
        new: true,
      });
      const updated = mapDoc(updatedRaw);

      await saveAuditLogs({
        entityType: "student_answers",
        entityId: id,
        oldData,
        newData: updated,
        updatedBy: getUserIdentifier(req.user),
      });

      return res.json({ success: true, answer: updated });
    } catch (err) {
      console.error("Update student answer error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;

      const oldRaw = await StudentAnswer.findById(id);
      if (!oldRaw)
        return res.status(404).json({ error: "Không tồn tại answer" });
      const oldData = mapDoc(oldRaw);

      await StudentAnswer.findByIdAndDelete(id);

      await saveAuditLogs({
        entityType: "student_answers",
        entityId: id,
        oldData,
        newData: {},
        updatedBy: getUserIdentifier(req.user),
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("Delete student answer error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },

  async removeMany(req, res) {
    try {
      const { ids } = req.body;
      if (!ids?.length)
        return res.status(400).json({ error: "Danh sách xóa rỗng" });

      const oldListRaw = await Promise.all(
        ids.map((id) => StudentAnswer.findById(id))
      );
      const notFound = ids.filter((_, i) => !oldListRaw[i]);
      if (notFound.length)
        return res.status(404).json({
          error: `Không tồn tại: ${notFound.join(", ")}`,
        });

      const oldList = oldListRaw.map(mapDoc);

      await StudentAnswer.deleteMany({ _id: { $in: ids } });

      await Promise.all(
        oldList.map((oldData, i) =>
          saveAuditLogs({
            entityType: "student_answers",
            entityId: ids[i],
            oldData,
            newData: {},
            updatedBy: getUserIdentifier(req.user),
          })
        )
      );

      return res.json({ success: true });
    } catch (err) {
      console.error("Delete many student answers error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },
};
