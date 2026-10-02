const renderLeaf = ({ children, leaf }: any) => {
  let content = children
  if (leaf.bold) content = <strong className="font-semibold">{content}</strong>
  if (leaf.italic) content = <em>{content}</em>
  if (leaf.underline) content = <u>{content}</u>
  return <span>{content}</span>
}

const renderElement = ({ children, element }: any) => {
  switch (element.type) {
    case "heading-one":
      return <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white leading-tight">{children}</h1>
    case "heading-two":
      return <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-slate-100 leading-snug">{children}</h2>
    case "block-quote":
      return (
        <blockquote className="border-l-4 border-violet-400 pl-4 italic text-gray-500 dark:text-slate-400 my-3 bg-violet-50/40 dark:bg-purple-950/20 py-2 pr-3 rounded-r-md">
          {children}
        </blockquote>
      )
    case "code":
      return (
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg my-3 text-sm font-mono overflow-x-auto leading-relaxed">
          <code>{children}</code>
        </pre>
      )
    case "bulleted-list":
      return <ul className="list-disc pl-6 space-y-1 my-2">{children}</ul>
    case "numbered-list":
      return <ol className="list-decimal pl-6 space-y-1 my-2">{children}</ol>
    case "list-item":
      return <li className="text-gray-700 dark:text-slate-200">{children}</li>
    default:
      return <p className="mb-2 text-gray-700 dark:text-slate-200 leading-relaxed">{children}</p>
  }
}

interface Props {
  value: any
}

export default function SlatePreview({ value }: Props) {
  const isEmpty =
    !Array.isArray(value) ||
    value.length === 0 ||
    (value.length === 1 &&
      value[0].children?.length === 1 &&
      value[0].children[0].text === "")

  if (isEmpty) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/60 dark:border-slate-700 dark:bg-slate-800/60">
        <p className="text-sm text-gray-400 dark:text-slate-500">Your preview will appear here when you start writing.</p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/60 text-sm overflow-auto max-h-125 dark:border-slate-700 dark:bg-slate-800/60">
      {value.map((node: any, i: number) => (
        <div key={i}>
          {renderElement({
            element: node,
            children: node.children?.map((child: any, j: number) => (
              <span key={j}>
                {renderLeaf({ leaf: child, children: child.text })}
              </span>
            )),
          })}
        </div>
      ))}
    </div>
  )
}
