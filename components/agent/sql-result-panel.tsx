'use client'

'use no memo'

import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

import type { SqlResultData, SqlResultRow } from '@/lib/chat-types'

const formatCellValue = (value: unknown) => {
  if (value == null) {
    return 'null'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value)
  }

  return JSON.stringify(value)
}

const EmptyState = () => (
  <div className="flex h-full min-h-72 items-center justify-center rounded-3xl border border-border/80 bg-card px-6 text-center shadow-sm">
    <div className="max-w-sm space-y-2">
      <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">Awaiting query result</p>
      <p className="text-sm text-muted-foreground">
        When the SQL agent calls the display tool, the structured result set will appear here.
      </p>
    </div>
  </div>
)

export const SqlResultPanel = ({ result }: { result: SqlResultData | null }) => {
  const columns = useMemo<ColumnDef<SqlResultRow>[]>(() => {
    if (!result) {
      return []
    }

    return result.columns.map((columnName) => ({
      accessorFn: (row) => row[columnName],
      id: columnName,
      header: () => columnName,
      cell: ({ getValue }) => <span className="block whitespace-pre-wrap">{formatCellValue(getValue())}</span>,
    }))
  }, [result])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: result?.rows ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!result) {
    return <EmptyState />
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 rounded-3xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="space-y-3 border-b border-border/80 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-[0.08em] text-muted-foreground">
          <span>{result.row_count} rows</span>
          <span className="text-border">•</span>
          <span>{result.column_count} columns</span>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium tracking-[0.08em] text-muted-foreground">Executed SQL</p>
          <pre className="overflow-x-auto rounded-2xl border border-border/70 bg-muted/55 p-3 font-mono text-sm text-foreground/90">
            {result.sql_query}
          </pre>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-border/80 bg-background/65">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr className="border-b border-border/80" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    className="min-w-40 border-r border-border/70 px-3 py-2 font-mono text-xs font-medium text-muted-foreground last:border-r-0"
                    key={header.id}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr className="border-b border-border/60 align-top last:border-b-0" key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td className="border-r border-border/60 px-3 py-2 text-foreground/90 last:border-r-0" key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
