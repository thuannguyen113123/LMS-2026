import React, { useMemo, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import DateDivider from "./DateDivider";
import ChatMessageItem from "./ChatMessageItem";

import {
  makeSelectRoomMessages,
  selectRoomPagination,
  selectRoomLoading,
} from "../../features/chat/messagesSlice";

import { fetchRoomMessages } from "../../features/chat/messagesThunks";

const ChatMessages = ({
  roomId,
  user,
  setReplyingTo,
  recallMessage,
  reactMessage,
  unreactMessage,
  bottomRef,
  isBlocked,
}) => {
  const dispatch = useDispatch();
  const loadingMoreRef = useRef(false);
  const messages = useSelector(makeSelectRoomMessages(roomId));
  const pagination = useSelector(selectRoomPagination(roomId));
  const loading = useSelector(selectRoomLoading(roomId));

  const typingUsers = useSelector(
    (state) => state.messages.lists.typingUsers?.[roomId]
  );

  const scrollRef = useRef(null);
  const previousHeight = useRef(0);

  const groupedMessages = useMemo(() => {
    const groups = {};

    messages.forEach((msg) => {
      const day = new Date(msg.createdAt).toDateString();
      if (!groups[day]) groups[day] = [];
      groups[day].push(msg);
    });

    return groups;
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading) return;

    if (el.scrollTop <= 20 && pagination?.hasNext && !loadingMoreRef.current) {
      loadingMoreRef.current = true;

      previousHeight.current = el.scrollHeight;

      dispatch(
        fetchRoomMessages({
          roomId,
          cursor: pagination.nextCursor,
          isLoadMore: true,
        })
      );
    }
  }, [dispatch, pagination, loading, roomId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (previousHeight.current > 0) {
      const newHeight = el.scrollHeight;
      el.scrollTop = newHeight - previousHeight.current;
      previousHeight.current = 0;
      loadingMoreRef.current = false;
    }
  }, [messages.length]);

  return (
    <section
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-3 md:p-6 space-y-4"
    >
      {/*  LOADING TOP */}
      {loading && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {Object.entries(groupedMessages).map(([day, msgs]) => (
        <div key={day}>
          <DateDivider label={day} />

          {msgs.map((msg) => (
            <ChatMessageItem
              key={msg.clientTempId ?? msg.id}
              msg={msg}
              user={user}
              setReplyingTo={setReplyingTo}
              recallMessage={recallMessage}
              reactMessage={reactMessage}
              unreactMessage={unreactMessage}
            />
          ))}
        </div>
      ))}

      {typingUsers && Object.keys(typingUsers).length > 0 && (
        <div className="text-sm text-gray-400 italic px-2">
          {Object.values(typingUsers).join(", ")} đang nhập...
        </div>
      )}
      {isBlocked && (
        <div className="flex justify-center my-3">
          <div className="px-4 py-2 text-xs text-gray-500 bg-gray-100 rounded-full">
            You cannot reply to this conversation
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </section>
  );
};

export default ChatMessages;
