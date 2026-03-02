import type { CompiledReview } from '../../../types'

interface CodeAndAuditsSectionProps {
  review: CompiledReview
}

interface Subsection {
  title: string
  content: ContentBlock[]
}

interface ContentBlock {
  type: string
  [key: string]: unknown
}

export function CodeAndAuditsSection({ review }: CodeAndAuditsSectionProps) {
  const section = review.sections?.codeAndAudits as
    | { title: string; subsections: Subsection[] }
    | undefined

  if (!section || !section.subsections?.length) {
    return <p className="text-text-muted">No code & audit information available.</p>
  }

  return (
    <div className="space-y-6">
      {section.subsections.map((sub) => (
        <div key={sub.title}>
          <h3 className="text-lg font-medium text-text-primary mb-3">
            {sub.title}
          </h3>
          <div className="space-y-3">
            {sub.content.map((block, i) => (
              <ContentBlockRenderer key={i} block={block} review={review} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ContentBlockRenderer({
  block,
  review,
}: {
  block: ContentBlock
  review: CompiledReview
}) {
  if (block.type === 'dataTable') {
    return <DataTableBlock block={block} review={review} />
  }

  if (block.type === 'text') {
    return (
      <p className="text-sm text-text-secondary leading-relaxed">
        {String(block.text ?? '')}
      </p>
    )
  }

  return null
}

function DataTableBlock({
  block,
  review,
}: {
  block: ContentBlock
  review: CompiledReview
}) {
  const columns = (block.columns ?? []) as {
    field: string
    header: string
    format?: string
  }[]
  const filters = block.filters as { excludeExternal?: boolean } | undefined

  let data: Record<string, unknown>[] = review.contracts.map(
    (c) => ({ ...c }) as Record<string, unknown>,
  )
  if (filters?.excludeExternal) {
    data = data.filter(
      (row) => !(row as { isExternal?: boolean }).isExternal,
    )
  }

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-muted">
            {columns.map((col) => (
              <th
                key={col.field}
                className="text-left px-4 py-2 font-medium text-text-secondary"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border last:border-0 hover:bg-bg-muted/50"
            >
              {columns.map((col) => (
                <td key={col.field} className="px-4 py-2 text-text-primary">
                  {col.format === 'address' ? (
                    <span className="font-mono text-xs">
                      {String(row[col.field] ?? '')}
                    </span>
                  ) : col.format === 'badge' ? (
                    row[col.field] ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                        {String(row[col.field])}
                      </span>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )
                  ) : (
                    String(row[col.field] ?? '-')
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
