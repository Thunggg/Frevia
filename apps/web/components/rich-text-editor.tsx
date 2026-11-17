"use client";

import { useTranslations } from "next-intl";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Quote,
  Code,
  Minus,
} from "@/components/icons";
import { cn } from "@repo/ui/lib/utils";

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
        "hover:bg-[#0069D3]/10 hover:text-[#0069D3]",
        "disabled:pointer-events-none disabled:opacity-40",
        isActive
          ? "bg-[#0069D3]/12 text-[#0069D3]"
          : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px bg-border" />;
}

function EditorToolbar({ editor }: { editor: Editor }) {
  const t = useTranslations("richText");

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-border bg-[#0069D3]/[0.02] px-2 py-1.5">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleBold().run()}
        isActive={editor.isActive("bold")}
        title={t("bold")}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title={t("italic")}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title={t("underline")}
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title={t("strikethrough")}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title={t("heading1")}
      >
        <Heading1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title={t("heading2")}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title={t("heading3")}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title={t("bulletList")}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title={t("orderedList")}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        title={t("alignLeft")}
      >
        <AlignLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        title={t("alignCenter")}
      >
        <AlignCenter className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        title={t("alignRight")}
      >
        <AlignRight className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title={t("blockquote")}
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        title={t("codeBlock")}
      >
        <Code className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).setHorizontalRule().run()}
        title={t("horizontalRule")}
      >
        <Minus className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).undo().run()}
        disabled={!editor.can().undo()}
        title={t("undo")}
      >
        <Undo className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).redo().run()}
        disabled={!editor.can().redo()}
        title={t("redo")}
      >
        <Redo className="size-4" />
      </ToolbarButton>
    </div>
  );
}

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  minHeight = "min-h-[200px]",
}: RichTextEditorProps) {
  const t = useTranslations("richText");
  const resolvedPlaceholder = placeholder ?? t("placeholder");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: resolvedPlaceholder,
      }),
      TextStyle,
      Color,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "max-w-none",
          "focus:outline-none",
          "px-4 py-3",
          "text-sm leading-relaxed",
          "[&.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          minHeight,
        ),
      },
    },
  });

  if (!editor) return null;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-background",
        "focus-within:border-[#0069D3] focus-within:ring-2 focus-within:ring-[#0069D3]/20",
        disabled && "opacity-50",
        className,
      )}
    >
      <EditorToolbar editor={editor} />
      <div className="max-h-[400px] overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
