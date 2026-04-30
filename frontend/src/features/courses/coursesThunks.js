import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import {
  exportCoursesApi,
  previewExportCoursesApi,
} from "../../app/course.api";

export const toastMap = {
  // ===== COURSE =====
  COURSE_CREATED: {
    type: "success",
    title: "Khóa học",
    message: "Tạo khóa học thành công",
  },

  COURSE_EXISTS: {
    type: "error",
    title: "Khóa học",
    message: "Khóa học đã tồn tại",
  },

  COURSE_CREATE_FAILED: {
    type: "error",
    title: "Khóa học",
    message: "Tạo khóa học thất bại",
  },

  COURSE_INSTRUCTOR_REQUIRED: {
    type: "error",
    title: "Khóa học",
    message: "Thiếu giảng viên phụ trách",
  },
  // ===== COURSE BULK =====
  COURSE_BULK_CREATED: {
    type: "success",
    title: "Khóa học",
    message: "Import khóa học thành công",
  },

  COURSE_BULK_INVALID_PAYLOAD: {
    type: "error",
    title: "Khóa học",
    message: "Danh sách khóa học không hợp lệ",
  },

  COURSE_BULK_VALIDATION_FAILED: {
    type: "warning",
    title: "Khóa học",
    message: "Có dòng dữ liệu khóa học không hợp lệ",
  },

  COURSE_BULK_DUPLICATE_IN_FILE: {
    type: "warning",
    title: "Khóa học",
    message: "Có khóa học bị trùng trong file",
  },

  COURSE_ALREADY_EXISTS: {
    type: "warning",
    title: "Khóa học",
    message: "Một số khóa học đã tồn tại",
  },

  COURSE_BULK_CREATE_FAILED: {
    type: "error",
    title: "Khóa học",
    message: "Import khóa học thất bại",
  },

  COURSE_UPDATED: {
    type: "success",
    title: "Khóa học",
    message: "Cập nhật khóa học thành công",
  },

  COURSE_UPDATE_FAILED: {
    type: "error",
    title: "Khóa học",
    message: "Cập nhật khóa học thất bại",
  },
  COURSE_DELETE_SUCCESS: {
    type: "success",
    title: "Khóa học",
    message: "Xóa khóa học thành công",
  },

  COURSE_DELETE_FAILED: {
    type: "error",
    title: "Khóa học",
    message: "Xóa khóa học thất bại",
  },

  COURSE_DELETE_EMPTY_IDS: {
    type: "warning",
    title: "Khóa học",
    message: "Chưa chọn khóa học để xóa",
  },

  COURSE_PUBLISH_SUCCESS: {
    type: "success",
    title: "Khóa học",
    message: "Publish khóa học thành công",
  },

  COURSE_ALREADY_PUBLISHED: {
    type: "info",
    title: "Khóa học",
    message: "Khóa học đã publish trước đó",
  },

  COURSE_PUBLISH_FAILED: {
    type: "error",
    title: "Khóa học",
    message: "Publish khóa học thất bại",
  },
  COURSE_EXPORT_PREVIEW_SUCCESS: {
    type: "info",
    title: "Khóa học",
    message: "Đã tạo dữ liệu xem trước export",
  },

  COURSE_EXPORT_SUCCESS: {
    type: "success",
    title: "Khóa học",
    message: "Xuất khóa học thành công",
  },

  COURSE_EXPORT_EMPTY: {
    type: "warning",
    title: "Khóa học",
    message: "Không có dữ liệu để export",
  },
};

export function buildQueryString(params) {
  const q = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v == null || v === "" || v === "all" || v === "All") return;

    if (Array.isArray(v)) {
      v.forEach((x) => q.append(k, x));
    } else {
      q.append(k, v);
    }
  });

  return q.toString();
}

export const fetchCourses = createAsyncThunk(
  "courses/adminList",

  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/courses?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);
//Lấy khóa học

export const fetchPublicCourses = createAsyncThunk(
  "courses/publicList",

  async (args = {}, { rejectWithValue }) => {
    try {
      const { cursor = null, limit = 12, filters = {} } = args;

      const params = buildQueryString({
        cursor,
        limit,
        ...filters,
      });

      const res = await api.get(`/courses/public?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);
export const fetchMyCourses = createAsyncThunk(
  "courses/fetchMyCourses",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/courses/my-courses", {
        params,
      });

      return {
        courses: res.data.courses,
        pagination: res.data.pagination,
        isLoadMore: params?.cursor ? true : false,
        reset: !!params?.reset,
      };
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code || "FETCH_MY_COURSES_FAILED",
      });
    }
  }
);
export const fetchCourseOptions = createAsyncThunk(
  "courses/fetchOptions",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/courses/options");

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code || "COURSE_OPTIONS_FAILED",
      });
    }
  }
);

//Khóa học theo đề xuất
export const fetchRecommendedCourses = createAsyncThunk(
  "courses/fetchRecommended",
  async ({ courseId, limit = 4 }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/courses/${courseId}/recommended?limit=${limit}`
      );
      return res.data.courses;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Lấy chi tiết khóa học theo slug
export const fetchCourseDetailBySlug = createAsyncThunk(
  "courses/fetchDetailBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      if (!slug) {
        return rejectWithValue({
          code: "COURSE_INVALID_SLUG",
        });
      }

      const res = await api.get(`/courses/detail/${slug}`);

      const { code, data } = res.data;

      return {
        code,
        course: data.course,
      };
    } catch (err) {
      const res = err.response?.data;

      return rejectWithValue({
        code: res?.code || "COURSE_DETAIL_FAILED",
      });
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);

export const getContinueLearning = createAsyncThunk(
  "learning/getContinueLearning",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/courses/continue-learning");

      const { code, data } = res.data;

      return {
        code,
        courses: data.courses,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      return rejectWithValue({ code });
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);
// Tạo khóa học
export const createCourse = createAsyncThunk(
  "courses/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/courses/createCourse", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        course: data.course,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const createManyCourses = createAsyncThunk(
  "courses/createMany",
  async (payloadList, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/courses/bulk", payloadList);

      const { code, data, summary } = res.data;

      if (code === "COURSE_BULK_CREATED") {
        const { created, skipped, failed } = summary;

        dispatch(
          addToast({
            type: failed > 0 ? "warning" : "success",

            title: "Import khóa học",

            message: `Hoàn tất: ${created} tạo mới • ${skipped} bỏ qua • ${failed} lỗi`,
          })
        );
      } else {
        const toast = toastMap[code];
        if (toast) dispatch(addToast(toast));
      }

      return {
        code,
        created: data.created,
        skipped: data.skipped,
        errors: data.errors,
        summary,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "COURSE_BULK_CREATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const publishCourse = createAsyncThunk(
  "courses/publish",
  async (courseId, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.patch(`/courses/${courseId}/publish`);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        course: data.course,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "COURSE_PUBLISH_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// Cập nhật khóa học theo phong cách danh mục
export const updateCourse = createAsyncThunk(
  "courses/update",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { id, ...data } = payload;

      const res = await api.put(`/courses/${id}`, data);

      const { code, data: resData } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        course: resData.course,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "COURSE_UPDATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// Xóa khóa học
export const deleteCourse = createAsyncThunk(
  "courses/deleteCourse",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/courses/${id}`);
      dispatch(addToast({ type: "success", message: "Đã xóa khóa học" }));
      return id;
    } catch (err) {
      dispatch(addToast({ type: "error", message: "Xóa khóa học thất bại" }));
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const deleteManyCourses = createAsyncThunk(
  "courses/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/courses/delete-many", { ids });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: data.deletedIds,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "COURSE_DELETE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const previewExportCourses = createAsyncThunk(
  "courses/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportCoursesApi(payload);
      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        preview: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "COURSE_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const exportCourses = createAsyncThunk(
  "courses/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportCoursesApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "courses_export";
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      const toast = toastMap.COURSE_EXPORT_SUCCESS || {
        type: "success",
        message: "Xuất khóa học thành công",
      };

      dispatch(addToast(toast));

      return {
        buffer: res.data,
        fileName,
        contentType,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "COURSE_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

//Mua khóa học
export const purchaseCourse = createAsyncThunk(
  "course/purchaseCourse",
  async ({ courseId, paymentMethod }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("checkout", { courseId, paymentMethod });
      dispatch(
        addToast({
          type: "success",
          message: "Thanh toán: chuyển sang công thanh toán",
        })
      );
      return res.data;
    } catch (err) {
      dispatch(addToast({ type: "error", message: "Thanh toán thất bại" }));
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
