import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  fetchModules,
  createModule,
  updateModule,
  toggleModuleActive,
  updateModuleOrder,
  deleteManyModules,
  previewExportModules,
  exportModules,
  fetchSidebarModules,
} from "./modulesThunks";

const modulesAdapter = createEntityAdapter({
  selectId: (module) => module.id,
  sortComparer: (a, b) => (a.order ?? 0) - (b.order ?? 0),
});

const initialState = modulesAdapter.getInitialState({
  lists: {
    admin: [],
  },

  paginationAdmin: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  loading: {
    admin: false,
    create: false,
    update: false,
    toggleActive: false,

    deleteMany: false,
    export: false,
  },
  error: null,
  errorCode: null,
  lastActionCode: null,

  previewLoading: false,
  exportPreview: null,
  sidebarIds: [],
  sidebarLoading: false,
  sidebarFetched: false,
  recentlyUpdatedIds: [],
});

const modulesSlice = createSlice({
  name: "modules",
  initialState,
  reducers: {
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
      /**
       * ===== FETCH =====
       */
      .addCase(fetchModules.pending, (state) => {
        state.loading.admin = true;
        state.errorCode = null;
      })

      .addCase(fetchModules.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { modules, pagination } = action.payload;

        modulesAdapter.upsertMany(state, modules);

        state.lists.admin = modules.map((m) => m.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchModules.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(fetchSidebarModules.pending, (state) => {
        state.sidebarLoading = true;
      })

      .addCase(fetchSidebarModules.fulfilled, (state, action) => {
        state.sidebarLoading = false;
        state.sidebarFetched = true;

        modulesAdapter.upsertMany(state, action.payload.modules);
        state.sidebarIds = action.payload.modules.map((m) => m.id);
      })

      .addCase(fetchSidebarModules.rejected, (state) => {
        state.sidebarLoading = false;
        state.sidebarFetched = true; // vẫn đánh dấu đã thử
      })

      .addCase(createModule.pending, (state) => {
        state.loading.create = true;
        state.errorCode = null;
      })

      .addCase(createModule.fulfilled, (state, action) => {
        state.loading.create = false;
        state.lastActionCode = action.payload.code;

        const module = action.payload.module;
        if (!module) return;

        modulesAdapter.addOne(state, module);

        // 👇 thêm vào list admin hiện tại
        state.lists.admin.unshift(module.id);

        // 👇 cập nhật pagination
        state.paginationAdmin.total += 1;

        // nếu vượt limit → bỏ item cuối
        if (state.lists.admin.length > state.paginationAdmin.limit) {
          state.lists.admin.pop();
        }
        state.recentlyUpdatedIds.push(module.id);
      })

      .addCase(createModule.rejected, (state, action) => {
        state.loading.create = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(updateModule.pending, (state) => {
        state.loading.update = true;
        state.errorCode = null;
      })

      .addCase(updateModule.fulfilled, (state, action) => {
        state.loading.update = false;
        state.lastActionCode = action.payload.code;

        const module = action.payload.module;
        if (!module) return;

        modulesAdapter.upsertOne(state, module);

        // ⭐ highlight updated row
        state.recentlyUpdatedIds.push(module.id);
      })

      .addCase(updateModule.rejected, (state, action) => {
        state.loading.update = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(toggleModuleActive.pending, (state) => {
        state.loading.toggleActive = true;
        state.errorCode = null;
      })

      .addCase(toggleModuleActive.fulfilled, (state, action) => {
        state.loading.toggleActive = false;
        state.lastActionCode = action.payload.code;

        const module = action.payload.module;
        if (!module) return;

        modulesAdapter.upsertOne(state, module);

        state.recentlyUpdatedIds.push(module.id);
      })

      .addCase(toggleModuleActive.rejected, (state, action) => {
        state.loading.toggleActive = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(updateModuleOrder.fulfilled, (state, action) => {
        const items = action.payload;

        items.forEach(({ id, order }) => {
          const module = state.entities.find((m) => m.id === id);
          if (module) module.order = order;
        });

        state.entities.sort((a, b) => a.order - b.order);
      })
      .addCase(deleteManyModules.pending, (state) => {
        state.loading.deleteMany = true;
        state.errorCode = null;
      })
      .addCase(deleteManyModules.fulfilled, (state, action) => {
        state.loading.deleteMany = false;
        state.lastActionCode = action.payload.code;

        const ids = action.payload.ids || [];

        if (!ids.length) return;

        // remove cache
        modulesAdapter.removeMany(state, ids);

        // 👇 remove khỏi list admin
        state.lists.admin = state.lists.admin.filter((id) => !ids.includes(id));

        // 👇 update total
        state.paginationAdmin.total -= ids.length;

        if (state.paginationAdmin.total < 0) {
          state.paginationAdmin.total = 0;
        }
      })
      .addCase(deleteManyModules.rejected, (state, action) => {
        state.loading.deleteMany = false;
        state.errorCode = action.payload?.code;
      })

      // ===== PREVIEW EXPORT =====
      .addCase(previewExportModules.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })
      .addCase(previewExportModules.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.lastActionCode = action.payload.code;
        state.exportPreview = action.payload.preview;
      })
      .addCase(previewExportModules.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })

      // ===== EXPORT =====
      .addCase(exportModules.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })
      .addCase(exportModules.fulfilled, (state) => {
        state.loading.export = false;
        state.lastActionCode = "MODULE_EXPORT_SUCCESS";
      })
      .addCase(exportModules.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      });
  },
});
export const { setRecentlyUpdated, clearRecentlyUpdated } =
  modulesSlice.actions;
export default modulesSlice.reducer;

export const selectSidebarModules = createSelector(
  (state) => state.modules.sidebarIds,
  (state) => state.modules.entities,
  (sidebarIds, entities) => {
    const groups = {
      main: [],
      management: [],
      others: [],
    };

    sidebarIds.forEach((id) => {
      const m = entities[id];
      if (!m) return;

      groups[m.group]?.push({
        id: m.id,
        name: m.name,
        path: m.path,
        icon: m.icon, // chỉ giữ string
      });
    });

    return groups;
  }
);

export const {
  selectAll: selectAllModules,
  selectById: selectModuleById,
  selectIds: selectModuleIds,
} = modulesAdapter.getSelectors((state) => state.modules);
export const selectAdminModules = (state) =>
  state.modules.lists.admin
    .map((id) => state.modules.entities[id])
    .filter(Boolean);
export const selectModuleOptions = createSelector(
  [selectAllModules],
  (modules) =>
    modules.map((m) => ({
      label: m.name,
      value: String(m.id || m._id),
    }))
);
export const selectModulesLoading = (state) => state.modules.loading;
export const selectAdminModulesLoading = (state) => state.modules.loading.admin;

export const selectSidebarModulesLoading = (state) =>
  state.modules.loading.sidebar;

export const selectToggleModuleLoading = (state) =>
  state.modules.loading.toggleActive;
