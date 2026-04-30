import React from "react";
import { MessageCircle } from "lucide-react";

const ChatEmpty = () => {
  return (
    <main className="flex flex-1 items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
        {/* ICON */}
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-muted">
          <MessageCircle size={28} className="opacity-70" />
        </div>

        {/* TITLE */}
        <h2 className="text-xl font-semibold text-primary">
          Chưa có cuộc trò chuyện nào được chọn
        </h2>

        {/* DESCRIPTION */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          Hãy chọn một cuộc trò chuyện ở bên trái hoặc bắt đầu cuộc trò chuyện
          mới để gửi tin nhắn.
        </p>
      </div>
    </main>
  );
};

export default ChatEmpty;
