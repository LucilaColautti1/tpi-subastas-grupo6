export function formatFecha(utcStr) {
  if (!utcStr) return ''
  return new Date(utcStr + 'Z').toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
}

export function formatFechaCorta(utcStr) {
  if (!utcStr) return ''
  return new Date(utcStr + 'Z').toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
}
