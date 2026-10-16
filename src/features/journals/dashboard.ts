/* Dashboard numbers, worked out live from the other pages in the journal.
   Same rules as the Mac (JournalView.jsx → computeWidget / formatValue). */

import type { DashboardWidget, Folio, WidgetFormat } from './types'

const DAY = 86400000

function parseDate(value: string | undefined) {
  const time = Date.parse(String(value ?? ''))
  return Number.isNaN(time) ? null : new Date(time)
}

export function parseNum(value: unknown) {
  const number = parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isNaN(number) ? 0 : number
}

/* The computed value, or null when the source page can't be found or has
   nothing to count yet. */
export function computeWidget(widget: DashboardWidget, folios: Folio[]): string | number | null {
  const source = widget.source
  if (!source) return null
  const folio = folios.find((candidate) => candidate.type === source.from && candidate.title === source.folio)
  if (!folio) return null

  if (source.from === 'tracker') {
    const columns = folio.content.columns ?? []
    const rows = folio.content.rows ?? []
    const columnIndex = source.column ? columns.indexOf(source.column) : -1
    const dateIndex = columns.findIndex((column) => /date/i.test(column))
    const now = new Date()

    switch (source.agg) {
      case 'count':
        return rows.length
      case 'countWeek':
        return rows.filter((row) => {
          if (dateIndex < 0) return true
          const date = parseDate(row[dateIndex])
          if (!date) return false
          const age = now.getTime() - date.getTime()
          return age < 7 * DAY && age >= -DAY
        }).length
      case 'sumMonth':
        if (columnIndex < 0) return null
        return rows
          .filter((row) => {
            if (dateIndex < 0) return true
            const date = parseDate(row[dateIndex])
            return !!date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
          })
          .reduce((sum, row) => sum + parseNum(row[columnIndex]), 0)
      case 'sumNum':
        if (columnIndex < 0) return null
        return rows.reduce((sum, row) => sum + parseNum(row[columnIndex]), 0)
      case 'topValue': {
        if (columnIndex < 0) return null
        const tally: Record<string, number> = {}
        for (const row of rows) {
          const value = String(row[columnIndex] ?? '').trim()
          if (value) tally[value] = (tally[value] ?? 0) + 1
        }
        const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]
        return top ? top[0] : null
      }
      case 'daysSinceLast': {
        const dates = rows
          .map((row) => parseDate(row[dateIndex >= 0 ? dateIndex : 0]))
          .filter((date): date is Date => !!date)
        if (!dates.length) return null
        const last = Math.max(...dates.map((date) => date.getTime()))
        return Math.max(0, Math.floor((Date.now() - last) / DAY))
      }
      default:
        return null
    }
  }

  const items = folio.content.items ?? []
  if (source.agg === 'doneRatio') {
    return items.length ? Math.round((100 * items.filter((item) => item.done).length) / items.length) : 0
  }
  if (source.agg === 'count') return items.length
  return null
}

export function formatValue(value: string | number | null | undefined, format?: WidgetFormat) {
  if (value === null || value === undefined || value === '') return '—'
  if (format === 'money') return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (format === 'days') return `${value} ${Number(value) === 1 ? 'day' : 'days'}`
  if (format === 'hours') return `${value}h`
  if (typeof value === 'number' && String(value).length > 6) return value.toFixed(1)
  return String(value)
}
