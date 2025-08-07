'use client'

import React, { useState, useEffect } from 'react'
import { bankGuaranteeService, type BankGuarantee, type BankGuaranteeUpdate } from '@/lib/supabase/database'

interface EditGuaranteeModalProps {
  guarantee: BankGuarantee | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditGuaranteeModal({ guarantee, isOpen, onClose, onSuccess }: EditGuaranteeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<BankGuaranteeUpdate>({})

  useEffect(() => {
    if (guarantee) {
      setFormData({
        guarantee_number: guarantee.guarantee_number,
        guarantee_type: guarantee.guarantee_type,
        value: guarantee.value,
        currency: guarantee.currency,
        issue_date: guarantee.issue_date,
        expiry_date: guarantee.expiry_date,
        status: guarantee.status,
        bank_name: guarantee.bank_name
      })
    }
  }, [guarantee])

  if (!isOpen || !guarantee) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await bankGuaranteeService.update(guarantee.id, formData)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث الضمان')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#2c3e50]">تعديل الضمان</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الضمان *
              </label>
              <input
                type="text"
                name="guarantee_number"
                value={formData.guarantee_number || ''}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الضمان *
              </label>
              <select
                name="guarantee_type"
                value={formData.guarantee_type || ''}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              >
                <option value="ضمان أداء">ضمان أداء</option>
                <option value="ضمان ابتدائي">ضمان ابتدائي</option>
                <option value="ضمان نهائي">ضمان نهائي</option>
                <option value="ضمان صيانة">ضمان صيانة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                القيمة *
              </label>
              <input
                type="number"
                name="value"
                value={formData.value || ''}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العملة
              </label>
              <select
                name="currency"
                value={formData.currency || 'SAR'}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              >
                <option value="SAR">ريال سعودي</option>
                <option value="USD">دولار أمريكي</option>
                <option value="EUR">يورو</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ الإصدار *
              </label>
              <input
                type="date"
                name="issue_date"
                value={formData.issue_date || ''}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ الانتهاء *
              </label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date || ''}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة
              </label>
              <select
                name="status"
                value={formData.status || 'pending'}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              >
                <option value="pending">قيد المراجعة</option>
                <option value="active">نشط</option>
                <option value="expired">منتهي الصلاحية</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البنك *
              </label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name || ''}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#2c5530] text-white py-3 px-6 rounded-lg hover:bg-[#1e3a20] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
            
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}