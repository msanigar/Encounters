export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date)
  return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
}

export function getMonthStart(year: number, month: number): Date {
  return new Date(year, month, 1)
}

export function getMonthEnd(year: number, month: number): Date {
  return new Date(year, month + 1, 0)
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = getMonthStart(year, month)
  const lastDay = getMonthEnd(year, month)
  
  // Get the first Monday of the calendar grid
  const calendarStart = getWeekStart(firstDay)
  
  // Get the last Sunday of the calendar grid
  const calendarEnd = new Date(getWeekEnd(lastDay))
  
  const days: Date[] = []
  const current = new Date(calendarStart)
  
  while (current <= calendarEnd) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return days
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function formatCalendarDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatCalendarTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function getStartOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1)
}

export function getMonthName(month: number): string {
  return MONTHS[month]
}
