import { useDispatch, useSelector } from "react-redux";
import AuthModal from "./AuthModal";
import { closeModal } from "../../features/modal/modalSlice";

const ModalHost = () => {
  const dispatch = useDispatch();

  const authOpen = useSelector((state) => state.modals.modals?.auth);

  if (!authOpen) return null;

  return <AuthModal onClose={() => dispatch(closeModal("auth"))} />;
};

export default ModalHost;
