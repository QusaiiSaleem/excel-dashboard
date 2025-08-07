'use client'

import React, { useState } from 'react'
import { bankGuaranteeService, type BankGuaranteeInsert } from '@/lib/supabase/database'

interface AddGuaranteeFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function AddGuaranteeForm({ onSuccess, onCancel }: AddGuaranteeFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<BankGuaranteeInsert, 'id' | 'created_at' | 'updated_at'>>({
    guarantee_number: '',
    guarantee_type: 'ضمان أداء',
    value: 0,
    currency: 'SAR',
    issue_date: '',
    expiry_date: '',
    status: 'pending',
    bank_name: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await bankGuaranteeService.create(formData)
      setFormData({
        guarantee_number: '',
        guarantee_type: 'ضمان أداء',
        value: 0,
        currency: 'SAR',
        issue_date: '',
        expiry_date: '',
        status: 'pending',
        bank_name: ''
      })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة الضمان')
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6" dir="rtl">
      <h3 className="text-xl font-semibold text-[#2c3e50] mb-6">إضافة ضمان جديد</h3>
      
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
              value={formData.guarantee_number}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              placeholder="BG-2025-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع الضمان *
            </label>
            <select
              name="guarantee_type"
              value={formData.guarantee_type}
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
              value={formData.value}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              placeholder="1000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العملة
            </label>
            <select
              name="currency"
              value={formData.currency}
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
              value={formData.issue_date}
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
              value={formData.expiry_date}
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
              value={formData.status}
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
              value={formData.bank_name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              placeholder="البنك الأهلي"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#2c5530] text-white py-3 px-6 rounded-lg hover:bg-[#1e3a20] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الضمان'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>
    </div>
  )
}