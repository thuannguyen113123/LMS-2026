import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { showCertificateCelebration } from "../../../features/certificate/certificateSlice";
import Toast from "../../../components/toast/Toast";
import { useSocketContext } from "../../../context/chatSocket.context";

export const useCertificateSocket = (user) => {
  const { socket } = useSocketContext();
  const dispatch = useDispatch();
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleCertificateIssued = (certificate) => {
      dispatch(showCertificateCelebration([certificate]));

      Toast.success("🎉 Bạn đã nhận được chứng chỉ mới!");
    };

    const register = () => {
      socket.off("certificate:issued", handleCertificateIssued);
      socket.on("certificate:issued", handleCertificateIssued);
    };

    if (socket.connected) {
      register();
    }

    socket.on("connect", register);

    return () => {
      socket.off("connect", register);
      socket.off("certificate:issued", handleCertificateIssued);
    };
  }, [socket, user?.id, dispatch]);
};
