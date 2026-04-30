import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import LMSLogo from "../logo/LMSLogo";
import { selectAppLoading, selectPageLoading } from "../../features/ui/uiSlice";

const GlobalLoader = () => {
  const appLoading = useSelector(selectAppLoading);
  const pageLoading = useSelector(selectPageLoading);

  const isLoading = appLoading || pageLoading;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let t;

    if (isLoading) {
      // tránh flicker loading nhanh
      t = setTimeout(() => setVisible(true), 150);
    } else {
      setVisible(false);
    }

    return () => clearTimeout(t);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-1000 flex items-center justify-center
      bg-black/70 backdrop-blur-md transition-opacity duration-300`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="animate-pulse">
          <LMSLogo size={120} />
        </div>

        {/* Loading bar */}
        <div className="relative w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-indigo-500 animate-loading-bar rounded-full" />
        </div>

        {/* Text khác nhau theo type */}
        <p className="text-sm text-gray-300 tracking-wide animate-fade-in">
          {appLoading ? "Initializing app..." : "Loading page..."}
        </p>
      </div>
    </div>
  );
};

export default GlobalLoader;
