import { useDispatch, useSelector } from "react-redux";
import { closeModal, openModal } from "../features/modal/modalSlice";

const useModal = (key) => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.modals.modals[key]);
  const data = useSelector((state) => state.modals.modalData[key]);

  const open = (data) => dispatch(openModal({ key, data }));
  const close = () => dispatch(closeModal(key));

  return { isOpen, data, open, close };
};

export default useModal;
