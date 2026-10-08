"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  useConversationMessages,
  useConversations,
  useDeleteConversationMessage,
  useMarkConversationRead,
  useSendConversationMessage,
  useUploadConversationFile,
} from "@/hooks/use-conversation";
import { useConversationSocketContext } from "./conversation-socket-context";
import { EmojiPicker } from "./emoji-picker";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/shadcn/avatar";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from "@repo/ui/components/shadcn/message";
import { Bubble, BubbleContent } from "@repo/ui/components/shadcn/bubble";
import { Marker, MarkerContent, MarkerIcon } from "@repo/ui/components/shadcn/marker";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { toastError } from "@repo/ui/components/shadcn/toast";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Paperclip,
  Send,
  Trash2,
} from "lucide-react";
import type {
  DirectMessageType,
  MessageAttachmentType,
} from "@shared/types";

// Giới hạn dung lượng file khi upload (khớp với backend)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function formatMessageTime(createdAt: string | Date): string {
  return new Date(createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(fileType: string | null): boolean {
  return Boolean(fileType && fileType.startsWith("image/"));
}

function isEmojiOnly(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Bỏ ZWJ / variation selector trước (tránh ghép chữ cái với emoji)
  const stripped = trimmed.replace(/\u200d/g, "").replace(/\ufe0f/g, "");
  if (!stripped) return true;
  // Chỉ chứa emoji (và khoảng trắng/#/*/+/số)
  return /^[\p{Extended_Pictographic}\p{Emoji_Component}\s#*+\d]+$/u.test(
    stripped,
  );
}

type ChatViewProps = {
  conversationId: number;
  currentUserId: number | null;
};

export function ChatView({ conversationId, currentUserId }: ChatViewProps) {
  const { socket, connected } = useConversationSocketContext();
  const { data: messages, isLoading } = useConversationMessages(conversationId);
  const { data: conversations } = useConversations();
  const restSend = useSendConversationMessage();
  const restMarkRead = useMarkConversationRead();
  const restDelete = useDeleteConversationMessage();
  const uploadFile = useUploadConversationFile();

  const [input, setInput] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const otherTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const typingStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const conversation = conversations?.find((c) => c.id === conversationId);
  const otherUser = conversation?.otherUser;

  // Đánh dấu đã đọc khi mở hội thoại (socket nếu có, fallback REST)
  useEffect(() => {
    if (!conversationId) return;
    if (socket && connected) {
      socket.emit("message:read", { conversationId });
    } else {
      restMarkRead.mutate(conversationId);
    }
  }, [socket, connected, conversationId, restMarkRead]);

  // Đánh dấu đã đọc khi nhận tin nhắn mới từ người kia
  useEffect(() => {
    if (!socket) return;

    const handler = (payload: {
      conversationId: number;
      message: DirectMessageType;
    }) => {
      if (
        payload.conversationId === conversationId &&
        payload.message.senderId !== currentUserId
      ) {
        socket.emit("message:read", { conversationId });
      }
    };

    socket.on("message:new", handler);
    return () => {
      socket.off("message:new", handler);
    };
  }, [socket, conversationId, currentUserId]);

  // Lắng nghe trạng thái "đang gõ" của đối phương
  useEffect(() => {
    if (!socket) return;

    setOtherTyping(false);
    if (otherTypingTimeoutRef.current) {
      clearTimeout(otherTypingTimeoutRef.current);
    }

    const handler = (payload: { conversationId: number; isTyping: boolean }) => {
      if (payload.conversationId !== conversationId) return;

      if (payload.isTyping) {
        setOtherTyping(true);
        // An toàn: tự ẩn nếu quá lâu không nhận typing:stop
        if (otherTypingTimeoutRef.current) {
          clearTimeout(otherTypingTimeoutRef.current);
        }
        otherTypingTimeoutRef.current = setTimeout(
          () => setOtherTyping(false),
          5000,
        );
      } else {
        setOtherTyping(false);
        if (otherTypingTimeoutRef.current) {
          clearTimeout(otherTypingTimeoutRef.current);
        }
      }
    };

    socket.on("typing", handler);
    return () => {
      socket.off("typing", handler);
      if (otherTypingTimeoutRef.current) {
        clearTimeout(otherTypingTimeoutRef.current);
      }
      if (typingStopTimeoutRef.current) {
        clearTimeout(typingStopTimeoutRef.current);
      }
    };
  }, [socket, conversationId]);

  // Tự cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (value: string) => {
    setInput(value);

    if (!socket || !socket.connected) return;

    // Báo "đang gõ" và dừng sau 1.5s không gõ
    socket.emit("typing", { conversationId, isTyping: true });
    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
    }
    typingStopTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { conversationId, isTyping: false });
    }, 1500);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (socket && socket.connected) {
      socket.emit("message:send", { conversationId, message: trimmed });
      socket.emit("typing", { conversationId, isTyping: false });
    } else {
      // Fallback khi socket chưa kết nối
      restSend.mutate({ conversationId, message: trimmed });
    }

    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
    }
    setInput("");
    setEmojiOpen(false);
  };

  // Gửi tin nhắn kèm file (sau khi đã upload thành công)
  const sendAttachmentMessage = (attachment: MessageAttachmentType) => {
    if (socket && socket.connected) {
      socket.emit("message:send", {
        conversationId,
        message: "",
        attachment,
      });
    } else {
      // Fallback khi socket chưa kết nối
      restSend.mutate({ conversationId, message: "", attachment });
    }
  };

  // Chọn file -> upload -> gửi tin nhắn kèm file
  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toastError({
        message: "File is too large. Maximum size is 25MB.",
      });
      return;
    }

    setUploading(true);
    uploadFile.mutate(
      { conversationId, file },
      {
        onSuccess: (attachment) => {
          sendAttachmentMessage(attachment);
        },
        onError: (error) => {
          toastError({
            message: error.message || "Failed to upload file",
          });
        },
        onSettled: () => setUploading(false),
      },
    );
  };

  const handleDeleteMessage = (messageId: number) => {
    if (socket && socket.connected) {
      socket.emit("message:delete", { conversationId, messageId });
    } else {
      // Fallback khi socket chưa kết nối
      restDelete.mutate({ conversationId, messageId });
    }
  };

  const displayName =
    otherUser?.profile?.displayName ?? `User #${otherUser?.id ?? ""}`;
  const avatarUrl = otherUser?.profile?.avatarUrl ?? undefined;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link
          href="/conversations"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <Avatar>
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{displayName}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Marker>
              <MarkerContent className="text-muted-foreground">
                No messages yet. Say hello!
              </MarkerContent>
            </Marker>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === currentUserId;
            const hasFile = Boolean(message.fileUrl);
            const bubbleClassName = isMine
              ? "*:data-[slot=bubble-content]:!bg-blue-600 *:data-[slot=bubble-content]:!text-white"
              : undefined;

            return (
              <Message key={message.id} align={isMine ? "end" : "start"}>
                {!isMine && (
                  <MessageAvatar>
                    <Avatar>
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback>
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </MessageAvatar>
                )}
                <MessageContent>
                  {hasFile ? (
                    <Bubble
                      variant={isMine ? "default" : "muted"}
                      className={bubbleClassName}
                    >
                      <BubbleContent className="whitespace-pre-wrap">
                        {isImageType(message.fileType) ? (
                          <a
                            href={message.fileUrl ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={message.fileUrl ?? ""}
                              alt={message.fileName ?? "Attachment"}
                              className="max-h-72 w-full max-w-xs rounded-lg object-cover"
                            />
                          </a>
                        ) : (
                          <a
                            href={message.fileUrl ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                              <FileText className="h-5 w-5" />
                            </span>
                            <span className="min-w-0">
                              <span className="block max-w-[180px] truncate text-sm font-medium">
                                {message.fileName ?? "Attachment"}
                              </span>
                              <span className="block text-xs opacity-70">
                                {formatFileSize(message.fileSize)}
                              </span>
                            </span>
                            <Download className="h-4 w-4 shrink-0" />
                          </a>
                        )}
                        {message.message && (
                          <p className="whitespace-pre-wrap">{message.message}</p>
                        )}
                      </BubbleContent>
                    </Bubble>
                  ) : isEmojiOnly(message.message) ? (
                    <span
                      className={`select-none whitespace-pre-wrap text-4xl leading-none ${
                        isMine ? "self-end" : "self-start"
                      }`}
                    >
                      {message.message.trim()}
                    </span>
                  ) : (
                    <Bubble
                      variant={isMine ? "default" : "muted"}
                      className={bubbleClassName}
                    >
                      <BubbleContent className="whitespace-pre-wrap">
                        {message.message}
                      </BubbleContent>
                    </Bubble>
                  )}
                  <MessageFooter>
                    {formatMessageTime(message.createdAt)}
                    {isMine && (message.isRead ? " · Read" : " · Sent")}
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(message.id)}
                        aria-label="Delete message"
                        className="ml-1 rounded-md p-1 text-muted-foreground/60 opacity-0 transition-opacity outline-none hover:bg-muted hover:text-destructive focus-visible:opacity-100 group-hover/message:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </MessageFooter>
                </MessageContent>
              </Message>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Typing indicator */}
      {otherTyping && (
        <div className="flex px-4 pb-2">
          <Marker role="status">
            <MarkerIcon>
              <Loader2 className="animate-spin" />
            </MarkerIcon>
            <MarkerContent className="shimmer">
              <span className="font-medium">{displayName}</span> is typing...
            </MarkerContent>
          </Marker>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey)
              ) {
                setEmojiOpen(false);
              }
            }}
            className="flex-1"
          />
          {/* Upload file để gửi kèm tin nhắn */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.ico,.tiff,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.js,.json,.xml,.zip,.gz,.7z,.rar,.tar"
            onChange={(e) => {
              handleFileSelect(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
            <span className="sr-only">Attach file</span>
          </Button>
          <EmojiPicker
            open={emojiOpen}
            onOpenChange={setEmojiOpen}
            onSelect={(emoji) => setInput((value) => value + emoji)}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            className="shrink-0 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-600/50 disabled:text-white"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
