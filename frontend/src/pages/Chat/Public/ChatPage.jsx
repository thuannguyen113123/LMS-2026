import React, { useRef } from "react";
import { useDispatch } from "react-redux";

import ChatSidebar from "../../../components/chat/ChatSidebar";
import ChatHeader from "../../../components/chat/ChatHeader";
import ChatMessages from "../../../components/chat/ChatMessages";
import ChatInput from "../../../components/chat/ChatInput";
import ChatRightSidebar from "../../../components/chat/ChatRightSidebar";
import { setActiveRoom } from "../../../features/chat/messagesSlice";
import useChatRoom from "../../../hooks/Chat/Public/useChatRoom";
import useChatRoomInfo from "../../../hooks/Chat/Public/useChatRoomInfo";
import ChatEmpty from "../../../components/chat/ChatEmpty";
import EmptyHeader from "../../../components/chat/EmptyHeader";

const ChatPage = () => {
  const dispatch = useDispatch();
  const chat = useChatRoom();

  const members = useChatRoomInfo(chat.currentRoomId);

  const bottomRef = useRef(null);

  if (!chat.currentRoomId) {
    return (
      <div className="flex h-dvh w-full overflow-hidden text-primary">
        {chat.showSidebar && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="w-[85%] max-w-[340px] bg-white shadow-xl">
              <ChatSidebar
                selectedRoomId={null}
                onSelectRoom={(room) => {
                  dispatch(setActiveRoom(room));
                  chat.setShowSidebar(false);
                }}
              />
            </div>

            <div
              className="flex-1 bg-black/40"
              onClick={() => chat.setShowSidebar(false)}
            />
          </div>
        )}

        <div className="hidden md:flex md:w-64">
          <ChatSidebar
            selectedRoomId={null}
            onSelectRoom={(room) => dispatch(setActiveRoom(room))}
          />
        </div>

        {/* MAIN */}
        <div className="flex flex-col flex-1">
          <EmptyHeader onOpenSidebar={() => chat.setShowSidebar(true)} />
          <div className="flex-1 flex items-center justify-center">
            <ChatEmpty />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden text-primary">
      {chat.showSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => chat.setShowSidebar(false)}
          />

          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-white shadow-xl flex flex-col">
            <ChatSidebar
              selectedRoomId={chat.currentRoomId}
              onSelectRoom={(room) => {
                dispatch(setActiveRoom(room));
                chat.setShowSidebar(false);
              }}
            />
          </div>
        </div>
      )}
      {/* SIDEBAR */}
      <div className="hidden md:flex md:w-[220px] lg:w-[260px] xl:w-[300px] shrink-0">
        <ChatSidebar
          selectedRoomId={chat.currentRoomId}
          onSelectRoom={(room) => dispatch(setActiveRoom(room))}
        />
      </div>

      {/* MAIN */}
      <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <ChatHeader
          selectedRoom={chat.selectedRoom}
          onBlock={chat.blockUserAction}
          onUnblock={chat.unblockUserAction}
          onOpenSidebar={() => chat.setShowSidebar(true)}
          onOpenRightSidebar={() => chat.setShowRightSidebar(true)}
        />

        <ChatMessages
          roomId={chat.currentRoomId}
          user={chat.user}
          setReplyingTo={chat.setReplyingTo}
          recallMessage={chat.recallMessage}
          reactMessage={chat.reactMessage}
          unreactMessage={chat.unreactMessage}
          bottomRef={bottomRef}
          isBlocked={chat.isBlocked}
        />

        <ChatInput
          message={chat.message}
          setMessage={chat.setMessage}
          isBlocked={chat.isBlocked}
          blockedBy={chat.blockedBy}
          replyingTo={chat.replyingTo}
          setReplyingTo={chat.setReplyingTo}
          onSend={chat.send}
          onSendFile={chat.sendFile}
          currentRoomId={chat.currentRoomId}
          user={chat.user}
          handleTyping={chat.handleTyping}
        />
      </main>

      {chat.showRightSidebar && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 md:hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Click backdrop đóng overlay */}
          <div
            className="fixed inset-0"
            onClick={() => chat.setShowRightSidebar(false)}
            aria-hidden="true"
          />
          {/* Panel Right Sidebar */}
          <aside className="relative w-full max-w-xs bg-white shadow-xl overflow-y-auto">
            {/* Nút đóng */}
            <button
              onClick={() => chat.setShowRightSidebar(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200"
              aria-label="Close room info"
            >
              ✕
            </button>

            <ChatRightSidebar selectedRoom={chat.selectedRoom} {...members} />
          </aside>
        </div>
      )}
      {/* RIGHT SIDEBAR */}
      <div className="hidden xl:flex xl:w-[280px] 2xl:w-[320px] shrink-0">
        <ChatRightSidebar selectedRoom={chat.selectedRoom} {...members} />
      </div>
    </div>
  );
};

export default ChatPage;
