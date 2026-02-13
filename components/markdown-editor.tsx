"use client"

import { useState, useCallback, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
    Bold,
    Italic,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code,
    Minus,
    Eye,
    Edit3,
} from "lucide-react"

interface MarkdownEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    minHeight?: string
}

export function MarkdownEditor({ value, onChange, placeholder, minHeight = "300px" }: MarkdownEditorProps) {
    const [mode, setMode] = useState<"edit" | "preview" | "split">("edit")
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const insertMarkdown = useCallback(
        (before: string, after: string = "") => {
            const textarea = textareaRef.current
            if (!textarea) return

            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const selected = value.slice(start, end)
            const newText = value.slice(0, start) + before + selected + after + value.slice(end)
            onChange(newText)

            requestAnimationFrame(() => {
                textarea.focus()
                const cursorPos = start + before.length + selected.length
                textarea.setSelectionRange(cursorPos, cursorPos)
            })
        },
        [value, onChange]
    )

    const insertLinePrefix = useCallback(
        (prefix: string) => {
            const textarea = textareaRef.current
            if (!textarea) return

            const start = textarea.selectionStart
            const lineStart = value.lastIndexOf("\n", start - 1) + 1
            const newText = value.slice(0, lineStart) + prefix + value.slice(lineStart)
            onChange(newText)

            requestAnimationFrame(() => {
                textarea.focus()
                textarea.setSelectionRange(start + prefix.length, start + prefix.length)
            })
        },
        [value, onChange]
    )

    const tools = [
        { icon: Heading1, label: "H1", action: () => insertLinePrefix("# ") },
        { icon: Heading2, label: "H2", action: () => insertLinePrefix("## ") },
        { icon: Heading3, label: "H3", action: () => insertLinePrefix("### ") },
        { type: "divider" as const },
        { icon: Bold, label: "太字", action: () => insertMarkdown("**", "**") },
        { icon: Italic, label: "斜体", action: () => insertMarkdown("*", "*") },
        { icon: Code, label: "コード", action: () => insertMarkdown("`", "`") },
        { type: "divider" as const },
        { icon: List, label: "リスト", action: () => insertLinePrefix("- ") },
        { icon: ListOrdered, label: "番号リスト", action: () => insertLinePrefix("1. ") },
        { icon: Quote, label: "引用", action: () => insertLinePrefix("> ") },
        { icon: Minus, label: "区切り線", action: () => insertMarkdown("\n---\n") },
    ]

    return (
        <div className="rounded-xl border border-[#1B3022]/10 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[#1B3022]/10 bg-[#F8F9FA]">
                {tools.map((tool, i) =>
                    "type" in tool && tool.type === "divider" ? (
                        <div key={i} className="w-px h-5 bg-[#1B3022]/10 mx-1" />
                    ) : (
                        <button
                            key={i}
                            type="button"
                            onClick={"action" in tool ? tool.action : undefined}
                            className="p-1.5 rounded-md text-[#1B3022]/50 hover:text-[#1B3022] hover:bg-[#1B3022]/5 transition-colors"
                            title={"label" in tool ? tool.label : ""}
                        >
                            {"icon" in tool && tool.icon && <tool.icon className="w-4 h-4" />}
                        </button>
                    )
                )}
                <div className="flex-1" />
                {/* View mode toggle */}
                <div className="flex items-center gap-0.5 bg-[#1B3022]/5 rounded-lg p-0.5">
                    <button
                        type="button"
                        onClick={() => setMode("edit")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${mode === "edit" ? "bg-white text-[#1B3022] shadow-sm" : "text-[#1B3022]/40 hover:text-[#1B3022]/60"}`}
                    >
                        <Edit3 className="w-3 h-3" />
                        {"編集"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("split")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${mode === "split" ? "bg-white text-[#1B3022] shadow-sm" : "text-[#1B3022]/40 hover:text-[#1B3022]/60"}`}
                    >
                        {"分割"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("preview")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${mode === "preview" ? "bg-white text-[#1B3022] shadow-sm" : "text-[#1B3022]/40 hover:text-[#1B3022]/60"}`}
                    >
                        <Eye className="w-3 h-3" />
                        {"プレビュー"}
                    </button>
                </div>
            </div>

            {/* Editor / Preview */}
            <div className={`${mode === "split" ? "grid grid-cols-2 divide-x divide-[#1B3022]/10" : ""}`} style={{ minHeight }}>
                {/* Textarea */}
                {(mode === "edit" || mode === "split") && (
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder || "Markdownで本文を入力..."}
                        className="w-full p-4 text-sm text-[#1B3022] placeholder-[#1B3022]/30 bg-white resize-none focus:outline-none font-mono leading-relaxed"
                        style={{ minHeight }}
                    />
                )}
                {/* Preview */}
                {(mode === "preview" || mode === "split") && (
                    <div className="p-4 prose prose-sm max-w-none overflow-auto bg-white" style={{ minHeight }}>
                        {value ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ children }) => <h1 className="font-serif text-2xl text-[#1B3022] border-b border-[#1B3022]/10 pb-2 mb-4">{children}</h1>,
                                    h2: ({ children }) => <h2 className="font-serif text-xl text-[#1B3022] border-b border-[#1B3022]/8 pb-1.5 mb-3 mt-6">{children}</h2>,
                                    h3: ({ children }) => <h3 className="font-serif text-lg text-[#1B3022] mb-2 mt-4">{children}</h3>,
                                    p: ({ children }) => <p className="text-[#1B3022]/75 leading-[2] text-[15px] mb-4">{children}</p>,
                                    blockquote: ({ children }) => <blockquote className="border-l-[3px] border-[#D4AF37] pl-4 py-1 italic text-[#1B3022]/70">{children}</blockquote>,
                                    ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 text-[#1B3022]/75">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 text-[#1B3022]/75">{children}</ol>,
                                    code: ({ children, className }) => {
                                        const isInline = !className
                                        return isInline ? (
                                            <code className="bg-[#1B3022]/5 px-1.5 py-0.5 rounded text-sm font-mono text-[#1B3022]/80">{children}</code>
                                        ) : (
                                            <code className={`block bg-[#1B3022]/5 p-4 rounded-lg text-sm font-mono text-[#1B3022]/80 overflow-auto ${className || ""}`}>{children}</code>
                                        )
                                    },
                                    hr: () => <hr className="border-[#1B3022]/10 my-6" />,
                                    strong: ({ children }) => <strong className="font-semibold text-[#1B3022]">{children}</strong>,
                                    em: ({ children }) => <em className="italic text-[#1B3022]/70">{children}</em>,
                                    a: ({ children, href }) => <a href={href} className="text-[#D4AF37] hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                                }}
                            >
                                {value}
                            </ReactMarkdown>
                        ) : (
                            <p className="text-[#1B3022]/30 text-sm">{"プレビューがここに表示されます"}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
