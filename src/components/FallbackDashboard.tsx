'use client'

import React from 'react'

const sampleData = [
  {
    id: '1',
    guarantee_number: 'BG-2025-001',
    guarantee_type: 'ضمان أداء',
    value: 2500000,
    currency: 'SAR',
    issue_date: '2025-01-15',
    expiry_date: '2025-12-15',
    status: 'active' as const,
    bank_name: 'البنك الأهلي',
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z'
  },
  {
    id: '2',
    guarantee_number: 'BG-2025-002',
    guarantee_type: 'ضمان ابتدائي',
    value: 1200000,
    currency: 'SAR',
    issue_date: '2025-01-20',
    expiry_date: '2025-06-20',
    status: 'pending' as const,
    bank_name: 'بنك الرياض',
    created_at: '2025-01-20T00:00:00Z',
    updated_at: '2025-01-20T00:00:00Z'
  },
  {
    id: '3',
    guarantee_number: 'BG-2025-003',
    guarantee_type: 'ضمان نهائي',
    value: 800000,
    currency: 'SAR',
    issue_date: '2025-01-25',
    expiry_date: '2026-01-25',
    status: 'active' as const,
    bank_name: 'البنك السعودي الفرنسي',
    created_at: '2025-01-25T00:00:00Z',
    updated_at: '2025-01-25T00:00:00Z'
  }
]

export default function FallbackDashboard() {
  const totalValue = sampleData.reduce((sum, g) => sum + g.value, 0)
  const activeCount = sampleData.filter(g => g.status === 'active').length
  const pendingCount = sampleData.filter(g => g.status === 'pending').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2]" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2c5530] to-[#1e3a20] text-white p-5 text-center shadow-lg">
        <h1 className="text-3xl font-bold mb-2">لوحة بيانات الضمانات البنكية التفصيلية</h1>
        <p className="text-lg opacity-90">أمانة منطقة الرياض - إدارة الشؤون المالية</p>
        <div className="mt-3 text-sm bg-yellow-600 bg-opacity-20 rounded p-2">
          🔧 وضع العرض التوضيحي - البيانات غير متصلة بقاعدة البيانات
        </div>
      </div>

      {/* Dashboard */}
      <div className="max-w-7xl mx-auto py-8 px-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KPI Cards */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div className="bg-white rounded-lg p-6 text-center border-r-4 border-[#2c5530] shadow-lg">
                <div className="text-3xl font-bold text-[#2c5530] mb-2">{sampleData.length.toLocaleString()}</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">إجمالي الضمانات</div>
                <div className="text-blue-600 text-sm">نشط: {activeCount} | قيد المراجعة: {pendingCount}</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 text-center border-r-4 border-[#2c5530] shadow-lg">
                <div className="text-3xl font-bold text-[#2c5530] mb-2">{(totalValue / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">القيمة الإجمالية (ريال)</div>
                <div className="text-green-600 text-sm">متوسط القيمة: {(totalValue / sampleData.length / 1000).toFixed(0)}K</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 text-center border-r-4 border-[#2c5530] shadow-lg">
                <div className="text-3xl font-bold text-[#2c5530] mb-2">{((activeCount / sampleData.length) * 100).toFixed(1)}%</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">معدل التفعيل</div>
                <div className="text-orange-600 text-sm">أنواع الضمانات: 3</div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="lg:col-span-3 bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-5 pb-4 border-b-2 border-gray-100">
              <div className="w-10 h-10 bg-[#9b59b6] rounded-lg flex items-center justify-center ml-4 text-white text-xl">
                📋
              </div>
              <h3 className="text-lg font-semibold text-[#2c3e50]">أحدث الضمانات المضافة</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 text-right font-semibold text-[#2c3e50] border-b-2 border-gray-200">رقم الضمان</th>
                    <th className="p-4 text-right font-semibold text-[#2c3e50] border-b-2 border-gray-200">نوع الضمان</th>
                    <th className="p-4 text-right font-semibold text-[#2c3e50] border-b-2 border-gray-200">القيمة</th>
                    <th className="p-4 text-right font-semibold text-[#2c3e50] border-b-2 border-gray-200">تاريخ الإصدار</th>
                    <th className="p-4 text-right font-semibold text-[#2c3e50] border-b-2 border-gray-200">تاريخ الانتهاء</th>
                    <th className="p-4 text-right font-semibold text-[#2c3e50] border-b-2 border-gray-200">الحالة</th>
                    <th className="p-4 text-right font-semibold text-[#2c3e50] border-b-2 border-gray-200">البنك</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleData.map((guarantee) => (
                    <tr key={guarantee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 border-b border-gray-100">{guarantee.guarantee_number}</td>
                      <td className="p-3 border-b border-gray-100">{guarantee.guarantee_type}</td>
                      <td className="p-3 border-b border-gray-100">{guarantee.value.toLocaleString()} {guarantee.currency}</td>
                      <td className="p-3 border-b border-gray-100">{new Date(guarantee.issue_date).toLocaleDateString('ar-SA')}</td>
                      <td className="p-3 border-b border-gray-100">{new Date(guarantee.expiry_date).toLocaleDateString('ar-SA')}</td>
                      <td className="p-3 border-b border-gray-100">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          guarantee.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : guarantee.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {guarantee.status === 'active' ? 'نشط' : guarantee.status === 'pending' ? 'قيد المراجعة' : 'منتهي الصلاحية'}
                        </span>
                      </td>
                      <td className="p-3 border-b border-gray-100">{guarantee.bank_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}