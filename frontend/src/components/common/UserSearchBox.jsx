import React, { useMemo, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearSearchResults,
  selectSearchResults,
} from "../../features/users/usersSlice";

import useDebounce from "../../hooks/useDebounce";
import { searchUsersForRoom } from "../../features/users/usersThunks";

export default function UserSearchBox({ excludeIds = [], onSelect }) {
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const debounced = useDebounce(query, 400);
  const results = useSelector(selectSearchResults);
  const ref = useRef();

  const searchLoading = useSelector((state) => state.users.searchLoading);
  const pagination = useSelector((state) => state.users.searchPagination);

  const stableExcludeIds = useMemo(
    () => excludeIds,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [excludeIds.join(",")]
  );

  useEffect(() => {
    const trimmed = debounced.trim();

    if (trimmed.length >= 2) {
      dispatch(
        searchUsersForRoom({
          query: trimmed,
          excludeIds: stableExcludeIds,
          limit: 10,
          startAfterId: null,
          isNextPage: false,
        })
      );
    } else {
      dispatch(clearSearchResults());
    }
  }, [debounced, stableExcludeIds, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLoadMore = () => {
    if (!pagination?.nextStartAfterId) return;

    dispatch(
      searchUsersForRoom({
        query: debounced.trim(),
        excludeIds: stableExcludeIds,
        limit: 10,
        startAfterId: pagination.nextStartAfterId,
        isNextPage: true,
      })
    );
  };

  return (
    <div className="relative" ref={ref}>
      <input
        value={query}
        onFocus={() => setShowMenu(true)}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nhập tên hoặc email..."
        className="border rounded-md w-full px-3 py-2 text-sm"
      />
      {showMenu && (
        <div className="absolute bg-white border rounded-md mt-2 shadow max-h-64 overflow-y-auto w-full z-10">
          {searchLoading && (
            <div className="px-3 py-2 text-sm text-gray-500">Đang tìm...</div>
          )}

          {!searchLoading && results.length === 0 && query.length >= 2 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Không tìm thấy người dùng
            </div>
          )}

          {!searchLoading &&
            results.map((u) => (
              <div
                key={u.id}
                onClick={() => {
                  onSelect(u);
                  setQuery(u.fullname);
                  setShowMenu(false);
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              >
                <img
                  src={u.avatar || "https://via.placeholder.com/40"}
                  alt={u.fullname}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="text-sm font-semibold">{u.fullname}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
              </div>
            ))}
        </div>
      )}

      {pagination?.hasMore && !searchLoading && (
        <div
          onClick={handleLoadMore}
          className="px-3 py-2 text-sm text-blue-600 cursor-pointer hover:bg-gray-100"
        >
          Tải thêm...
        </div>
      )}
    </div>
  );
}
