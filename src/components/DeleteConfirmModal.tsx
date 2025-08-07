'use client'

import React, { useState } from 'react'
import { bankGuaranteeService, type BankGuarantee } from '@/lib/supabase/database'

interface DeleteConfirmModalProps {
  guarantee: BankGuarantee | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function DeleteConfirmModal({ guarantee, isOpen, onClose, onSuccess }: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !guarantee) return null

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      await bankGuaranteeService.delete(guarantee.id)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حذف الضمان')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <div className="text-red-600 text-2xl">⚠️</div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            تأكيد حذف الضمان
          </h3>
          
          <div className="text-sm text-gray-600 mb-6">
            <p className="mb-2">هل أنت متأكد من حذف هذا الضمان؟</p>
            <div className="bg-gray-50 rounded p-3 text-right">
              <p><strong>رقم الضمان:</strong> {guarantee.guarantee_number}</p>
              <p><strong>البنك:</strong> {guarantee.bank_name}</p>
              <p><strong>القيمة:</strong> {guarantee.value.toLocaleString()} {guarantee.currency}</p>
            </div>
            <p className="mt-2 text-red-600">
              <strong>تحذير:</strong> هذا الإجراء لا يمكن التراجع عنه
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'جاري الحذف...' : 'حذف الضمان'}
          </button>
          
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}