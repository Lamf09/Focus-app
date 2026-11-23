export function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function dateAtNoon(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

export function startOfWeek(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

export function dayKeyOffset(date, offset) {
  const next = new Date(date)
  next.setDate(next.getDate() + offset)
  return localDateKey(next)
}