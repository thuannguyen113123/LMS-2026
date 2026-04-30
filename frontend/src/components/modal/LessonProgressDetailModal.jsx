import React from "react";
import CommonModal from "../modal/CommonModal";
import { DataLoading, DataEmpty } from "../common/DataStates";

const LessonProgressDetailModal = ({ isOpen, onClose, detail, loading }) => {
  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết tiến độ học"
      maxWidth="max-w-3xl"
    >
      {loading ? (
        <DataLoading message="Đang tải tiến độ..." />
      ) : !detail ? (
        <DataEmpty message="Không có dữ liệu" />
      ) : (
        <div className="space-y-4">
          <div className="border rounded p-4">
            <p>
              <b>Student:</b> {detail.student?.name}
            </p>

            <p>
              <b>Course:</b> {detail.course?.title}
            </p>

            <p>
              <b>Progress:</b> {detail.progress?.percent}%
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Lessons</h3>

            <div className="space-y-2">
              {detail.lessons?.map((l) => (
                <div
                  key={l.id}
                  className="flex justify-between border p-2 rounded"
                >
                  <span>{l.title}</span>
                  <span className="text-sm text-gray-500">{l.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </CommonModal>
  );
};

export default LessonProgressDetailModal;
