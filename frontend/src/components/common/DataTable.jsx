import { motion } from 'framer-motion'
import { Download, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function DataTable({
  data,
  columns,
  title,
  downloadable = false,
  className = '',
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const headers = columns.map((col) => col.header).join('\t')
    const rows = data
      .map((row) => columns.map((col) => row[col.accessor]).join('\t'))
      .join('\n')
    navigator.clipboard.writeText(`${headers}\n${rows}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const headers = columns.map((col) => col.header).join(',')
    const rows = data
      .map((row) => columns.map((col) => row[col.accessor]).join(','))
      .join('\n')
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'data'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-coastal-100 flex items-center justify-between">
        <h3 className="font-display font-semibold text-coastal-900">{title}</h3>
        
        {downloadable && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="btn-ghost text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
            <button onClick={handleDownload} className="btn-ghost text-sm">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-coastal-50">
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  className="px-6 py-3 text-left text-xs font-semibold text-coastal-600 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-coastal-100">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-coastal-50 transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={column.accessor}
                    className="px-6 py-4 text-sm text-coastal-700 whitespace-nowrap"
                  >
                    {column.render
                      ? column.render(row[column.accessor], row)
                      : typeof row[column.accessor] === 'number'
                      ? row[column.accessor].toFixed(column.decimals || 3)
                      : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
