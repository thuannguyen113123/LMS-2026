import React from "react";
import { useDispatch, useSelector } from "react-redux";
import VideoCarousel from "../lmsIntro/VideoCarousel";
import CommonModal from "./CommonModal";
import { closeModal } from "../../features/modal/modalSlice";

export const MODAL_DEMO = "MODAL_DEMO";

const DemoVideoModal = () => {
  const dispatch = useDispatch();

  const isOpen = useSelector((state) => state.modals.modals[MODAL_DEMO]);

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal(MODAL_DEMO))}
      maxWidth="max-w-6xl"
      maxHeight="max-h-[90vh]"
    >
      <VideoCarousel externalPlay={isOpen} />
    </CommonModal>
  );
};

export default DemoVideoModal;
