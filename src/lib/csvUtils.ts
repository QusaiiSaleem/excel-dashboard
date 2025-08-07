import type { BankGuarantee } from '@/lib/supabase/database'

export function exportToCSV(data: BankGuarantee[], filename = 'bank_guarantees.csv') {
  if (data.length === 0) {
    return
  }

  const headers = [
    'رقم الضمان',
    'نوع الضمان',
    'القيمة',
    'العملة',
    'تاريخ الإصدار',
    'تاريخ الانتهاء',
    'الحالة',
    'البنك',
    'تاريخ الإنشاء'
  ]

  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      `"${row.guarantee_number}"`,
      `"${row.guarantee_type}"`,
      row.value,
      `"${row.currency}"`,
      row.issue_date,
      row.expiry_date,
      `"${getStatusText(row.status)}"`,
      `"${row.bank_name}"`,
      new Date(row.created_at).toLocaleDateString('ar-SA')
    ].join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function parseCSV(csvText: string): Partial<BankGuarantee>[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const data: Partial<BankGuarantee>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) continue

    const row: Partial<BankGuarantee> = {
      guarantee_number: cleanValue(values[0]),
      guarantee_type: cleanValue(values[1]),
      value: parseFloat(values[2]) || 0,
      currency: cleanValue(values[3]) || 'SAR',
      issue_date: values[4],
      expiry_date: values[5],
      status: parseStatus(cleanValue(values[6])),
      bank_name: cleanValue(values[7])
    }

    data.push(row)
  }

  return data
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

function cleanValue(value: string): string {
  return value.replace(/"/g, '').trim()
}

function parseStatus(statusText: string): 'active' | 'pending' | 'expired' {
  const cleaned = statusText.toLowerCase()
  if (cleaned.includes('نشط') || cleaned === 'active') return 'active'
  if (cleaned.includes('منتهي') || cleaned.includes('expired')) return 'expired'
  return 'pending'
}

function getStatusText(status: 'active' | 'pending' | 'expired'): string {
  switch (status) {
    case 'active': return 'نشط'
    case 'pending': return 'قيد المراجعة'
    case 'expired': return 'منتهي الصلاحية'
    default: return 'قيد المراجعة'
  }
}

export function downloadCSVTemplate() {
  const headers = [
    'رقم الضمان',
    'نوع الضمان',
    'القيمة',
    'العملة',
    'تاريخ الإصدار',
    'تاريخ الانتهاء',
    'الحالة',
    'البنك'
  ]

  const sampleData = [
    'BG-2025-001',
    'ضمان أداء',
    '1000000',
    'SAR',
    '2025-01-01',
    '2025-12-31',
    'نشط',
    'البنك الأهلي'
  ]

  const csvContent = [headers.join(','), sampleData.join(',')].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'bank_guarantees_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}