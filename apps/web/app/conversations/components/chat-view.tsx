"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { toastError } from "@repo/ui/components/shadcn/toast";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Download,
  FileText,
  Loader2,
  Paperclip,
  Send,
  Trash2,
  UserRound,
} from "@/components/icons";
import type {
  DirectMessageType,
  MessageAttachmentType,
} from "@shared/types";

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
  const stripped = trimmed.replace(/\u200d/g, "").replace(/\ufe0f/g, "");
  if (!stripped) return true;
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

  useEffect(() => {
    if (!conversationId) return;
    if (socket && connected) {
      socket.emit("message:read", { conversationId });
    } else {
      restMarkRead.mutate(conversationId);
    }
  }, [socket, connected, conversationId, restMarkRead]);

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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (value: string) => {
    setInput(value);

    if (!socket || !socket.connected) return;

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
      restSend.mutate({ conversationId, message: trimmed });
    }

    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
    }
    setInput("");
    setEmojiOpen(false);
  };

  const sendAttachmentMessage = (attachment: MessageAttachmentType) => {
    if (socket && socket.connected) {
      socket.emit("message:send", {
        conversationId,
        message: "",
        attachment,
      });
    } else {
      restSend.mutate({ conversationId, message: "", attachment });
    }
  };

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
      restDelete.mutate({ conversationId, messageId });
    }
  };

  const pathname = usePathname();
  const basePath = pathname.startsWith("/client/conversations")
    ? "/client/conversations"
    : "/conversations";

  const displayName =
    otherUser?.profile?.displayName ?? `User #${otherUser?.id ?? ""}`;
  const avatarUrl = otherUser?.profile?.avatarUrl ?? undefined;

  return (
    <div className="flex h-full flex-col bg-background font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background/80 backdrop-blur px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={basePath}
            className="flex size-8 items-center justify-center rounded-full bg-[#F1F0F5] dark:bg-zinc-800 text-muted-foreground hover:text-foreground md:hidden shrink-0 cursor-pointer"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <Avatar className="size-10 shrink-0">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-muted text-xs font-bold text-foreground">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-foreground font-sans">
              {displayName}
            </h3>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-normal">
              <span className="inline-block size-1.5 rounded-full bg-[#0069D3]" />
              Active
            </p>
          </div>
        </div>

        {otherUser?.id ? (
          <Link
            href={`/profiles/${otherUser.id}`}
            className="rounded-full bg-[#F1F0F5] hover:bg-[#EAE9F0] dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors flex items-center gap-1.5 shrink-0"
          >
            <UserRound className="size-3.5 text-muted-foreground" />
            <span>Profile</span>
          </Link>
        ) : null}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center px-4 py-8">
            <div className="w-full max-w-md space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex ${
                    i % 2 === 0 ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`flex items-end gap-2 ${
                      i % 2 === 0 ? "" : "flex-row-reverse"
                    }`}
                  >
                    {i % 2 === 0 && (
                      <Skeleton className="size-8 shrink-0 rounded-full" />
                    )}
                    <div className="space-y-1">
                      <Skeleton
                        className={`h-9 rounded-2xl ${
                          i % 2 === 0 ? "w-44" : "w-36"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="size-12 rounded-full bg-[#F1F0F5] dark:bg-zinc-800 flex items-center justify-center mb-2">
              <Avatar className="size-10">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-transparent text-xs font-bold text-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <p className="text-sm font-semibold text-foreground font-sans">
              Say hello to {displayName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground max-w-xs">
              This is the start of your message history together.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === currentUserId;
            const hasFile = Boolean(message.fileUrl);

            return (
              <div
                key={message.id}
                className={`group flex items-end gap-2 ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                {!isMine && (
                  <Avatar className="size-7 shrink-0 mb-1">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-muted text-[10px] font-bold text-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col max-w-[82%] sm:max-w-[70%] ${
                    isMine ? "items-end" : "items-start"
                  }`}
                >
                  {hasFile ? (
                    <div
                      className={`overflow-hidden transition-all ${
                        isMine
                          ? "rounded-[20px] rounded-br-[4px] bg-[#0069D3] text-white p-2.5 shadow-xs"
                          : "rounded-[20px] rounded-bl-[4px] bg-[#F1F0F5] dark:bg-zinc-800 text-foreground p-2.5 shadow-xs"
                      }`}
                    >
                      {isImageType(message.fileType) ? (
                        <a
                          href={message.fileUrl ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-xl"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={message.fileUrl ?? ""}
                            alt={message.fileName ?? "Attachment"}
                            className="max-h-72 w-full object-cover transition-transform hover:scale-105"
                          />
                        </a>
                      ) : (
                        <a
                          href={message.fileUrl ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-3 rounded-xl p-2 transition-colors ${
                            isMine
                              ? "bg-white/10 hover:bg-white/20 text-white"
                              : "bg-background/80 hover:bg-background text-foreground"
                          }`}
                        >
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                              isMine ? "bg-white/20" : "bg-muted"
                            }`}
                          >
                            <FileText className="size-4" />
                          </span>
                          <span className="min-w-0 pr-2">
                            <span className="block max-w-[180px] truncate text-xs font-semibold">
                              {message.fileName ?? "Attachment"}
                            </span>
                            <span className="block text-[10px] opacity-75">
                              {formatFileSize(message.fileSize)}
                            </span>
                          </span>
                          <Download className="size-4 shrink-0 opacity-80" />
                        </a>
                      )}
                      {message.message ? (
                        <p className="mt-2 text-xs leading-relaxed whitespace-pre-wrap px-1">
                          {message.message}
                        </p>
                      ) : null}
                    </div>
                  ) : isEmojiOnly(message.message) ? (
                    <span className="select-none text-4xl leading-none py-1">
                      {message.message.trim()}
                    </span>
                  ) : (
                    <div
                      className={`px-4 py-2.5 text-xs sm:text-sm font-sans leading-relaxed shadow-xs transition-all ${
                        isMine
                          ? "rounded-[22px] rounded-br-[4px] bg-[#0069D3] text-white"
                          : "rounded-[22px] rounded-bl-[4px] bg-[#F1F0F5] dark:bg-zinc-800 text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.message}</p>
                    </div>
                  )}

                  {/* Message timestamp & status footer */}
                  <div
                    className={`mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground px-1 ${
                      isMine ? "flex-row-reverse" : ""
                    }`}
                  >
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {isMine && (
                      <span className="inline-flex items-center gap-0.5">
                        {message.isRead ? (
                          <CheckCheck className="size-3 text-[#0069D3]" />
                        ) : (
                          <Check className="size-3 text-muted-foreground/60" />
                        )}
                      </span>
                    )}
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(message.id)}
                        aria-label="Delete message"
                        className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-red-500 cursor-pointer ml-1"
                        title="Delete message"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Typing indicator */}
      {otherTyping && (
        <div className="flex items-center gap-2 px-4 sm:px-6 py-1">
          <div className="flex items-center gap-1.5 rounded-full bg-[#F1F0F5] dark:bg-zinc-800 px-3.5 py-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{displayName}</span> is typing
            <span className="flex items-center gap-0.5 ml-1">
              <span className="size-1 rounded-full bg-[#0069D3] animate-bounce" />
              <span className="size-1 rounded-full bg-[#0069D3] animate-bounce [animation-delay:0.2s]" />
              <span className="size-1 rounded-full bg-[#0069D3] animate-bounce [animation-delay:0.4s]" />
            </span>
          </div>
        </div>
      )}

      {/* Modern Capsule Input Bar */}
      <div className="border-t border-border bg-background/95 backdrop-blur p-3 sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 rounded-full border border-black/5 dark:border-white/10 bg-[#F3F3F7] dark:bg-zinc-800/80 px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#0069D3]/30 transition-all"
        >
          {/* File upload button */}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer outline-none"
            title="Attach file"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Paperclip className="size-4" />
            )}
            <span className="sr-only">Attach file</span>
          </button>

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

          {/* Emoji Picker */}
          <EmojiPicker
            open={emojiOpen}
            onOpenChange={setEmojiOpen}
            onSelect={(emoji) => setInput((val) => val + emoji)}
          />

          {/* Text Input */}
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm font-sans text-foreground placeholder:text-muted-foreground px-2 py-1"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0069D3] text-white hover:bg-[#0058b3] disabled:opacity-30 disabled:hover:bg-[#0069D3] transition-all cursor-pointer shadow-xs outline-none"
            title="Send message"
          >
            <Send className="size-3.5" />
            <span className="sr-only">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
