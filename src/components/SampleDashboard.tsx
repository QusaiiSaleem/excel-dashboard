'use client'

import React, { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { useBankGuarantees } from '@/hooks/useBankGuarantees';
import { useStatistics } from '@/hooks/useStatistics';
import AddGuaranteeForm from './AddGuaranteeForm';
import CSVImportModal from './CSVImportModal';
import EditGuaranteeModal from './EditGuaranteeModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { exportToCSV, downloadCSVTemplate } from '@/lib/csvUtils';
import type { BankGuarantee } from '@/lib/supabase/database';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
);

const SampleDashboard = () => {
  const { guarantees, loading: guaranteesLoading, error: guaranteesError, refresh } = useBankGuarantees();
  const { statistics, loading: statsLoading, error: statsError } = useStatistics();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingGuarantee, setEditingGuarantee] = useState<BankGuarantee | null>(null);
  const [deletingGuarantee, setDeletingGuarantee] = useState<BankGuarantee | null>(null);

  const loading = guaranteesLoading || statsLoading;
  const error = guaranteesError || statsError;

  // Prepare chart data
  const pieChartData = {
    labels: statistics ? Object.keys(statistics.typeDistribution) : [],
    datasets: [{
      data: statistics ? Object.values(statistics.typeDistribution) : [],
      backgroundColor: ['#2c5530', '#3498db', '#e74c3c', '#f39c12'],
      borderWidth: 0,
      hoverBorderWidth: 3,
      hoverBorderColor: '#fff'
    }]
  };

  const lineChartData = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [{
      label: 'عدد الضمانات',
      data: [120, 150, 180, 140, 200, statistics?.total || 0],
      borderColor: '#2c5530',
      backgroundColor: 'rgba(44, 85, 48, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#2c5530',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6
    }]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#2c5530] mx-auto mb-4"></div>
          <p className="text-[#2c5530] text-lg">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2]" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2c5530] to-[#1e3a20] text-white p-5 text-center shadow-lg">
        <h1 className="text-3xl font-bold mb-2">لوحة بيانات الضمانات البنكية التفصيلية</h1>
        <p className="text-lg opacity-90">أمانة منطقة الرياض - إدارة الشؤون المالية</p>
      </div>

      {/* Dashboard */}
      <div className="max-w-7xl mx-auto py-8 px-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KPI Cards */}
          {/* KPI Cards */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div className="bg-white rounded-lg p-6 text-center border-r-4 border-[#2c5530] shadow-lg">
                <div className="text-3xl font-bold text-[#2c5530] mb-2">{statistics?.total.toLocaleString() || 0}</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">إجمالي الضمانات</div>
                <div className="text-blue-600 text-sm">نشط: {statistics?.activeCount || 0} | قيد المراجعة: {statistics?.pendingCount || 0}</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 text-center border-r-4 border-[#2c5530] shadow-lg">
                <div className="text-3xl font-bold text-[#2c5530] mb-2">{((statistics?.totalValue || 0) / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">القيمة الإجمالية (ريال)</div>
                <div className="text-green-600 text-sm">متوسط القيمة: {((statistics?.totalValue || 0) / (statistics?.total || 1) / 1000).toFixed(0)}K</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 text-center border-r-4 border-[#2c5530] shadow-lg">
                <div className="text-3xl font-bold text-[#2c5530] mb-2">{statistics && statistics.total > 0 ? ((statistics.activeCount / statistics.total) * 100).toFixed(1) : 0}%</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">معدل التفعيل</div>
                <div className="text-orange-600 text-sm">أنواع الضمانات: {statistics ? Object.keys(statistics.typeDistribution).length : 0}</div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow lg:col-span-2">
            <div className="flex items-center mb-5 pb-4 border-b-2 border-gray-100">
              <div className="w-10 h-10 bg-[#3498db] rounded-lg flex items-center justify-center ml-4 text-white text-xl">
                📊
              </div>
              <h3 className="text-lg font-semibold text-[#2c3e50]">توزيع الضمانات حسب النوع</h3>
            </div>
            <div className="h-64">
              <Pie 
                data={pieChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                      labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                          size: 14
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-5 pb-4 border-b-2 border-gray-100">
              <div className="w-10 h-10 bg-[#e74c3c] rounded-lg flex items-center justify-center ml-4 text-white text-xl">
                📈
              </div>
              <h3 className="text-lg font-semibold text-[#2c3e50]">اتجاه الضمانات الشهري</h3>
            </div>
            <div className="h-64">
              <Line 
                data={lineChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: '#f1f3f4'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="lg:col-span-3 mb-6">
              <AddGuaranteeForm 
                onSuccess={() => {
                  setShowAddForm(false)
                  refresh()
                }}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Data Table */}
          <div className="lg:col-span-3 bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-100">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#9b59b6] rounded-lg flex items-center justify-center ml-4 text-white text-xl">
                  📋
                </div>
                <h3 className="text-lg font-semibold text-[#2c3e50]">أحدث الضمانات المضافة</h3>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-[#2c5530] text-white px-4 py-2 rounded-lg hover:bg-[#1e3a20] transition-colors text-sm"
                >
                  {showAddForm ? 'إخفاء النموذج' : 'إضافة ضمان'}
                </button>
                
                <button
                  onClick={() => exportToCSV(guarantees)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  تصدير CSV
                </button>
                
                <button
                  onClick={downloadCSVTemplate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  تحميل قالب
                </button>
                
                <button
                  onClick={() => setShowImportModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  استيراد CSV
                </button>
              </div>
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
                    <th className="p-4 text-right font-semibold text-[#2c3e50] border-b-2 border-gray-200">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {guarantees.map((guarantee) => (
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
                      <td className="p-3 border-b border-gray-100">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingGuarantee(guarantee)}
                            className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                            title="تعديل"
                          >
                            ✏️ تعديل
                          </button>
                          <button
                            onClick={() => setDeletingGuarantee(guarantee)}
                            className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors"
                            title="حذف"
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modals */}
        <CSVImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            refresh()
            setShowImportModal(false)
          }}
        />

        <EditGuaranteeModal
          guarantee={editingGuarantee}
          isOpen={!!editingGuarantee}
          onClose={() => setEditingGuarantee(null)}
          onSuccess={() => {
            refresh()
            setEditingGuarantee(null)
          }}
        />

        <DeleteConfirmModal
          guarantee={deletingGuarantee}
          isOpen={!!deletingGuarantee}
          onClose={() => setDeletingGuarantee(null)}
          onSuccess={() => {
            refresh()
            setDeletingGuarantee(null)
          }}
        />
      </div>
    </div>
  );
};

export default SampleDashboard;