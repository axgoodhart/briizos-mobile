export function confirmDestructiveAction(message: string): { confirmed: true } | null {
  if (!window.confirm(message)) return null
  return { confirmed: true }
}
