import React from "react";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Edit2,
  Camera,
  Plus,
  Link as LinkIcon,
} from "lucide-react";

import useProfile from "../../hooks/Profile/useProfile";
import UploadField from "../../components/upload/UploadField";
import InstructorRatingSection from "../../components/comments/rating/InstructorRatingSection";

function IconInput({ icon: Icon, label, ...props }) {
  return (
    <label className="block">
      <div className="text-xs text-primary mb-1">{label}</div>

      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
            <Icon size={16} />
          </span>
        )}

        <input
          {...props}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200  shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200 placeholder:text-slate-300 text-sm"
        />
      </div>
    </label>
  );
}

function Tag({ children, onRemove }) {
  return (
    <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-slate-50 border border-slate-100 text-slate-700 shadow-sm">
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-slate-100"
          aria-label="remove tag"
        >
          ×
        </button>
      )}
    </span>
  );
}

export default function ProfilePage() {
  const {
    profile,
    roleLabel,
    isInstructor,
    isStudent,
    form,
    updateField,
    newTag,
    setNewTag,
    addTag,
    removeTag,
    instructorStats,
    studentStats,
    handleSave,
    isSaving,
    uploadAvatar,
    setPreviewOpen,
    previewOpen,
    isMyProfile,
    viewType,
    setViewType,
    displayData,
    hasInstructorProfile,
    activeProfile,
  } = useProfile();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <section className="min-h-screen px-3 sm:px-4 md:px-6 pt-16 sm:pt-20">
      <div className="max-w-sm sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
        {/* Card */}
        <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 m-4 sm:m-6">
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-primary">
                {isMyProfile ? "Edit Profile" : "Profile"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Update your personal information
              </p>
            </div>
            {isMyProfile && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 h-11 rounded-lg bg-slate-900 text-white"
              >
                <Edit2 size={16} />
                {isSaving ? "Saving..." : "Save"}
              </button>
            )}
          </div>

          <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 rounded-2xl shadow-inner border">
                <div className="relative">
                  <div className="flex justify-center">
                    <UploadField
                      accept="image/*"
                      initialPreview={displayData.avatar}
                      setFile={(file) => uploadAvatar(file)}
                      variant="avatar"
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
                      disabled={!isMyProfile}
                    />
                  </div>
                  <button
                    className="absolute right-0 bottom-0  rounded-full p-2 shadow text-primary hover:bg-slate-50"
                    title="Upload avatar"
                  >
                    <Camera size={16} />
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-between gap-1">
                    <div>
                      <div className="text-lg font-semibold text-primary">
                        {displayData.fullname}
                      </div>
                      <div className="text-sm text-slate-500">{roleLabel}</div>
                    </div>

                    <div className="text-sm text-slate-400">
                      Member since 2021
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="w-full flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {isMyProfile && (
                          <button
                            onClick={handleSave}
                            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm shadow"
                          >
                            Save
                          </button>
                        )}
                        <button
                          onClick={() => setPreviewOpen(true)}
                          className="px-3 py-2 rounded-lg border border-slate-100 text-slate-500 text-sm"
                        >
                          Preview
                        </button>
                      </div>
                      <div>
                        {profile.hasStudentProfile &&
                          profile.hasInstructorProfile && (
                            <div className="relative w-60 h-9 bg-gray-200 rounded-full p-1 flex items-center">
                              {/* Slider */}
                              <div
                                className={`absolute top-1 left-1 h-7 w-1/2 bg-black rounded-full transition-transform duration-300 ${
                                  viewType === "instructor"
                                    ? "translate-x-full"
                                    : ""
                                }`}
                              />

                              {/* Options */}
                              <button
                                onClick={() => setViewType("student")}
                                className={`relative z-10 w-1/2 text-sm font-medium ${
                                  viewType === "student"
                                    ? "text-white"
                                    : "text-gray-600"
                                }`}
                              >
                                Student
                              </button>

                              <button
                                onClick={() => setViewType("instructor")}
                                className={`relative z-10 w-1/2 text-sm font-medium ${
                                  viewType === "instructor"
                                    ? "text-white"
                                    : "text-gray-600"
                                }`}
                              >
                                Instructor
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className=" rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-medium text-primary mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <IconInput
                    icon={User}
                    label="Full name"
                    value={displayData.fullname}
                    onChange={(e) => updateField("fullname", e.target.value)}
                    disabled={!isMyProfile}
                  />

                  {form.email ? (
                    <IconInput
                      icon={Mail}
                      label="Email address"
                      value={displayData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      disabled
                    />
                  ) : (
                    <IconInput
                      icon={Phone}
                      label="Mobile number"
                      value={displayData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      disabled
                    />
                  )}
                </div>
              </div>
              {(isInstructor || isStudent) && (
                <div className="rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-medium text-primary mb-3">
                    {isInstructor
                      ? "Instructor Insights"
                      : "Student Progress Overview"}
                  </h3>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {isInstructor && (
                      <>
                        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
                          <div className="text-sm text-slate-600">Courses</div>
                          <div className="mt-2 text-lg font-semibold text-slate-900">
                            {instructorStats.courses}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
                          <div className="text-sm text-slate-600">Students</div>
                          <div className="mt-2 text-lg font-semibold text-slate-900">
                            {instructorStats.students}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
                          <div className="text-sm text-slate-600">Rating</div>
                          <div className="mt-2 text-lg font-semibold text-slate-900">
                            {instructorStats.rating}
                          </div>
                        </div>
                      </>
                    )}
                    {isStudent && (
                      <>
                        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
                          <div className="text-sm text-slate-600">Progress</div>
                          <div className="mt-2 text-lg font-semibold text-slate-900">
                            {studentStats.progress}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
                          <div className="text-sm text-slate-600">
                            Certificates
                          </div>
                          <div className="mt-2 text-lg font-semibold text-slate-900">
                            {studentStats.certificates}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
                          <div className="text-sm text-slate-600">
                            Bookmarks
                          </div>
                          <div className="mt-2 text-lg font-semibold text-slate-900">
                            {studentStats.bookmarks}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {!isMyProfile &&
                    hasInstructorProfile &&
                    viewType === "instructor" && (
                      <div className="mt-6">
                        <InstructorRatingSection
                          instructorId={profile?.id}
                          viewerRating={
                            profile?.profiles?.instructor?.rating?.viewerRating
                          }
                        />
                      </div>
                    )}
                </div>
              )}
            </div>

            <aside className="space-y-4 sm:space-y-6 lg:col-span-1">
              {isInstructor && (
                <div className="rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between">
                    <h4 className="text-md font-medium text-slate-900">Bio</h4>
                  </div>
                  <textarea
                    value={displayData.bio}
                    onChange={(e) => updateField("bio", e.target.value)}
                    rows={6}
                    className="mt-3 w-full  sm:text-base rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Write a brief bio that will appear on your public profile."
                    disabled={!isMyProfile}
                  />
                </div>
              )}
              {isInstructor && (
                <div className=" rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-primary">
                      Industry / Interests
                    </h4>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {displayData.interests?.map((t) => (
                      <Tag key={t}>
                        <span className="text-xs">{t}</span>
                        <button
                          onClick={() => removeTag(t)}
                          className="ml-1 text-slate-300 hover:text-slate-400"
                          aria-label="remove"
                          disabled={!isMyProfile}
                        >
                          ×
                        </button>
                      </Tag>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Add interest and press Enter"
                      disabled={!isMyProfile}
                    />
                    <button
                      onClick={addTag}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      disabled={!isMyProfile}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              )}
              {isInstructor && (
                <div className=" rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <h4 className="text-md font-medium text-primary">
                    Social Media accounts
                  </h4>

                  <div className="mt-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-slate-400" />
                      <input
                        value={displayData.social?.github || ""}
                        onChange={(e) =>
                          updateField("social", {
                            ...form.social,
                            github: e.target.value,
                          })
                        }
                        placeholder="https://github.com/..."
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        disabled={!isMyProfile}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-slate-400" />
                      <input
                        value={displayData.social?.linkedin || ""}
                        onChange={(e) =>
                          updateField("social", {
                            ...form.social,
                            linkedin: e.target.value,
                          })
                        }
                        placeholder="https://linkedin.com/..."
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        disabled={!isMyProfile}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-slate-400" />
                      <input
                        value={displayData.social?.youtube || ""}
                        onChange={(e) =>
                          updateField("social", {
                            ...form.social,
                            youtube: e.target.value,
                          })
                        }
                        placeholder="https://youtube.com/..."
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        disabled={!isMyProfile}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-slate-400" />
                      <input
                        value={displayData.social?.website || ""}
                        onChange={(e) =>
                          updateField("social", {
                            ...form.social,
                            website: e.target.value,
                          })
                        }
                        placeholder="https://website.com/..."
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        disabled={!isMyProfile}
                      />
                    </div>
                  </div>
                </div>
              )}
              {isStudent && (
                <>
                  <div className="rounded-2xl p-5 bg-card hover-bg-muted">
                    <h4 className="font-medium text-primary">
                      Learning Summary
                    </h4>

                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <div>
                        Courses Enrolled:{" "}
                        {activeProfile?.enrolledCourses?.length || 0}
                      </div>

                      <div>
                        Certificates: {activeProfile?.certificates?.length || 0}
                      </div>

                      <div>
                        Saved Courses: {activeProfile?.bookmarks?.length || 0}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-5 bg-card hover-bg-muted">
                    <h4 className="font-medium text-primary">
                      Recent Certificates
                    </h4>

                    <div className="mt-3 text-sm text-slate-500">
                      {activeProfile?.certificates?.length > 0
                        ? `${activeProfile.certificates.length} certificates earned`
                        : "No certificates yet"}
                    </div>
                  </div>

                  <div className="rounded-2xl p-5 bg-card hover-bg-muted">
                    <h4 className="font-medium text-primary">Preferences</h4>

                    <div className="mt-3 text-sm text-slate-500">
                      Language: {activeProfile?.preferences?.language || "vi"}
                    </div>

                    <div className="text-sm text-slate-500 mt-1">
                      Theme: {activeProfile?.preferences?.theme || "light"}
                    </div>

                    <div className="text-sm text-slate-500 mt-1">
                      Notifications:{" "}
                      {activeProfile?.preferences?.notifications
                        ? "Enabled"
                        : "Disabled"}
                    </div>
                  </div>
                </>
              )}
            </aside>
          </div>

          {/* Footer illustration (keeps decorative look) */}
          <div className="px-8 pb-8">
            <div className="mt-6 rounded-2xl  border border-slate-100 p-6">
              {/* You can replace this with SVG/PNG illustration */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16  rounded-lg flex items-center justify-center text-primary">
                  {/* simple icon */}
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2v20"
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M5 12h14"
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-primar">
                    Illustration Footer
                  </div>
                  <div className="text-xs text-slate-500">
                    Decorative artwork (keeps page light)
                  </div>
                </div>
                <div className="ml-auto text-sm text-slate-400">—</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative bg-white w-[90%] max-w-sm sm:max-w-md rounded-2xl p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>

            <img
              src={form.avatar}
              alt="Avatar preview"
              className="w-full max-w-[280px] sm:max-w-[320px] mx-auto aspect-square object-cover rounded-xl"
            />

            <div className="mt-4 text-center text-sm text-slate-500">
              Avatar Preview
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
