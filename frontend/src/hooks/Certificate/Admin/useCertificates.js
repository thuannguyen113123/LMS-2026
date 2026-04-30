import { useDispatch, useSelector } from "react-redux";
import {
  selectAdminCertificates,
  selectAdminCertificatesLoading,
} from "../../../features/certificate/certificateSlice";
import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import useDebounce from "../../useDebounce";
import {
  fetchCertificates,
  revokeCertificate,
} from "../../../features/certificate/certificateThunks";
import useModal from "../../useModal";

const useCertificates = () => {
  const dispatch = useDispatch();

  const [pendingRevokeIds, setPendingRevokeIds] = useState([]);
  const [recentlyRevoked, setRecentlyRevoked] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);

  /** ================= REDUX ================= */

  const { errorCode, paginationAdmin } = useSelector(
    (state) => state.certificates
  );
  const adminLoading = useSelector(selectAdminCertificatesLoading);

  const certificates = useSelector(selectAdminCertificates);

  const { totalPages } = paginationAdmin;

  /** ================= URL PARAMS ================= */

  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);
  const search = params.get("search") || "";
  const status = params.get("status") || "All";

  const confirmRevokeModal = useModal("confirmRevoke");

  /** ================= FILTER ================= */

  const filters = useMemo(
    () => ({
      status,
    }),
    [status]
  );

  const setFilters = useCallback(
    (nextFilters) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        Object.entries(nextFilters).forEach(([key, value]) => {
          if (value && value !== "All") next.set(key, value);
          else next.delete(key);
        });

        next.set("page", 1);

        return next;
      });
    },
    [setParams]
  );

  const setSearch = useCallback(
    (value) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        if (value) next.set("search", value);
        else next.delete("search");

        next.set("page", 1);

        return next;
      });
    },
    [setParams]
  );

  const debouncedSearch = useDebounce(search, 500);

  /** ================= FETCH ================= */

  useEffect(() => {
    dispatch(
      fetchCertificates({
        page,
        limit,
        filters,
        search: debouncedSearch,
      })
    );
  }, [dispatch, page, limit, filters, debouncedSearch]);

  /** ================= PAGINATION ================= */

  const handleNext = useCallback(() => {
    if (page >= totalPages) return;

    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", page + 1);
      return next;
    });
  }, [page, totalPages, setParams]);

  const handlePrev = useCallback(() => {
    if (page <= 1) return;

    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", page - 1);
      return next;
    });
  }, [page, setParams]);

  const handlePageChange = useCallback(
    (p) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", p);
        return next;
      });
    },
    [setParams]
  );

  const openConfirmRevoke = useCallback(
    (id) => {
      setPendingRevokeIds([id]);
      confirmRevokeModal.open();
    },
    [confirmRevokeModal]
  );
  const confirmRevoke = useCallback(() => {
    if (!pendingRevokeIds.length) return;

    const revokedItems = certificates.filter((c) =>
      pendingRevokeIds.includes(c.id)
    );

    // optimistic UI
    setRecentlyRevoked(revokedItems);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(revokeCertificate(pendingRevokeIds));
      setRecentlyRevoked([]);
    }, 5000);

    setUndoTimer(timer);
    setPendingRevokeIds([]);
    confirmRevokeModal.close();
  }, [pendingRevokeIds, certificates, dispatch, undoTimer, confirmRevokeModal]);

  const handleUndoRevoke = useCallback(() => {
    if (undoTimer) clearTimeout(undoTimer);
    setRecentlyRevoked([]);
  }, [undoTimer]);

  const canRevoke = useCallback((certificate) => {
    return certificate.status === "issued";
  }, []);

  /** ================= TABLE COLUMNS ================= */

  const columns = useMemo(
    () => [
      {
        key: "certificateNumber",
        header: "Certificate No",
        path: "certificateNumber",
      },
      {
        key: "course",
        header: "Course",
        render: (c) => c.course?.title,
      },
      {
        key: "status",
        header: "Status",
        path: "status",
        type: "badge",
      },
      {
        key: "issuedAt",
        header: "Issued At",
        render: (c) => new Date(c.issuedAt).toLocaleDateString("vi-VN"),
      },
    ],
    []
  );

  /** ================= DERIVED ================= */

  const isEmpty = useMemo(
    () => !adminLoading && certificates.length === 0,
    [adminLoading, certificates.length]
  );

  const statusOptions = [
    { label: "Tất cả", value: "All" },
    { label: "Issued", value: "issued" },
    { label: "Pending", value: "pending" },
    { label: "Revoked", value: "revoked" },
  ];

  /** ================= RETURN ================= */

  return {
    certificates,
    columns,

    loading: adminLoading,
    errorCode,
    isEmpty,

    page,
    totalPages,

    hasNext: page < totalPages,
    hasPrev: page > 1,

    handleNext,
    handlePrev,
    handlePageChange,

    search,
    setSearch,

    filters,
    setFilters,
    statusOptions,

    openConfirmRevoke,
    confirmRevoke,
    confirmRevokeModal,
    recentlyRevoked,
    handleUndoRevoke,
    canRevoke,
  };
};

export default useCertificates;
