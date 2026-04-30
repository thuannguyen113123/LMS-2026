import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";

import { fetchUserChatRooms } from "../../../features/chat/chatRoomsThunks";
import { selectUserChatRooms } from "../../../features/chat/chatRoomsSlice";
import { selectChatUnreadByRoom } from "../../../features/chat/chatNotificationsSlice";
import { searchUsersForRoom } from "../../../features/users/usersThunks";

export default function useChatRoomsPublic() {
  const dispatch = useDispatch();

  const rooms = useSelector(selectUserChatRooms);
  const unreadByRoom = useSelector(selectChatUnreadByRoom);
  const loading = useSelector((state) => state.chatRooms.loading.user);
  const pagination = useSelector((state) => state.chatRooms.paginationUser);
  const searchResults = useSelector((state) => state.users.searchResults);

  const searchLoading = useSelector((state) => state.users.searchLoading);

  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(
      fetchUserChatRooms({
        cursor: null,
        limit: 20,
      })
    );
  }, [dispatch, search]);

  useEffect(() => {
    if (!search.trim()) return;

    dispatch(
      searchUsersForRoom({
        query: search,
        limit: 10,
      })
    );
  }, [search, dispatch]);

  /*
  ========================
  UNREAD MAP ✅ FIX
  ========================
  */

  // chatNotificationsSlice đã là map sẵn rồi
  const unreadMap = useMemo(() => {
    return unreadByRoom || {};
  }, [unreadByRoom]);

  /*
  ========================
  SORT ROOMS
  ========================
  */

  const sortedRooms = useMemo(() => {
    if (!rooms?.length) return [];

    return [...rooms].sort((a, b) => {
      const idA = a.id || a._id;
      const idB = b.id || b._id;

      const unreadA = unreadMap[idA] || 0;
      const unreadB = unreadMap[idB] || 0;

      // ưu tiên room có unread
      if (unreadB !== unreadA) return unreadB - unreadA;

      // priorityScore
      if ((b.priorityScore || 0) !== (a.priorityScore || 0)) {
        return (b.priorityScore || 0) - (a.priorityScore || 0);
      }

      // last message
      return (
        new Date(b.lastMessage?.createdAt || 0) -
        new Date(a.lastMessage?.createdAt || 0)
      );
    });
  }, [rooms, unreadMap]);

  /*
  ========================
  LOAD MORE
  ========================
  */
  const mergedList = useMemo(() => {
    if (!search) {
      return sortedRooms.map((room) => ({
        type: "room",
        data: room,
      }));
    }

    const roomUserIds = new Set(sortedRooms.map((r) => r.otherUser?.id));

    const roomItems = sortedRooms.map((room) => ({
      type: "room",
      data: room,
    }));

    const userItems = searchResults
      .filter((u) => !roomUserIds.has(u.id))
      .map((user) => ({
        type: "user",
        data: user,
      }));

    return [...roomItems, ...userItems];
  }, [search, sortedRooms, searchResults]);

  const loadMore = useCallback(() => {
    if (!pagination?.hasNext) return;

    dispatch(
      fetchUserChatRooms({
        cursor: pagination.nextCursor,
        limit: 20,
        isLoadMore: true,
      })
    );
  }, [dispatch, pagination]);

  return {
    list: mergedList,
    loading: loading || searchLoading,
    search,
    setSearch,
    unreadMap,
    rooms: sortedRooms,
    loadMore,
    hasNext: pagination?.hasNext,
  };
}
