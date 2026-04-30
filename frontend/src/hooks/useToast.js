import { useDispatch } from "react-redux";
import { addToast } from "../features/ui/uiSlice";

const useToast = () => {
  const dispatch = useDispatch();

  const showToast = ({
    type = "info",
    title = "Thông báo",
    message = "",
    duration = 5000,
    action,
  }) => {
    dispatch(
      addToast({
        type,
        title,
        message,
        duration,
        action,
      })
    );
  };

  return showToast;
};

export default useToast;
