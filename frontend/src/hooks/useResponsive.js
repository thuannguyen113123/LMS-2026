import { useEffect, useState } from "react";

export const useResponsive = () => {
  const [screen, setScreen] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreen(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isMobile: screen < 640,
    isTablet: screen >= 640 && screen < 1024,
    isDesktop: screen >= 1024,
  };
};
