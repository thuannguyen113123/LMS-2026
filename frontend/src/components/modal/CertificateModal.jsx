import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode } from "swiper/modules";
import CertificateCard from "../Card/CertificateCard";
import { selectMyCertificates } from "../../features/certificate/certificateSlice";
import { fetchMyCertificates } from "../../features/certificate/certificateThunks";
import { closeModal } from "../../features/modal/modalSlice";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import { useCertificatePrint } from "../certificate/useCertificatePrint";
import CertificatePrint from "../certificate/CertificatePrint";

export const MODAL_CERTIFICATES_OPTION = "MODAL_CERTIFICATES_OPTION";

const CertificateModal = () => {
  const dispatch = useDispatch();
  const { ref, print } = useCertificatePrint();

  const [activeIndex, setActiveIndex] = useState(0);

  const isOpen = useSelector((s) => s.modals.modals[MODAL_CERTIFICATES_OPTION]);
  const user = useSelector((s) => s.auth.user);
  const certificates = useSelector(selectMyCertificates);
  useEffect(() => {
    if (!isOpen || !user?.id) return;
    dispatch(fetchMyCertificates());
  }, [isOpen, user?.id, dispatch]);
  if (!isOpen) return null;
  const handleClose = () => dispatch(closeModal(MODAL_CERTIFICATES_OPTION));

  const activeCert = certificates?.[activeIndex];

  return (
    <div className="fixed inset-0 z-999 flex flex-col bg-black/60 backdrop-blur-md">
      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-5 text-white">
        <button
          onClick={print}
          disabled={!activeCert}
          className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition disabled:opacity-50"
        >
          Print Certificate
        </button>

        <h2 className="text-xl font-semibold">My Certificates</h2>

        <button
          onClick={handleClose}
          className="text-2xl hover:scale-110 transition"
        >
          ✕
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {!certificates?.length ? (
          <p className="text-white/70">No certificates yet.</p>
        ) : (
          <Swiper
            modules={[Navigation, FreeMode]}
            navigation
            freeMode
            slidesPerView="auto"
            centeredSlides
            spaceBetween={40}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            className="w-full h-full"
          >
            {certificates.map((cert) => (
              <SwiperSlide key={cert.id} className="w-275 flex justify-center">
                <CertificateCard data={cert} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>

      {/* PRINT (hidden) */}
      <div className="hidden">
        {activeCert && <CertificatePrint ref={ref} data={activeCert} />}
      </div>
    </div>
  );
};

export default CertificateModal;
