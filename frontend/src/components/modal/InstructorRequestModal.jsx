import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import FormField from "../../components/common/FormField";
import { requestUpgradeInstructor } from "../../features/instructorRequest/instructorRequestThunks";
import CommonModal from "./CommonModal";
import { closeModal } from "../../features/modal/modalSlice";

const MODAL_INSTRUCTOR_REQUEST = "INSTRUCTOR_REQUEST";

const InstructorRequestModal = () => {
  const dispatch = useDispatch();

  const isOpen = useSelector((s) => s.modals.modals[MODAL_INSTRUCTOR_REQUEST]);

  const loading = useSelector((s) => s.instructorRequest.loading.request);

  const [message, setMessage] = useState("");

  const handleClose = () => {
    // dispatch action close modal (tuỳ hệ thống của bạn)
    dispatch(closeModal(MODAL_INSTRUCTOR_REQUEST));
  };

  const handleSubmit = async () => {
    const res = await dispatch(requestUpgradeInstructor({ message }));

    if (requestUpgradeInstructor.fulfilled.match(res)) {
      setMessage("");
      handleClose();
    }
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Become Instructor"
      maxWidth="max-w-lg"
    >
      <FormField
        label="Why do you want to become instructor?"
        name="message"
        type="textarea"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your motivation..."
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-primary px-6 py-3 rounded-xl w-full mt-4"
      >
        {loading ? "Sending..." : "Send Request"}
      </button>
    </CommonModal>
  );
};

export default InstructorRequestModal;
