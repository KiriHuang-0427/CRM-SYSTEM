import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '0'
  return Math.round(n).toLocaleString()
}

export function fmtK(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '0K'
  return (Math.round(n * 10) / 10).toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + 'K'
}

export function daysSince(ds: string | null | undefined): number {
  if (!ds) return 999
  const d = new Date(ds)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / 86400000)
}

export function shortName(n: string): string {
  return n
    .replace(/^江苏|^南京/g, '')
    .replace(/股份有限公司$|有限责任公司$|有限公司$/g, '')
    .replace(/（.*?）/g, '')
}

export function getHealthColor(lastVisit: string | null | undefined): string {
  if (!lastVisit) return 'var(--pri-gray)'
  const d = daysSince(lastVisit)
  if (d <= 7) return 'var(--pri-green)'
  if (d <= 14) return 'var(--pri-orange)'
  return 'var(--pri-red)'
}

export function getHealthBadge(d: number): { text: string; cls: string } {
  if (d <= 7) return { text: `${d}天前`, cls: 'badge-green' }
  if (d <= 14) return { text: `${d}天前`, cls: 'badge-orange' }
  return { text: d === 999 ? '未拜访' : `${d}天未拜访`, cls: 'badge-red' }
}

export function colorHex(c: string): string {
  const map: Record<string, string> = {
    red: 'var(--pri-red)',
    orange: 'var(--pri-orange)',
    green: 'var(--pri-green)',
    gray: 'var(--pri-gray)',
  }
  return map[c] || 'var(--pri-gray)'
}

export function priorityLabel(c: string): string {
  const map: Record<string, string> = {
    red: 'A类-重点',
    orange: 'B类-关注',
    green: 'C类-培育',
    gray: '待开发',
  }
  return map[c] || c
}
