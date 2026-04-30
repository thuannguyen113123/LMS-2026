import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  fetchCertificates,
  fetchMyCertificates,
  issueCertificate,
  revokeCertificate,
} from "./certificateThunks";

const certificatesAdapter = createEntityAdapter({
  selectId: (c) => c.id,
});

const initialState = certificatesAdapter.getInitialState({
  lists: {
    admin: [],
    mine: [],
  },

  paginationAdmin: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  isOpen: false,
  certificates: [],
  loading: {
    admin: false,
    mine: false,
    issue: false,
    revoke: false,
  },
  errorCode: null,
  lastActionCode: null,
});

const certificatesSlice = createSlice({
  name: "certificates",
  initialState,
  reducers: {
    resetAdminPagination(state) {
      state.paginationAdmin = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
    },
    showCertificateCelebration(state, action) {
      const certs = action.payload;

      certificatesAdapter.upsertMany(state, certs);

      state.isOpen = true;
      state.certificates = certs.map((c) => c.id);
    },
    closeCertificateCelebration(state) {
      state.isOpen = false;
      state.certificates = [];
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchCertificates.pending, (state) => {
        state.loading.admin = true;
        state.errorCode = null;
      })
      .addCase(fetchCertificates.fulfilled, (state, action) => {
        state.loading.admin = false;
        const { certificates, pagination } = action.payload;

        certificatesAdapter.upsertMany(state, certificates);
        state.lists.admin = certificates.map((c) => c.id);
        state.paginationAdmin = pagination;
      })
      .addCase(fetchCertificates.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(fetchMyCertificates.pending, (state) => {
        state.loading.mine = true;
        state.errorCode = null;
      })

      .addCase(fetchMyCertificates.fulfilled, (state, action) => {
        state.loading.mine = false;

        const certificates = action.payload;

        // ✅ cache entities (shared DB)
        certificatesAdapter.upsertMany(state, certificates);

        // ✅ riêng list modal
        state.lists.mine = certificates.map((c) => c.id);
      })

      .addCase(fetchMyCertificates.rejected, (state, action) => {
        state.loading.mine = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(issueCertificate.pending, (state) => {
        state.loading.issue = true;
        state.errorCode = null;
      })

      .addCase(issueCertificate.fulfilled, (state, action) => {
        state.loading.issue = false;

        const certificate = action.payload.certificate;

        certificatesAdapter.addOne(state, certificate);

        if (!state.lists.admin.includes(certificate.id)) {
          state.lists.admin.unshift(certificate.id);
        }

        state.lastActionCode = action.payload.code;
      })

      .addCase(issueCertificate.rejected, (state, action) => {
        state.loading.issue = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(revokeCertificate.pending, (state) => {
        state.loading.revoke = true;
        state.errorCode = null;
      })

      .addCase(revokeCertificate.fulfilled, (state, action) => {
        state.loading.revoke = false;

        const certificate = action.payload.certificate;

        // ✅ update entity (NO refetch)
        certificatesAdapter.upsertOne(state, certificate);

        state.lastActionCode = action.payload.code;
      })

      .addCase(revokeCertificate.rejected, (state, action) => {
        state.loading.revoke = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export const {
  resetAdminPagination,
  showCertificateCelebration,
  closeCertificateCelebration,
} = certificatesSlice.actions;
export default certificatesSlice.reducer;

export const {
  selectAll: selectAllCertificates,
  selectById: selectCertificateById,
  selectIds: selectCertificateIds,
} = certificatesAdapter.getSelectors((state) => state.certificates);

export const selectAdminCertificates = createSelector(
  [
    (state) => state.certificates.lists.admin,
    (state) => state.certificates.entities,
  ],
  (ids, entities) => ids.map((id) => entities[id]).filter(Boolean)
);

export const selectMyCertificates = createSelector(
  [
    (state) => state.certificates.lists.mine,
    (state) => state.certificates.entities,
  ],
  (ids, entities) => ids.map((id) => entities[id]).filter(Boolean)
);
export const selectCertificateLoading = (state) => state.certificates.loading;
export const selectAdminCertificatesLoading = (state) =>
  state.certificates.loading.admin;

export const selectMyCertificatesLoading = (state) =>
  state.certificates.loading.mine;

export const selectIssueCertificateLoading = (state) =>
  state.certificates.loading.issue;

export const selectRevokeCertificateLoading = (state) =>
  state.certificates.loading.revoke;
