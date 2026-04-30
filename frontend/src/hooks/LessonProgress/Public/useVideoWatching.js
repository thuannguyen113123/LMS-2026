import { useEffect, useRef, useCallback } from "react";
import useLessonProgress from "./useLessonProgress";

const SAVE_INTERVAL = 5000; // 5s

export default function useVideoWatching(lessonId) {
  const { updateWatching } = useLessonProgress(lessonId);

  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSavedTime = useRef(0);

  const saveProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const currentTime = Math.floor(video.currentTime);
    const duration = Math.floor(video.duration);

    // tránh spam API
    if (currentTime - lastSavedTime.current < 5) return;

    lastSavedTime.current = currentTime;

    updateWatching({
      lessonId,
      currentTime,
      duration,
    });
  }, [lessonId, updateWatching]);

  useEffect(() => {
    lastSavedTime.current = 0;
  }, [lessonId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const startTracking = () => {
      if (intervalRef.current) return;

      intervalRef.current = setInterval(() => {
        saveProgress();
      }, SAVE_INTERVAL);
    };

    const stopTracking = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handlePause = () => {
      saveProgress();
      stopTracking();
    };

    video.addEventListener("play", startTracking);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handlePause);

    return () => {
      saveProgress();
      stopTracking();

      video.removeEventListener("play", startTracking);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handlePause);
    };
  }, [lessonId, saveProgress]);
  useEffect(() => {
    const handleResume = () => {
      const video = videoRef.current;
      if (!video) return;

      video.play().catch(() => {});
    };

    const handleStart = () => {
      const video = videoRef.current;
      if (!video) return;

      video.currentTime = 0;
      video.play().catch(() => {});
    };

    window.addEventListener("lesson:resume", handleResume);
    window.addEventListener("lesson:start", handleStart);

    return () => {
      window.removeEventListener("lesson:resume", handleResume);
      window.removeEventListener("lesson:start", handleStart);
    };
  }, []);
  return {
    videoRef,
    onPause: saveProgress,
    onEnded: saveProgress,
  };
}
