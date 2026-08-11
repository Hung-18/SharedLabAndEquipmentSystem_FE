export function normalizeSearchText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .normalize('NFC')
}

export function searchIncludes(needle: string, ...values: unknown[]): boolean {
  const normalizedNeedle = normalizeSearchText(needle)
  return (
    !normalizedNeedle ||
    values.some((value) => normalizeSearchText(value).includes(normalizedNeedle))
  )
}
