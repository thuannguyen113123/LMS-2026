import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../features/modal/modalSlice";
import RoleSelection from "../auth/RoleSelection";
import CommonModal from "./CommonModal";

export const MODAL_ROLE = "MODAL_ROLE";

const RoleModal = () => {
  const dispatch = useDispatch();

  const isOpen = useSelector((state) => state.modals.modals[MODAL_ROLE]);

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal(MODAL_ROLE))}
      maxWidth="max-w-2xl"
      maxHeight="max-h-[90vh]"
    >
      <RoleSelection />
    </CommonModal>
  );
};

export default RoleModal;
