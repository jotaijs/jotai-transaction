export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function cloneValue<T>(value: T): T {
  if (typeof value !== 'object' || value === null) {
    return value
  }

  return JSON.parse(JSON.stringify(value))
}
