import { useCallback, useMemo } from "react"
import { createEditor, Editor } from "slate"
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps } from "slate-react"
import SlateToolbar from "@/components/molecules/SlateToolbar"

const renderLeaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  let content = children
  if ((leaf as any).bold) content = <strong>{content}</strong>
  if ((leaf as any).italic) content = <em>{content}</em>
  if ((leaf as any).underline) content = <u>{content}</u>
  return <span {...attributes}>{content}</span>
}

const renderElement = ({ attributes, children, element }: RenderElementProps) => {
  switch ((element as any).type) {
    case "heading-one":
      return (
        <h1 {...attributes} className="text-2xl font-bold mb-3 text-gray-900 dark:text-white leading-tight">
          {children}
        </h1>
      )
    case "heading-two":
      return (
        <h2 {...attributes} className="text-xl font-semibold mb-2 text-gray-800 dark:text-slate-100 leading-snug">
          {children}
        </h2>
      )
    case "block-quote":
      return (
        <blockquote
          {...attributes}
          className="border-l-4 border-violet-400 pl-4 italic text-gray-500 dark:text-slate-400 my-3 bg-violet-50/40 dark:bg-purple-950/20 py-2 pr-3 rounded-r-md"
        >
          {children}
        </blockquote>
      )
    case "code":
      return (
        <pre
          {...attributes}
          className="bg-gray-900 text-green-400 p-4 rounded-lg my-3 text-sm font-mono overflow-x-auto leading-relaxed"
        >
          <code>{children}</code>
        </pre>
      )
    case "bulleted-list":
      return (
        <ul {...attributes} className="list-disc pl-6 space-y-1 my-2">
          {children}
        </ul>
      )
    case "numbered-list":
      return (
        <ol {...attributes} className="list-decimal pl-6 space-y-1 my-2">
          {children}
        </ol>
      )
    case "list-item":
      return (
        <li {...attributes} className="text-gray-700 dark:text-slate-200">
          {children}
        </li>
      )
    default:
      return (
        <p {...attributes} className="mb-2 text-gray-700 dark:text-slate-200 leading-relaxed">
          {children}
        </p>
      )
  }
}

function getWordCount(value: any[]): number {
  if (!Array.isArray(value)) return 0
  const text = value
    .flatMap((node: any) => node.children?.map((c: any) => c.text || "") ?? [])
    .join(" ")
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

const EMPTY_VALUE = [{ type: "paragraph", children: [{ text: "" }] }]

/**
 * Slate crashes if any node has `children: undefined`.
 * This normalizes any value from the DB into a safe Slate document.
 */
function normalizeSlateValue(v: any): any[] {
  if (!Array.isArray(v) || v.length === 0) return EMPTY_VALUE

  const normalized = v
    .filter(Boolean)
    .map((node: any) => ({
      ...node,
      type: typeof node.type === "string" ? node.type : "paragraph",
      children:
        Array.isArray(node.children) && node.children.length > 0
          ? node.children.map((child: any) => ({
              ...child,
              // text must come AFTER spread so undefined from DB never wins
              text: typeof child.text === "string" ? child.text : "",
            }))
          : [{ text: "" }],
    }))

  return normalized.length > 0 ? normalized : EMPTY_VALUE
}

interface Props {
  value: any
  onChange: (value: any) => void
  /** Pass content.content_text to ensure correct initialization */
  initialValue?: any
}

export default function SlateEditor({ value, onChange, initialValue: initialValueProp }: Props) {
  const editor = useMemo(() => withReact(createEditor()), [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialValue = useMemo(() => {
    // Prefer the explicit initialValue prop (direct from DB content),
    // fall back to the reactive value state.
    return normalizeSlateValue(initialValueProp ?? value)
  }, []) // intentionally empty — Slate owns its internal state after init

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return

      switch (event.key) {
        case "b":
          event.preventDefault()
          Editor.marks(editor)?.bold === true
            ? Editor.removeMark(editor, "bold")
            : Editor.addMark(editor, "bold", true)
          break
        case "i":
          event.preventDefault()
          Editor.marks(editor)?.italic === true
            ? Editor.removeMark(editor, "italic")
            : Editor.addMark(editor, "italic", true)
          break
        case "u":
          event.preventDefault()
          Editor.marks(editor)?.underline === true
            ? Editor.removeMark(editor, "underline")
            : Editor.addMark(editor, "underline", true)
          break
      }
    },
    [editor],
  )

  const wordCount = useMemo(() => {
    return Array.isArray(value) ? getWordCount(value) : 0
  }, [value])

  return (
    <div className="
      border px-3 py-2 text-sm bg-white
      border-gray-300
      focus-within:border-purple-700
      focus-within:ring-1 focus-within:ring-purple-700
      transition-all
      dark:bg-slate-900 dark:border-slate-600
      dark:focus-within:border-purple-500 dark:focus-within:ring-purple-500
    ">

      <div className="px-4 pt-3">
        <SlateToolbar editor={editor} />
      </div>

      <div className="px-4 pb-2">
        <Slate editor={editor} initialValue={initialValue} onChange={onChange}>
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onKeyDown={onKeyDown}
            placeholder="Start writing your content here..."
            className="min-h-55 outline-none text-sm leading-relaxed text-slate-900 dark:text-slate-100"
          />
        </Slate>
      </div>

      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between dark:border-slate-700 dark:bg-slate-800/60">
        <span className="text-xs text-gray-400 dark:text-slate-500">
          {wordCount} {wordCount === 1 ? "kata" : "kata"}
        </span>
        <span className="text-xs text-gray-400 hidden sm:block dark:text-slate-500">
          <kbd className="px-1 py-0.5 bg-gray-200 rounded text-gray-500 font-mono text-xs dark:bg-slate-700 dark:text-slate-400">Ctrl+B</kbd>{" "}
          Bold ·{" "}
          <kbd className="px-1 py-0.5 bg-gray-200 rounded text-gray-500 font-mono text-xs dark:bg-slate-700 dark:text-slate-400">Ctrl+I</kbd>{" "}
          Italic ·{" "}
          <kbd className="px-1 py-0.5 bg-gray-200 rounded text-gray-500 font-mono text-xs dark:bg-slate-700 dark:text-slate-400">Ctrl+U</kbd>{" "}
          Underline
        </span>
      </div>

    </div>
  )
}
