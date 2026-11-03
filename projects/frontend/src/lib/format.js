const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
})

const number = new Intl.NumberFormat('en-IN')

export function inr(value) {
  if (value === null || value === undefined) return '—'
  return currency.format(Number(value))
}

export function compact(value) {
  if (value === null || value === undefined) return '0'
  return number.format(Number(value))
}

export function dateLabel(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export function monthLabel(value) {
  if (!value) return ''
  const [year, month] = value.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

export function timeAgo(value) {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  const days = Math.floor(diff / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  return `${Math.floor(months / 12)} year(s) ago`
}

export function orderStatusTone(status) {
  switch (status) {
    case 'DELIVERED':
      return 'success'
    case 'CANCELLED':
      return 'danger'
    case 'SHIPPED':
      return 'gold'
    default:
      return 'neutral'
  }
}