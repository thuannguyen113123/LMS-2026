import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect } from "react";

import {
  fetchRoomMembers,
  fetchRoomStats,
  addMemberToRoom,
  removeMemberFromRoom,
  banUserFromRoom,
  muteUserInRoom,
  setAdminsInRoom,
} from "../../../features/chat/chatRoomsThunks";
import useModal from "../../useModal";

export default function useChatRoomInfo(roomId) {
  const dispatch = useDispatch();

  const membersModal = useModal("roomMembers");

  const membersByRoom = useSelector((s) => s.chatRooms.membersByRoom);
  const statsByRoom = useSelector((s) => s.chatRooms.roomStatsByRoom);

  const members = membersByRoom[roomId] || [];
  const stats = statsByRoom[roomId] || null;

  useEffect(() => {
    if (!roomId) return;

    dispatch(fetchRoomStats({ roomId }));
  }, [roomId, dispatch]);

  const openMembersModal = useCallback(async () => {
    if (!roomId) return;

    await dispatch(fetchRoomMembers({ roomId })).unwrap();
    dispatch(fetchRoomStats({ roomId }));

    membersModal.open();
  }, [dispatch, membersModal, roomId]);

  const addMember = useCallback(
    async (userId) => {
      await dispatch(addMemberToRoom({ roomId, userId })).unwrap();
      dispatch(fetchRoomMembers({ roomId }));
    },
    [dispatch, roomId]
  );

  const removeMember = useCallback(
    async (userId) => {
      await dispatch(removeMemberFromRoom({ roomId, userId })).unwrap();
      dispatch(fetchRoomMembers({ roomId }));
    },
    [dispatch, roomId]
  );

  const banUser = useCallback(
    async (userId) => {
      await dispatch(banUserFromRoom({ roomId, userId })).unwrap();
      dispatch(fetchRoomMembers({ roomId }));
    },
    [dispatch, roomId]
  );

  const muteUser = useCallback(
    async (userId) => {
      await dispatch(muteUserInRoom({ roomId, userId })).unwrap();
      dispatch(fetchRoomMembers({ roomId }));
    },
    [dispatch, roomId]
  );

  const setAdmin = useCallback(
    async (userId) => {
      const current = members.filter((m) => m.isAdmin).map((m) => m.id);

      const newAdmins = current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId];

      await dispatch(
        setAdminsInRoom({
          roomId,
          adminIds: newAdmins,
        })
      ).unwrap();

      dispatch(fetchRoomMembers({ roomId }));
    },
    [dispatch, roomId, members]
  );

  return {
    roomId,

    members,
    stats,

    membersModal,
    openMembersModal,

    addMember,
    removeMember,
    banUser,
    muteUser,
    setAdmin,
  };
}
