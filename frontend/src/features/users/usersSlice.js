import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  adminFormUpdate,
  adminInlineUpdate,
  createManyUsers,
  createUser,
  deleteManyUsers,
  exportUsers,
  fetchMyProfile,
  fetchProfileBySlug,
  fetchUsers,
  previewExportUsers,
  searchUsersForRoom,
  updateMyProfile,
  updateThemeApi,
} from "./usersThunks";
import { logoutApi } from "../auth/authThunks";
import {
  rateInstructor,
  removeInstructorRating,
} from "../student/studentsThunks";

// Adapter
const usersAdapter = createEntityAdapter({
  selectId: (user) => user.id,
});

// Initial state từ adapter + custom fields
const initialState = usersAdapter.getInitialState({
  page: 1,
  limit: 10,
  loading: {
    admin: false,
    profile: false,
    profileView: false,
    create: false,
    createMany: false,
    updateProfile: false,
    deleteMany: false,
    export: false,
  },
  error: null,

  roleId: "All",
  searchResults: [], // 🔍 thêm dòng này
  errorCode: null,
  lastActionCode: null,

  exportPreview: null,
  previewLoading: false,

  searchLoading: false,
  searchPagination: null,

  profile: null,
  profileView: null,

  lists: {
    admin: [],
  },

  paginationAdmin: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  recentlyUpdatedIds: [],
});

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearSearchResults(state) {
      state.searchResults = [];
      state.searchPagination = null;
    },
    setRecentlyUpdated: (state, action) => {
      state.recentlyUpdatedIds.push(action.payload);
    },

    clearRecentlyUpdated: (state, action) => {
      state.recentlyUpdatedIds = state.recentlyUpdatedIds.filter(
        (id) => id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchUsers.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { users, pagination } = action.payload;

        usersAdapter.upsertMany(state, users);

        state.lists.admin = users.map((u) => u.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchProfileBySlug.pending, (state) => {
        state.loading.profileView = true;
      })

      .addCase(fetchProfileBySlug.fulfilled, (state, action) => {
        state.loading.profileView = false;

        state.profileView = action.payload.profile;
      })

      .addCase(fetchProfileBySlug.rejected, (state, action) => {
        state.loading.profileView = false;
        state.errorCode = action.payload?.code;
      })
      // CREATE
      .addCase(createUser.pending, (state) => {
        state.loading.create = true;
        state.errorCode = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading.create = false;
        state.lastActionCode = action.payload.code;
        const user = action.payload.user;

        if (action.payload.user) {
          usersAdapter.addOne(state, action.payload.user);
        }
        state.recentlyUpdatedIds.push(user.id);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading.create = false;
        state.errorCode = action.payload?.code;
      })

      // CREATE MANY USERS
      .addCase(createManyUsers.pending, (state) => {
        state.loading.createMany = true;
        state.errorCode = null;
      })

      .addCase(createManyUsers.fulfilled, (state, action) => {
        state.loading.createMany = false;
        state.lastActionCode = action.payload.code;

        if (action.payload.users?.length) {
          usersAdapter.addMany(state, action.payload.users);

          // highlight rows
          const ids = action.payload.users.map((user) => user.id);
          state.recentlyUpdatedIds.push(...ids);
        }

        if (action.payload.bulk) {
          state.bulk.summary = action.payload.bulk.summary;
          state.bulk.skipped = action.payload.bulk.skipped;
          state.bulk.errors = action.payload.bulk.errors;
        }
      })

      .addCase(createManyUsers.rejected, (state, action) => {
        state.loading.createMany = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(fetchMyProfile.pending, (state) => {
        state.loading.profile = true;
      })

      .addCase(fetchMyProfile.fulfilled, (state, action) => {
        state.loading.profile = false;

        const profile = action.payload.data;

        state.profile = profile;

        usersAdapter.upsertOne(state, profile);
      })

      .addCase(fetchMyProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.errorCode = action.payload?.code;
      })

      // DELETE MANY USERS
      .addCase(deleteManyUsers.pending, (state) => {
        state.loading.deleteMany = true;
        state.errorCode = null;
      })

      .addCase(deleteManyUsers.fulfilled, (state, action) => {
        state.loading.deleteMany = false;
        state.lastActionCode = action.payload.code;

        usersAdapter.removeMany(state, action.payload.deletedIds);
      })

      .addCase(deleteManyUsers.rejected, (state, action) => {
        state.loading.deleteMany = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(previewExportUsers.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })

      .addCase(previewExportUsers.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.lastActionCode = action.payload.code;
        state.exportPreview = action.payload.preview;
      })

      .addCase(previewExportUsers.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(exportUsers.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })

      .addCase(exportUsers.fulfilled, (state) => {
        state.loading.export = false;
        state.lastActionCode = "USER_EXPORT_SUCCESS";
      })

      .addCase(exportUsers.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(adminFormUpdate.fulfilled, (state, action) => {
        const { user, code } = action.payload;

        usersAdapter.upsertOne(state, user);

        state.lastActionCode = code;

        // highlight row
        state.recentlyUpdatedIds.push(user.id);
      })
      .addCase(adminFormUpdate.rejected, (state, action) => {
        state.errorCode = action.payload?.code;
      })

      .addCase(adminInlineUpdate.fulfilled, (state, action) => {
        usersAdapter.upsertOne(state, action.payload.user);
        state.lastActionCode = action.payload.code;
      })

      .addCase(adminInlineUpdate.rejected, (state, action) => {
        state.errorCode = action.payload?.code;
      })

      // UPDATE

      .addCase(updateMyProfile.pending, (state, action) => {
        state.loading.updateProfile = true;

        // optimistic update
        if (state.profile) {
          state.profile = {
            ...state.profile,
            ...action.meta.arg,
          };
        }
      })

      .addCase(updateMyProfile.fulfilled, (state, action) => {
        state.loading.updateProfile = false;

        const user = action.payload;

        usersAdapter.upsertOne(state, user);

        if (state.profile?.id === user.id) {
          state.profile = user;
        }
      })

      .addCase(updateMyProfile.rejected, (state, action) => {
        state.loading.updateProfile = false;
        state.error = action.payload;
      })

      // --- SEARCH USERS ---
      .addCase(searchUsersForRoom.pending, (state) => {
        state.searchLoading = true;
      })

      .addCase(searchUsersForRoom.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.lastActionCode = action.payload.code;

        const { data, isNextPage, pagination } = action.payload;

        if (isNextPage) {
          state.searchResults = [...state.searchResults, ...data];
        } else {
          state.searchResults = data;
        }

        state.searchPagination = pagination;
      })

      .addCase(searchUsersForRoom.rejected, (state, action) => {
        state.searchLoading = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(updateThemeApi.fulfilled, (state, action) => {
        const { preferences } = action.payload;

        if (state.user) {
          state.user.preferences = {
            ...state.user.preferences,
            ...preferences,
          };
        }
      })
      .addCase(updateThemeApi.rejected, (state, action) => {
        state.errorCode = action.payload?.code;
      })
      .addCase(logoutApi.fulfilled, () => initialState)
      .addCase(rateInstructor.fulfilled, (state, action) => {
        const { instructorId, rating } = action.payload;

        if (
          state.profileView?.id === instructorId &&
          state.profileView?.profiles?.instructor
        ) {
          state.profileView.profiles.instructor.rating.viewerRating = rating;
        }

        // profile của chính mình nếu cần
        if (
          state.profile?.id === instructorId &&
          state.profile?.profiles?.instructor
        ) {
          state.profile.profiles.instructor.rating.viewerRating = rating;
        }
      })

      .addCase(removeInstructorRating.fulfilled, (state, action) => {
        const { instructorId } = action.payload;

        if (
          state.profileView?.id === instructorId &&
          state.profileView?.profiles?.instructor
        ) {
          state.profileView.profiles.instructor.rating.viewerRating = 0;
        }

        if (
          state.profile?.id === instructorId &&
          state.profile?.profiles?.instructor
        ) {
          state.profile.profiles.instructor.rating.viewerRating = 0;
        }
      });
  },
});

export const { clearSearchResults, setRecentlyUpdated, clearRecentlyUpdated } =
  usersSlice.actions;

export default usersSlice.reducer;

// Export selectors
export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds,
} = usersAdapter.getSelectors((state) => state.users);
export const selectSearchResults = (state) => state.users.searchResults;
export const selectAdminUsers = (state) =>
  state.users.lists.admin.map((id) => state.users.entities[id]).filter(Boolean);

export const selectMyProfile = (state) => state.users.profile;
export const selectProfileView = (state) => state.users.profileView;
export const selectUserOptions = createSelector([selectAllUsers], (users) =>
  users.map((u) => ({
    label:
      u.fullName ||
      u.displayName ||
      u.name ||
      u.username ||
      u.email ||
      u.phone ||
      `User ${u.id?.slice(-4)}`,
    value: u.id,
    role: u.role,
    email: u.email,
    phone: u.phone,
  }))
);
export const selectInstructorOptions = createSelector(
  [selectAllUsers],
  (users) =>
    users
      .filter((u) => u.role === "instructor")
      .map((u) => ({
        label: u.fullName || u.email,
        value: u.id,
      }))
);
export const selectStudentOptions = createSelector([selectAllUsers], (users) =>
  users
    .filter((u) => u.role === "student")
    .map((u) => ({
      label: u.fullName || u.email,
      value: u.id,
    }))
);
export const selectUsersLoading = (state) => state.users.loading;
export const selectUsersAdminLoading = (state) => state.users.loading.admin;

export const selectProfileLoading = (state) => state.users.loading.profile;

export const selectProfileViewLoading = (state) =>
  state.users.loading.profileView;

export const selectExportUsersLoading = (state) => state.users.loading.export;

export const selectPreviewExportUsersLoading = (state) =>
  state.users.loading.previewExport;

export const selectSearchUsersLoading = (state) => state.users.loading.search;
