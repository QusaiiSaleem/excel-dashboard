'use client'

import React, { useState, useRef } from 'react'
import { bankGuaranteeService } from '@/lib/supabase/database'
import { parseCSV } from '@/lib/csvUtils'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Record<string, unknown>[]>([])
  const [importStats, setImportStats] = useState<{ success: number; errors: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setError('يرجى اختيار ملف CSV فقط')
      return
    }

    setFile(selectedFile)
    setError(null)
    setPreview([])

    // Read and preview file
    const reader = new FileReader()
    reader.onload = (event) => {
      const csvText = event.target?.result as string
      try {
        const parsed = parseCSV(csvText)
        setPreview(parsed.slice(0, 5)) // Show first 5 rows
        if (parsed.length === 0) {
          setError('الملف فارغ أو لا يحتوي على بيانات صحيحة')
        }
      } catch {
        setError('خطأ في قراءة الملف. تأكد من صيغة CSV')
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setImportStats(null)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const csvText = event.target?.result as string
        const parsed = parseCSV(csvText)
        
        let successCount = 0
        let errorCount = 0

        // Import each row
        for (const row of parsed) {
          try {
            // Validate required fields
            if (!row.guarantee_number || !row.guarantee_type || !row.value || !row.bank_name) {
              errorCount++
              continue
            }

            await bankGuaranteeService.create({
              guarantee_number: row.guarantee_number,
              guarantee_type: row.guarantee_type,
              value: row.value,
              currency: row.currency || 'SAR',
              issue_date: row.issue_date || new Date().toISOString().split('T')[0],
              expiry_date: row.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: row.status || 'pending',
              bank_name: row.bank_name
            })
            successCount++
          } catch {
            errorCount++
          }
        }

        setImportStats({ success: successCount, errors: errorCount })
        
        if (successCount > 0) {
          setTimeout(() => {
            onSuccess()
            handleClose()
          }, 2000)
        }
      }
      reader.readAsText(file)
    } catch {
      setError('خطأ في استيراد البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview([])
    setError(null)
    setImportStats(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#2c3e50]">استيراد ضمانات من ملف CSV</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر ملف CSV
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500
              file:ml-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-[#2c5530] file:text-white
              hover:file:bg-[#1e3a20]
              file:cursor-pointer cursor-pointer"
          />
          <p className="text-sm text-gray-600 mt-1">
            تأكد من أن الملف يحتوي على الأعمدة: رقم الضمان، نوع الضمان، القيمة، البنك
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {importStats && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            تم استيراد {importStats.success} ضمان بنجاح
            {importStats.errors > 0 && `, فشل في ${importStats.errors} صف`}
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">معاينة البيانات (أول 5 صفوف):</h4>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-right border-b">رقم الضمان</th>
                    <th className="px-3 py-2 text-right border-b">النوع</th>
                    <th className="px-3 py-2 text-right border-b">القيمة</th>
                    <th className="px-3 py-2 text-right border-b">العملة</th>
                    <th className="px-3 py-2 text-right border-b">البنك</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border-b">{String(row.guarantee_number) || '-'}</td>
                      <td className="px-3 py-2 border-b">{String(row.guarantee_type) || '-'}</td>
                      <td className="px-3 py-2 border-b">{row.value ? Number(row.value).toLocaleString() : '-'}</td>
                      <td className="px-3 py-2 border-b">{String(row.currency) || 'SAR'}</td>
                      <td className="px-3 py-2 border-b">{String(row.bank_name) || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleImport}
            disabled={!file || loading || Boolean(importStats && importStats.success > 0)}
            className="flex-1 bg-[#2c5530] text-white py-3 px-6 rounded-lg hover:bg-[#1e3a20] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'جاري الاستيراد...' : (importStats && importStats.success > 0) ? 'تم الاستيراد' : 'استيراد البيانات'}
          </button>
          
          <button
            onClick={handleClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {(importStats && importStats.success > 0) ? 'إغلاق' : 'إلغاء'}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">تعليمات تنسيق CSV:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• الأعمدة المطلوبة: رقم الضمان، نوع الضمان، القيمة، البنك</li>
            <li>• الأعمدة الاختيارية: العملة، تاريخ الإصدار، تاريخ الانتهاء، الحالة</li>
            <li>• استخدم الفاصلة (،) لفصل الأعمدة</li>
            <li>• ضع النصوص بين علامات تنصيص إذا احتوت على فواصل</li>
            <li>• تنسيق التاريخ: YYYY-MM-DD (2025-01-15)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}