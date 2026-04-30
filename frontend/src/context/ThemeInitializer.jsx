import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function ThemeInitializer() {
  const theme = useSelector((s) => s.ui.theme);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", theme === "dark");

    localStorage.setItem("theme", theme);
  }, [theme]);

  return null;
}
