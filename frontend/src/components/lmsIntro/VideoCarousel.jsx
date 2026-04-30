import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { hightlightsSlides } from "../../constants/highlightsSlides";
import { FaPlay, FaPause, FaRedo } from "react-icons/fa";

gsap.registerPlugin(ScrollTrigger);

const VideoCarousel = ({ externalPlay }) => {
  const videoRef = useRef([]);
  const progressRef = useRef([]);
  const progressSpanRef = useRef([]);

  const [video, setVideo] = useState({
    videoId: 0,
    startPlay: false,
    isPlaying: false,
    isEnd: false,
    isLastVideo: false,
  });

  // loadedData dùng boolean array chuẩn production
  const [loadedData, setLoadedData] = useState(
    new Array(hightlightsSlides.length).fill(false)
  );

  const { videoId, startPlay, isPlaying, isEnd, isLastVideo } = video;

  useGSAP(() => {
    gsap.to(".slider-wrapper", {
      xPercent: -100 * videoId,
      duration: 1,
      ease: "power2.inOut",
    });
  }, [videoId]);

  useEffect(() => {
    const firstVideo = videoRef.current[0];

    if (!firstVideo) return;

    const trigger = ScrollTrigger.create({
      trigger: firstVideo,
      start: "top center",

      onEnter: () => {
        setVideo((prev) => ({
          ...prev,
          startPlay: true,
          isPlaying: true,
        }));
      },
    });

    return () => trigger.kill();
  }, []);

  useEffect(() => {
    const currentVideo = videoRef.current[videoId];

    // ensure video exists and metadata loaded
    if (!currentVideo || !loadedData[videoId]) return;

    if (isPlaying && startPlay) {
      currentVideo.play().catch(() => {});
    } else {
      currentVideo.pause();
    }
  }, [videoId, isPlaying, startPlay, loadedData]);

  useEffect(() => {
    const span = progressSpanRef.current[videoId];
    const container = progressRef.current[videoId];
    const currentVideo = videoRef.current[videoId];

    if (!span || !container || !currentVideo || !loadedData[videoId]) return;

    let anim;
    let ticker;

    gsap.set(span, { width: "0%" });

    anim = gsap.to(span, {
      width: "100%",
      ease: "none",
      duration: currentVideo.duration || 1,
      paused: true,

      onComplete: () => {
        container.classList.remove("bg-white");
        container.classList.add("bg-gray-500");

        setVideo((prev) => ({
          ...prev,
          isEnd: true,
          isPlaying: false,
        }));
      },
    });

    ticker = () => {
      const vid = videoRef.current[videoId];

      if (!vid || !vid.duration) return;

      const progress = vid.currentTime / vid.duration;

      anim.progress(progress);
    };

    if (isPlaying) {
      gsap.ticker.add(ticker);
    }

    return () => {
      gsap.ticker.remove(ticker);
      anim.kill();
    };
  }, [videoId, isPlaying, loadedData]);

  useEffect(() => {
    if (!isEnd) return;

    if (videoId < hightlightsSlides.length - 1) {
      setVideo((prev) => ({
        ...prev,
        videoId: prev.videoId + 1,
        isEnd: false,
        isPlaying: true,
      }));
    } else {
      setVideo((prev) => ({
        ...prev,
        isLastVideo: true,
      }));
    }
  }, [isEnd, videoId]);

  const handleLoadedMetadata = (index) => {
    setLoadedData((prev) => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
  };

  const handleControl = () => {
    if (isLastVideo) {
      // replay from beginning
      setVideo({
        videoId: 0,
        startPlay: true,
        isPlaying: true,
        isEnd: false,
        isLastVideo: false,
      });

      // reset progress UI
      progressSpanRef.current.forEach((span) => {
        if (span) gsap.set(span, { width: "0%" });
      });

      progressRef.current.forEach((bar) => {
        if (bar) {
          bar.classList.remove("bg-white");
          bar.classList.add("bg-gray-500");
        }
      });

      return;
    }

    // toggle play pause
    setVideo((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  };
  // useEffect(() => {
  //   if (externalPlay) {
  //     setVideo((prev) => ({
  //       ...prev,
  //       startPlay: true,
  //       isPlaying: true,
  //     }));
  //   }
  // }, [externalPlay]);

  useEffect(() => {
    if (!externalPlay) {
      setVideo({
        videoId: 0,
        startPlay: false,
        isPlaying: false,
        isEnd: false,
        isLastVideo: false,
      });
      return;
    }

    setVideo((prev) => ({
      ...prev,
      startPlay: true,
      isPlaying: true,
    }));
  }, [externalPlay]);
  return (
    <>
      {/* SLIDER */}
      <div className="overflow-hidden flex justify-center py-24 max-w-[700px] mx-auto">
        <div className="flex slider-wrapper items-center">
          {hightlightsSlides.map((list, i) => (
            <div key={list.id} className="min-w-full flex justify-center px-6">
              {/* LANDSCAPE DEVICE */}
              <div className="relative w-[640px] sm:w-[820px] md:w-[980px] lg:w-[1100px] xl:w-[640px] aspect-video bg-card border border-border rounded-[44px] shadow-[0_50px_150px_rgba(0,0,0,0.55)] group">
                {/* INNER SCREEN */}
                <div className="relative w-full h-full rounded-[36px] overflow-hidden bg-primary-soft p-2">
                  {/* CAMERA DOT */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-border z-30" />

                  {/* VIDEO */}
                  <video
                    ref={(el) => (videoRef.current[i] = el)}
                    muted
                    playsInline
                    preload="auto"
                    onLoadedMetadata={() => handleLoadedMetadata(i)}
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    <source src={list.video} type="video/mp4" />
                  </video>

                  {/* GLASS REFLECTION */}
                  <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

                  {/* BOTTOM GRADIENT */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

                  {/* TEXT */}
                  <div className="absolute bottom-8 left-10 right-10 z-20">
                    {list.textLists.map((text, index) => (
                      <p
                        key={index}
                        className="text-primary text-2xl font-medium"
                      >
                        {text}
                      </p>
                    ))}
                  </div>

                  {/* CONTROL BUTTON */}
                  {videoId === i && (
                    <button
                      onClick={handleControl}
                      className="absolute bottom-8 right-8 w-16 h-16 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-xl border border-border hover:scale-110 active:scale-95 transition-all duration-300 z-30"
                    >
                      {isLastVideo ? (
                        <FaRedo className="text-primary text-2xl" />
                      ) : isPlaying ? (
                        <FaPause className="text-primary text-2xl" />
                      ) : (
                        <FaPlay className="text-primary text-2xl ml-1" />
                      )}
                    </button>
                  )}
                </div>

                {/* SIDE SPEAKERS */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[5px] h-[60px] bg-border rounded-full" />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[5px] h-[60px] bg-border rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PROGRESS */}
      <div className="flex justify-center mt-16">
        <div className="flex gap-4">
          {hightlightsSlides.map((_, i) => (
            <div
              key={i}
              ref={(el) => (progressRef.current[i] = el)}
              className="w-28 h-1 bg-primary-soft rounded-full overflow-hidden"
            >
              <div
                ref={(el) => (progressSpanRef.current[i] = el)}
                className="h-full bg-primary w-0 transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default VideoCarousel;
