import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../features/modal/modalSlice";
import {
  fetchNotificationSettings,
  updateNotificationSettings,
} from "../../features/notifications/notificationThunks";
import CommonModal from "./CommonModal";
import { updateThemeApi } from "../../features/users/usersThunks";
import {
  setTheme,
  startAppLoading,
  stopAppLoading,
} from "../../features/ui/uiSlice";
import { toggleNotificationSetting } from "../../features/notifications/notificationSlice";

export const MODAL_SETTINGS = "MODAL_SETTINGS";
const applyThemeToDOM = (theme) => {
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(theme);

  localStorage.setItem("theme", theme);
};
const themes = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const languages = [
  { label: "English", value: "en" },
  { label: "Tiếng Việt", value: "vi" },
];

const TABS = ["Appearance", "Notifications", "Language"];

const formatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

const SettingsModal = () => {
  const dispatch = useDispatch();

  const isOpen = useSelector((s) => s.modals.modals[MODAL_SETTINGS]);
  // const userSettings = useSelector((s) => s.notifications.notificationSettings);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("Appearance");

  const [language, setLanguage] = useState("en");

  const theme = useSelector((s) => s.ui.theme);
  const [originalSnapshot, setOriginalSnapshot] = useState({});

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const handleThemeChange = (value) => {
    dispatch(startAppLoading());
    dispatch(setTheme(value));

    if (isAuthenticated) {
      dispatch(updateThemeApi(value));
    }
    dispatch(stopAppLoading());
  };

  const notifications = useSelector(
    (s) => s.notifications.notificationSettings
  );

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotificationSettings())
        .unwrap()
        .then((data) => {
          setOriginalSnapshot(data);
        });
    }
  }, [isOpen, dispatch]);

  const handleClose = () => dispatch(closeModal(MODAL_SETTINGS));

  const buildDiff = (current, original) => {
    const diff = {};

    for (const key in current) {
      if (current[key] !== original[key]) {
        diff[key] = current[key];
      }
    }

    return diff;
  };

  const handleSave = async () => {
    const diff = buildDiff(notifications, originalSnapshot);

    if (Object.keys(diff).length === 0) return;

    try {
      await dispatch(updateNotificationSettings(diff)).unwrap();
      handleClose();
    } catch (err) {
      console.log("update failed", err);
    }
  };
  return (
    <CommonModal
      isOpen={isOpen}
      onClose={handleClose}
      title={null}
      maxWidth="max-w-6xl"
      maxHeight="max-h-[90vh]"
    >
      <div className="flex flex-col md:flex-row h-auto md:h-[520px]">
        <aside className="w-full md:w-56 border-r md:border-r bg-muted/40 backdrop-blur-md p-3 space-y-1">
          <h2 className="px-3 pb-2 text-sm font-semibold text-muted-foreground">
            Settings
          </h2>

          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition
                ${
                  activeTab === tab
                    ? "bg-card shadow-sm border border-border font-medium"
                    : "hover:bg-muted/70"
                }`}
            >
              {tab}
            </button>
          ))}
        </aside>

        <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 sm:space-y-8">
          {activeTab === "Appearance" && (
            <div>
              <Header
                title="Appearance"
                desc="Customize how the application looks."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-6">
                {themes.map((t) => (
                  <ThemeCard
                    key={t.value}
                    active={theme === t.value}
                    label={t.label}
                    value={t.value}
                    onClick={() => handleThemeChange(t.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "Language" && (
            <div>
              <Header title="Language" desc="Choose your preferred language." />

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-4 w-full sm:w-72 px-3 sm:px-4 py-2 rounded-xl border bg-card focus:ring-2 focus:ring-indigo-500"
              >
                {languages.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === "Notifications" && (
            <div>
              <Header
                title="Notifications"
                desc="Control what updates you receive."
              />

              <div className="mt-6 space-y-3">
                {Object.entries(notifications || {}).map(([key, value]) => (
                  <SettingRow
                    key={key}
                    label={formatLabel(key)}
                    checked={value}
                    onChange={() =>
                      dispatch(toggleNotificationSetting({ key }))
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 border-t px-4 sm:px-6 py-3 sm:py-4">
        <button
          onClick={handleClose}
          className="px-4 py-2 rounded-lg hover:bg-muted"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Save Changes
        </button>
      </div>
    </CommonModal>
  );
};

/* ================= UI PARTS ================= */

const Header = ({ title, desc }) => (
  <>
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground">{desc}</p>
  </>
);

const ThemeCard = ({ active, label, onClick }) => {
  const isDark = label === "Dark";

  return (
    <button
      onClick={onClick}
      className={`
        group relative p-4 rounded-2xl border text-left
        transition-all duration-300
        hover:scale-[1.02]
        ${
          active
            ? "ring-2 ring-indigo-500 border-indigo-500 shadow-xl"
            : "hover:shadow-lg"
        }
      `}
    >
      {/* PREVIEW */}
      <div
        className={`
          h-24 sm:h-28 lg:h-32 rounded-xl overflow-hidden mb-3 border
          transition-all
          ${isDark ? "bg-black" : "bg-white"}
        `}
      >
        {/* mini app */}
        <div className="h-full flex flex-col">
          {/* navbar */}
          <div
            className={`
              h-6 px-2 flex items-center gap-1
              ${isDark ? "bg-neutral-900" : "bg-neutral-100"}
            `}
          >
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="w-2 h-2 rounded-full bg-green-400" />
          </div>

          {/* content */}
          <div className="flex-1 p-2 space-y-2">
            <div
              className={`h-2 w-3/4 rounded ${
                isDark ? "bg-neutral-700" : "bg-neutral-300"
              }`}
            />

            <div
              className={`h-6 rounded ${
                isDark ? "bg-neutral-800" : "bg-neutral-200"
              }`}
            />

            <div
              className={`h-6 rounded ${
                isDark ? "bg-neutral-800" : "bg-neutral-200"
              }`}
            />
          </div>
        </div>
      </div>

      {/* LABEL */}
      <p className="font-medium flex items-center justify-between">
        {label}

        {active && (
          <span className="text-xs text-indigo-500 font-semibold">Active</span>
        )}
      </p>

      {/* hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none ring-1 ring-indigo-400/20" />
    </button>
  );
};

const SettingRow = ({ label, checked, onChange, description }) => {
  return (
    <button
      onClick={onChange}
      className={`
        group w-full text-left
        flex items-center justify-between
        p-4 rounded-2xl border border-border
        bg-card
        transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
        active:scale-[0.99]
        focus:outline-none focus:ring-2 focus:ring-indigo-500/40
        ${checked ? "ring-1 ring-indigo-500/40" : ""}
      `}
    >
      {/* LEFT */}
      <div className="space-y-1">
        <p className="font-medium capitalize flex items-center gap-2">
          {label}

          {checked && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-semibold">
              ON
            </span>
          )}
        </p>

        <p className="text-xs text-muted-foreground">
          {description || "Enable or disable this notification"}
        </p>
      </div>

      {/* SWITCH */}
      <div
        className={`
          relative w-12 h-6 rounded-full
          transition-all duration-300
          ${checked ? "bg-indigo-600" : "bg-muted"}
        `}
      >
        <span
          className={`
            absolute top-0.5 left-0.5
            w-5 h-5 rounded-full
            bg-white shadow-md
            transition-all duration-300
            group-active:scale-90
            ${checked ? "translate-x-6" : ""}
          `}
        />
      </div>
    </button>
  );
};

export default SettingsModal;
