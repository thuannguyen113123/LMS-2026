import React, { useEffect, useRef, useState } from "react";
import { FiPlay, FiClock, FiRotateCcw } from "react-icons/fi";

const OverviewIntroVideo = ({ videoURL }) => {
  const videoRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [duration, setDuration] = useState(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!videoURL) return;

    const video = document.createElement("video");
    video.src = videoURL;
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = () => setDuration(Math.floor(video.duration));

    video.currentTime = 0.5;

    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      setThumbnail(canvas.toDataURL("image/jpeg"));
    };
  }, [videoURL]);

  const formatDuration = (sec) => {
    if (!sec) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!videoURL) return null;

  return (
    <section
      className="
        bg-card border border-border rounded-2xl animate-fade-in
        px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12
      "
    >
      {/* HEADER */}
      <div className="pt-6 sm:pt-8 md:pt-10">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-primary">
            Video giới thiệu khóa học
          </h2>
          <span className="text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary-soft text-primary font-medium">
            Preview
          </span>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-primary/70">
          Tổng quan nội dung, lộ trình và phương pháp giảng dạy
        </p>
      </div>

      {/* VIDEO */}
      <div className="relative mt-4 sm:mt-6 md:mt-8">
        <div
          className={`
            relative aspect-video overflow-hidden rounded-2xl border transition-all duration-300 group
            ${
              isPlaying
                ? "border-primary shadow-lg"
                : "border-border hover:shadow-md"
            }
          `}
        >
          {/* Skeleton */}
          {!isLoaded && !isPlaying && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}

          {/* THUMBNAIL */}
          {!isPlaying && thumbnail && (
            <>
              <img
                src={thumbnail}
                alt="Course intro"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onLoad={() => setIsLoaded(true)}
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/70" />

              {/* Play Button */}
              <button
                onClick={() => {
                  setIsPlaying(true);
                  setEnded(false);
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary shadow-xl transition-transform duration-300 group-hover:scale-110">
                  <FiPlay className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ml-1" />
                  <span className="absolute inset-0 rounded-full border border-primary animate-ping opacity-20" />
                </span>
              </button>

              {/* Duration */}
              {duration && (
                <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/60 text-white text-xs sm:text-sm">
                  {formatDuration(duration)}
                </div>
              )}

              {/* Label */}
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 flex items-center gap-1 sm:gap-2 text-white text-xs sm:text-sm opacity-90">
                <FiClock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Xem trước nội dung khóa học</span>
              </div>
            </>
          )}

          {/* VIDEO PLAYER */}
          {isPlaying && (
            <video
              ref={videoRef}
              src={videoURL}
              controls
              autoPlay
              onEnded={() => {
                setEnded(true);
                setIsPlaying(false);
              }}
              className="w-full h-full object-cover animate-fade-in"
            />
          )}

          {/* Replay overlay */}
          {ended && (
            <button
              onClick={() => {
                setIsPlaying(true);
                setEnded(false);
              }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <FiRotateCcw className="w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8 text-white" />
              <span className="text-xs sm:text-sm md:text-base text-white mt-1">
                Xem lại preview
              </span>
            </button>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="pt-4 sm:pt-6 pb-6 sm:pb-8">
        <div className="bg-muted rounded-xl p-4 sm:p-5 md:p-6 text-xs sm:text-sm md:text-base text-primary/80 leading-relaxed">
          Video này giúp bạn đánh giá mức độ phù hợp của khóa học với mục tiêu
          học tập của mình trước khi đăng ký. Bạn có thể xem lại bất kỳ lúc nào.
        </div>
      </div>
    </section>
  );
};

export default OverviewIntroVideo;
