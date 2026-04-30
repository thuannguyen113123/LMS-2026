import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  selectSuggestions,
  selectSuggestionsLoading,
} from "../../features/chat/chatSuggestionsSlice";
import { fetchSuggestions } from "../../features/chat/chatSuggestionsThunks";
import { selectUserChatRooms } from "../../features/chat/chatRoomsSlice";

import ChatUserSuggestion from "./ChatUserSuggestion";

const ChatSuggestions = () => {
  const dispatch = useDispatch();

  const users = useSelector(selectSuggestions);
  const rooms = useSelector(selectUserChatRooms);
  const loading = useSelector(selectSuggestionsLoading);

  // filter users already chatting
  const filteredUsers = users.filter(
    (u) => !rooms.some((r) => r.otherUser?.id === u.id)
  );

  useEffect(() => {
    if (!users.length) {
      dispatch(fetchSuggestions());
    }
  }, [dispatch, users.length]);

  if (loading) {
    return (
      <div className="text-center text-sm text-gray-400 py-6">
        Loading suggestions...
      </div>
    );
  }

  if (!filteredUsers.length) {
    return (
      <div className="text-center text-sm text-gray-400 py-6">
        No suggestions
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {filteredUsers.map((u) => (
        <ChatUserSuggestion key={u.id} user={u} />
      ))}
    </ul>
  );
};

export default React.memo(ChatSuggestions);
