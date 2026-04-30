import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyProfile,
  fetchProfileBySlug,
  updateMyProfile,
} from "../../features/users/usersThunks";
import { uploadToCloudinary } from "../../config/uploadToCloudinary";
import { useParams } from "react-router-dom";

const DEFAULT_AVATAR = "/default-avatar.png";

const validateProfile = (form) => {
  const errors = {};

  if (!form.fullname.trim()) {
    errors.fullname = "Tên không được để trống";
  }

  return errors;
};

export default function useProfile() {
  const dispatch = useDispatch();
  const { slug } = useParams();

  const myProfile = useSelector((s) => s.users.profile);
  const profileView = useSelector((s) => s.users.profileView);
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  const initialRef = useRef(null);

  const profile = slug ? profileView : myProfile;

  const isMyProfile = !slug;

  const [form, setForm] = useState({
    avatar: DEFAULT_AVATAR,
    fullname: "",

    bio: "",
    interests: [],
    social: {},
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [newTag, setNewTag] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [viewType, setViewType] = useState("student");
  const hasInstructorProfile = profile?.hasInstructorProfile;

  const saveTimer = useRef(null);

  useEffect(() => {
    if (!profile) return;

    const active = profile.activeRole?.name;

    if (active === "instructor" && profile.hasInstructorProfile) {
      setViewType("instructor");
      return;
    }

    if (active === "student" && profile.hasStudentProfile) {
      setViewType("student");
      return;
    }

    if (profile.hasInstructorProfile) {
      setViewType("instructor");
    } else {
      setViewType("student");
    }
  }, [profile]);
  const displayData = useMemo(() => {
    if (isMyProfile) {
      return {
        avatar: form.avatar || profile?.avatar || DEFAULT_AVATAR,
        fullname: form.fullname || profile?.fullname || "",
        bio: form.bio || "",
        interests: form.interests || [],
        social: form.social || {},
        email: profile?.email || "",
        phone: profile?.phone || "",
      };
    }

    if (!profile) return null;

    const active = profile.profiles?.[viewType];

    return {
      avatar: profile.avatar || DEFAULT_AVATAR,
      fullname: profile.fullname || "",
      bio: active?.bio || "",
      interests: active?.expertise || [],
      social: active?.socialLinks || {},
      email: profile.email || "",
      phone: profile.phone || "",
    };
  }, [form, profile, isMyProfile, viewType]);

  const activeProfile = useMemo(() => {
    if (!profile) return null;

    return profile.profiles?.[viewType];
  }, [profile, viewType]);

  useEffect(() => {
    if (slug) {
      dispatch(fetchProfileBySlug({ slug }));
    } else if (isAuthenticated) {
      dispatch(fetchMyProfile());
    }
  }, [dispatch, slug, isAuthenticated]);

  useEffect(() => {
    if (!profile) return;

    if (!profile || !profile.profiles) return;

    const active = profile.profiles?.[viewType];

    const data = {
      avatar: profile.avatar || DEFAULT_AVATAR,
      fullname: profile.fullname || "",
      bio: active?.bio || "",
      interests: active?.expertise || [],
      social: active?.socialLinks || {},
    };

    setForm(data);
    initialRef.current = JSON.stringify(data);
  }, [profile, viewType]);

  const getChangedFields = (current, initial) => {
    const changed = {};
    const init = JSON.parse(initial);

    Object.keys(current).forEach((key) => {
      if (JSON.stringify(current[key]) !== JSON.stringify(init[key])) {
        changed[key] = current[key];
      }
    });

    return changed;
  };

  const isDirty = useMemo(() => {
    if (!initialRef.current) return false;

    return JSON.stringify(form) !== initialRef.current;
  }, [form]);

  const updateField = useCallback(
    (key, value) => {
      if (!isMyProfile) return;
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [isMyProfile]
  );

  const addTag = useCallback(() => {
    if (!isMyProfile) return;

    const tag = newTag.trim();
    if (!tag) return;

    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(tag)
        ? prev.interests
        : [...prev.interests, tag],
    }));

    setNewTag("");
  }, [newTag, isMyProfile]);

  const removeTag = useCallback(
    (tag) => {
      if (!isMyProfile) return;

      setForm((prev) => ({
        ...prev,
        interests: prev.interests.filter((t) => t !== tag),
      }));
    },
    [isMyProfile]
  );

  const uploadAvatar = async (file) => {
    if (!file || !isMyProfile) return;

    const res = await uploadToCloudinary(file, "LMS-2025");
    updateField("avatar", res.secure_url);
  };

  const saveProfile = useCallback(async () => {
    if (!isMyProfile) return;
    const validation = validateProfile(form);

    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }

    const changed = getChangedFields(form, initialRef.current);

    if (!Object.keys(changed).length) return;

    setSaving(true);

    try {
      const payload = {
        ...changed,
        expertise: changed.interests,
        socialLinks: changed.social,
      };

      delete payload.interests;
      delete payload.social;

      await dispatch(updateMyProfile(payload)).unwrap();

      initialRef.current = JSON.stringify(form);
    } finally {
      setSaving(false);
    }
  }, [dispatch, form, isMyProfile]);

  useEffect(() => {
    if (!isDirty) return;

    clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      saveProfile();
    }, 1500);

    return () => clearTimeout(saveTimer.current);
  }, [form, isDirty, saveProfile]);

  const isInstructor = viewType === "instructor";
  const isStudent = viewType === "student";

  const roleLabel = useMemo(() => {
    if (isInstructor) return "Instructor";
    if (isStudent) return "Student";
    return "Member";
  }, [isInstructor, isStudent]);

  const instructorStats = useMemo(() => {
    if (!activeProfile) return { courses: 0, students: 0, rating: 0 };

    return {
      courses: activeProfile.coursesTaught?.length || 0,
      students: activeProfile.totalStudents || 0,
      rating: activeProfile.rating?.average || 0,
    };
  }, [activeProfile]);

  const studentStats = useMemo(() => {
    if (!activeProfile) return { progress: 0, certificates: 0, bookmarks: 0 };

    return {
      progress: activeProfile.progress || 0,
      certificates: Array.isArray(activeProfile.certificates)
        ? activeProfile.certificates.length
        : 0,
      bookmarks: Array.isArray(activeProfile.bookmarks)
        ? activeProfile.bookmarks.length
        : 0,
    };
  }, [activeProfile]);
  return {
    profile,
    form,
    displayData,
    errors,
    updateField,
    addTag,
    removeTag,
    newTag,
    setNewTag,
    uploadAvatar,
    saveProfile,
    saving,
    isDirty,
    roleLabel,
    isInstructor,
    isStudent,
    instructorStats,
    studentStats,
    previewOpen,
    setPreviewOpen,
    isMyProfile,
    activeProfile,
    viewType,
    setViewType,
    hasInstructorProfile,
  };
}
