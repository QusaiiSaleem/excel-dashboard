# Bank Guarantees Dashboard - Comprehensive Implementation Plan

## Overview
This plan transforms the existing static HTML dashboard into a fully functional real-time dashboard using Next.js 15.4.6, Supabase, and Chart.js, maintaining the exact Arabic UI while adding modern real-time capabilities.

## Current Project Analysis
- **Framework**: Next.js 15.4.6 with App Router
- **Styling**: Tailwind CSS v4
- **TypeScript**: ✅ Configured
- **Existing Component**: `SampleDashboard.tsx` with mock data and Arabic UI

---

## 1. Database Setup & Migration

### 1.1 Create Supabase Tables

#### Main Tables Schema
```sql
-- Bank Guarantees Main Table
CREATE TABLE public.bank_guarantees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guarantee_number VARCHAR(50) UNIQUE NOT NULL,
    guarantee_type VARCHAR(100) NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SAR' NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired')),
    bank_name VARCHAR(200) NOT NULL,
    description TEXT,
    beneficiary VARCHAR(200),
    project_reference VARCHAR(100),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Trail Table
CREATE TABLE public.guarantee_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guarantee_id UUID REFERENCES public.bank_guarantees(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File Attachments Table
CREATE TABLE public.guarantee_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guarantee_id UUID REFERENCES public.bank_guarantees(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 1.2 Row Level Security (RLS) Setup
```sql
-- Enable RLS
ALTER TABLE public.bank_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guarantee_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guarantee_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow authenticated users to read/write)
CREATE POLICY "Enable read access for authenticated users" ON public.bank_guarantees
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.bank_guarantees
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON public.bank_guarantees
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON public.bank_guarantees
    FOR DELETE TO authenticated USING (true);

-- Similar policies for other tables
CREATE POLICY "Enable read access for authenticated users" ON public.guarantee_audit
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON public.guarantee_attachments
    FOR SELECT TO authenticated USING (true);

-- Realtime Authorization Policy
CREATE POLICY "Authenticated users can receive broadcasts"
ON "realtime"."messages"
FOR SELECT TO authenticated
USING (true);
```

### 1.3 Sample Data Migration
```sql
-- Insert sample data matching the original HTML
INSERT INTO public.bank_guarantees (
    guarantee_number, guarantee_type, value, currency, issue_date, expiry_date, 
    status, bank_name, beneficiary, project_reference
) VALUES 
('BG-2025-001', 'ضمان أداء', 2500000, 'SAR', '2025-01-15', '2025-12-15', 'active', 'البنك الأهلي', 'أمانة منطقة الرياض', 'PRJ-2025-001'),
('BG-2025-002', 'ضمان ابتدائي', 1200000, 'SAR', '2025-01-20', '2025-06-20', 'pending', 'بنك الرياض', 'أمانة منطقة الرياض', 'PRJ-2025-002'),
('BG-2025-003', 'ضمان نهائي', 800000, 'SAR', '2025-01-25', '2026-01-25', 'active', 'البنك السعودي الفرنسي', 'أمانة منطقة الرياض', 'PRJ-2025-003'),
('BG-2025-004', 'ضمان دفعة مقدمة', 1500000, 'SAR', '2025-01-10', '2025-08-10', 'active', 'بنك الجزيرة', 'أمانة منطقة الرياض', 'PRJ-2025-004'),
('BG-2025-005', 'ضمان صيانة', 300000, 'SAR', '2025-02-01', '2026-02-01', 'pending', 'البنك الأهلي التجاري', 'أمانة منطقة الرياض', 'PRJ-2025-005');
```

### 1.4 Realtime Configuration
```sql
-- Configure Realtime Publication
BEGIN;
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Add tables to publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_guarantees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guarantee_audit;

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bank_guarantees_updated_at 
    BEFORE UPDATE ON public.bank_guarantees 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

## 2. Dependencies Installation

### 2.1 Required Packages
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.48.0",
    "chart.js": "^4.4.1",
    "react-chartjs-2": "^5.2.0",
    "date-fns": "^3.6.0",
    "react-hook-form": "^7.48.2",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4",
    "papaparse": "^5.4.1",
    "file-saver": "^2.0.5",
    "react-hot-toast": "^2.4.1",
    "lucide-react": "^0.445.0"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14",
    "@types/file-saver": "^2.0.7"
  }
}
```

### 2.2 Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 3. Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Main dashboard page
├── components/
│   ├── dashboard/
│   │   ├── DashboardHeader.tsx       # Header component
│   │   ├── KPICards.tsx             # Statistics cards
│   │   ├── ChartsSection.tsx        # Charts container
│   │   ├── DataTable.tsx            # Real-time data table
│   │   └── ActionsToolbar.tsx       # CRUD action buttons
│   ├── forms/
│   │   ├── GuaranteeForm.tsx        # Add/Edit form
│   │   └── CSVImportForm.tsx        # CSV import form
│   ├── charts/
│   │   ├── PieChart.tsx             # Status distribution
│   │   └── LineChart.tsx            # Value trends
│   ├── modals/
│   │   ├── Modal.tsx                # Base modal component
│   │   ├── GuaranteeModal.tsx       # Guarantee details modal
│   │   └── ConfirmModal.tsx         # Confirmation modal
│   └── ui/
│       ├── LoadingSpinner.tsx       # Loading states
│       └── ErrorBoundary.tsx        # Error handling
├── lib/
│   ├── supabase.ts                  # Supabase client
│   ├── database.ts                  # Database operations
│   ├── realtime.ts                  # Realtime subscriptions
│   ├── csv-utils.ts                 # CSV import/export
│   └── validation.ts                # Zod schemas
├── hooks/
│   ├── useGuarantees.ts             # Data fetching hook
│   ├── useRealtime.ts               # Realtime hook
│   └── useCSV.ts                    # CSV operations hook
├── types/
│   └── database.ts                  # TypeScript types
└── utils/
    ├── formatters.ts                # Data formatting
    └── constants.ts                 # App constants
```

---

## 4. Real-time Dashboard with Charts Implementation

### 4.1 Supabase Client Setup
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

### 4.2 Real-time Hook
```typescript
// hooks/useRealtime.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { BankGuarantee } from '@/types/database'

export function useRealtime() {
  const [guarantees, setGuarantees] = useState<BankGuarantee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        const { data, error } = await supabase
          .from('bank_guarantees')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setGuarantees(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()

    // Set up real-time subscription
    const channel = supabase
      .channel('bank-guarantees-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_guarantees'
        },
        (payload) => {
          console.log('Real-time update:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              setGuarantees(prev => [payload.new as BankGuarantee, ...prev])
              break
              
            case 'UPDATE':
              setGuarantees(prev => 
                prev.map(guarantee => 
                  guarantee.id === payload.new.id 
                    ? { ...guarantee, ...payload.new }
                    : guarantee
                )
              )
              break
              
            case 'DELETE':
              setGuarantees(prev => 
                prev.filter(guarantee => guarantee.id !== payload.old.id)
              )
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { guarantees, loading, error, setGuarantees }
}
```

### 4.3 Chart Components
```typescript
// components/charts/PieChart.tsx
'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import type { BankGuarantee } from '@/types/database'

ChartJS.register(ArcElement, Tooltip, Legend)

interface PieChartProps {
  guarantees: BankGuarantee[]
}

export default function PieChart({ guarantees }: PieChartProps) {
  const statusCounts = guarantees.reduce((acc, guarantee) => {
    acc[guarantee.status] = (acc[guarantee.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const data = {
    labels: ['نشط', 'قيد المراجعة', 'منتهي الصلاحية'],
    datasets: [{
      data: [
        statusCounts.active || 0,
        statusCounts.pending || 0,
        statusCounts.expired || 0
      ],
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
      borderColor: ['#16a34a', '#d97706', '#dc2626'],
      borderWidth: 1
    }]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        rtl: true,
        labels: {
          font: {
            family: 'Cairo, Arial, sans-serif'
          }
        }
      },
      tooltip: {
        rtl: true,
        titleFont: {
          family: 'Cairo, Arial, sans-serif'
        },
        bodyFont: {
          family: 'Cairo, Arial, sans-serif'
        }
      }
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-[#2c3e50] mb-4 text-right">
        توزيع الضمانات حسب الحالة
      </h3>
      <div className="h-64">
        <Pie data={data} options={options} />
      </div>
    </div>
  )
}
```

### 4.4 KPI Cards Component
```typescript
// components/dashboard/KPICards.tsx
'use client'

import type { BankGuarantee } from '@/types/database'

interface KPICardsProps {
  guarantees: BankGuarantee[]
  loading: boolean
}

export default function KPICards({ guarantees, loading }: KPICardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg p-6 border-r-4 border-[#2c5530] shadow-lg animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  const totalValue = guarantees.reduce((sum, g) => sum + Number(g.value), 0)
  const activeCount = guarantees.filter(g => g.status === 'active').length
  const pendingCount = guarantees.filter(g => g.status === 'pending').length
  const activationRate = guarantees.length > 0 ? (activeCount / guarantees.length) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      <div className="bg-white rounded-lg p-6 text-center border-r-4 border-[#2c5530] shadow-lg hover:shadow-xl transition-shadow">
        <div className="text-3xl font-bold text-[#2c5530] mb-2">
          {guarantees.length.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">
          إجمالي الضمانات
        </div>
        <div className="text-blue-600 text-sm">
          نشط: {activeCount} | قيد المراجعة: {pendingCount}
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 text-center border-r-4 border-[#2c5530] shadow-lg hover:shadow-xl transition-shadow">
        <div className="text-3xl font-bold text-[#2c5530] mb-2">
          {(totalValue / 1000000).toFixed(1)}M
        </div>
        <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">
          القيمة الإجمالية (ريال)
        </div>
        <div className="text-green-600 text-sm">
          متوسط القيمة: {guarantees.length > 0 ? (totalValue / guarantees.length / 1000).toFixed(0) : 0}K
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 text-center border-r-4 border-[#2c5530] shadow-lg hover:shadow-xl transition-shadow">
        <div className="text-3xl font-bold text-[#2c5530] mb-2">
          {activationRate.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">
          معدل التفعيل
        </div>
        <div className="text-orange-600 text-sm">
          أنواع الضمانات: {new Set(guarantees.map(g => g.guarantee_type)).size}
        </div>
      </div>
    </div>
  )
}
```

---

## 5. CRUD Operations Implementation

### 5.1 Database Operations
```typescript
// lib/database.ts
import { supabase } from './supabase'
import type { BankGuarantee, GuaranteeInsert, GuaranteeUpdate } from '@/types/database'

export class GuaranteeService {
  static async getAll(): Promise<BankGuarantee[]> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  }

  static async getById(id: string): Promise<BankGuarantee | null> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data
  }

  static async create(guarantee: GuaranteeInsert): Promise<BankGuarantee> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .insert(guarantee)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  static async update(id: string, updates: GuaranteeUpdate): Promise<BankGuarantee> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('bank_guarantees')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  }

  static async bulkInsert(guarantees: GuaranteeInsert[]): Promise<BankGuarantee[]> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .insert(guarantees)
      .select()

    if (error) throw new Error(error.message)
    return data || []
  }
}
```

### 5.2 Guarantee Form Component
```typescript
// components/forms/GuaranteeForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { GuaranteeService } from '@/lib/database'
import type { BankGuarantee } from '@/types/database'

const guaranteeSchema = z.object({
  guarantee_number: z.string().min(1, 'رقم الضمان مطلوب'),
  guarantee_type: z.string().min(1, 'نوع الضمان مطلوب'),
  value: z.number().min(1, 'القيمة يجب أن تكون أكبر من صفر'),
  currency: z.string().default('SAR'),
  issue_date: z.string().min(1, 'تاريخ الإصدار مطلوب'),
  expiry_date: z.string().min(1, 'تاريخ الانتهاء مطلوب'),
  status: z.enum(['active', 'pending', 'expired']),
  bank_name: z.string().min(1, 'اسم البنك مطلوب'),
  beneficiary: z.string().optional(),
  description: z.string().optional()
})

type GuaranteeFormData = z.infer<typeof guaranteeSchema>

interface GuaranteeFormProps {
  guarantee?: BankGuarantee
  onSuccess: () => void
  onCancel: () => void
}

export default function GuaranteeForm({ 
  guarantee, 
  onSuccess, 
  onCancel 
}: GuaranteeFormProps) {
  const [loading, setLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<GuaranteeFormData>({
    resolver: zodResolver(guaranteeSchema),
    defaultValues: guarantee ? {
      guarantee_number: guarantee.guarantee_number,
      guarantee_type: guarantee.guarantee_type,
      value: Number(guarantee.value),
      currency: guarantee.currency,
      issue_date: guarantee.issue_date,
      expiry_date: guarantee.expiry_date,
      status: guarantee.status,
      bank_name: guarantee.bank_name,
      beneficiary: guarantee.beneficiary || '',
      description: guarantee.description || ''
    } : {
      currency: 'SAR',
      status: 'pending' as const
    }
  })

  const onSubmit = async (data: GuaranteeFormData) => {
    setLoading(true)
    
    try {
      if (guarantee) {
        await GuaranteeService.update(guarantee.id, data)
        toast.success('تم تحديث الضمان بنجاح')
      } else {
        await GuaranteeService.create(data)
        toast.success('تم إضافة الضمان بنجاح')
      }
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            رقم الضمان
          </label>
          <input
            type="text"
            {...register('guarantee_number')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c5530]"
          />
          {errors.guarantee_number && (
            <p className="text-red-500 text-sm mt-1">
              {errors.guarantee_number.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            نوع الضمان
          </label>
          <select
            {...register('guarantee_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c5530]"
          >
            <option value="">اختر نوع الضمان</option>
            <option value="ضمان أداء">ضمان أداء</option>
            <option value="ضمان ابتدائي">ضمان ابتدائي</option>
            <option value="ضمان نهائي">ضمان نهائي</option>
            <option value="ضمان دفعة مقدمة">ضمان دفعة مقدمة</option>
            <option value="ضمان صيانة">ضمان صيانة</option>
          </select>
          {errors.guarantee_type && (
            <p className="text-red-500 text-sm mt-1">
              {errors.guarantee_type.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            القيمة
          </label>
          <input
            type="number"
            step="0.01"
            {...register('value', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c5530]"
          />
          {errors.value && (
            <p className="text-red-500 text-sm mt-1">
              {errors.value.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الحالة
          </label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c5530]"
          >
            <option value="pending">قيد المراجعة</option>
            <option value="active">نشط</option>
            <option value="expired">منتهي الصلاحية</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            تاريخ الإصدار
          </label>
          <input
            type="date"
            {...register('issue_date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c5530]"
          />
          {errors.issue_date && (
            <p className="text-red-500 text-sm mt-1">
              {errors.issue_date.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            تاريخ الانتهاء
          </label>
          <input
            type="date"
            {...register('expiry_date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c5530]"
          />
          {errors.expiry_date && (
            <p className="text-red-500 text-sm mt-1">
              {errors.expiry_date.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          اسم البنك
        </label>
        <input
          type="text"
          {...register('bank_name')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c5530]"
        />
        {errors.bank_name && (
          <p className="text-red-500 text-sm mt-1">
            {errors.bank_name.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          المستفيد
        </label>
        <input
          type="text"
          {...register('beneficiary')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c5530]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          الوصف
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c5530]"
        />
      </div>

      <div className="flex justify-end space-x-reverse space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#2c5530] text-white rounded-md hover:bg-[#1e3a20] disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'جاري الحفظ...' : guarantee ? 'تحديث' : 'إضافة'}
        </button>
      </div>
    </form>
  )
}
```

---

## 6. CSV Import/Export Implementation

### 6.1 CSV Utilities
```typescript
// lib/csv-utils.ts
import Papa from 'papaparse'
import { saveAs } from 'file-saver'
import type { BankGuarantee, GuaranteeInsert } from '@/types/database'

export interface CSVGuarantee {
  guarantee_number: string
  guarantee_type: string
  value: string
  currency: string
  issue_date: string
  expiry_date: string
  status: 'active' | 'pending' | 'expired'
  bank_name: string
  beneficiary?: string
  description?: string
}

export class CSVService {
  static async parseCSV(file: File): Promise<GuaranteeInsert[]> {
    return new Promise((resolve, reject) => {
      Papa.parse<CSVGuarantee>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Map Arabic headers to English
          const headerMap: Record<string, string> = {
            'رقم الضمان': 'guarantee_number',
            'نوع الضمان': 'guarantee_type',
            'القيمة': 'value',
            'العملة': 'currency',
            'تاريخ الإصدار': 'issue_date',
            'تاريخ الانتهاء': 'expiry_date',
            'الحالة': 'status',
            'اسم البنك': 'bank_name',
            'المستفيد': 'beneficiary',
            'الوصف': 'description'
          }
          return headerMap[header] || header
        },
        transform: (value, field) => {
          // Transform status values
          if (field === 'status') {
            const statusMap: Record<string, string> = {
              'نشط': 'active',
              'قيد المراجعة': 'pending',
              'منتهي الصلاحية': 'expired'
            }
            return statusMap[value] || value
          }
          return value
        },
        complete: (results) => {
          try {
            const guarantees: GuaranteeInsert[] = results.data
              .filter(row => row.guarantee_number && row.guarantee_type)
              .map(row => ({
                guarantee_number: row.guarantee_number,
                guarantee_type: row.guarantee_type,
                value: parseFloat(row.value.replace(/,/g, '')),
                currency: row.currency || 'SAR',
                issue_date: row.issue_date,
                expiry_date: row.expiry_date,
                status: row.status,
                bank_name: row.bank_name,
                beneficiary: row.beneficiary || null,
                description: row.description || null
              }))

            resolve(guarantees)
          } catch (error) {
            reject(new Error('خطأ في تحليل ملف CSV'))
          }
        },
        error: (error) => {
          reject(new Error(`خطأ في قراءة الملف: ${error.message}`))
        }
      })
    })
  }

  static exportToCSV(guarantees: BankGuarantee[], filename = 'bank_guarantees') {
    const csvData = guarantees.map(guarantee => ({
      'رقم الضمان': guarantee.guarantee_number,
      'نوع الضمان': guarantee.guarantee_type,
      'القيمة': guarantee.value.toLocaleString(),
      'العملة': guarantee.currency,
      'تاريخ الإصدار': guarantee.issue_date,
      'تاريخ الانتهاء': guarantee.expiry_date,
      'الحالة': guarantee.status === 'active' ? 'نشط' 
        : guarantee.status === 'pending' ? 'قيد المراجعة' 
        : 'منتهي الصلاحية',
      'اسم البنك': guarantee.bank_name,
      'المستفيد': guarantee.beneficiary || '',
      'الوصف': guarantee.description || '',
      'تاريخ الإنشاء': new Date(guarantee.created_at).toLocaleDateString('ar-SA')
    }))

    const csv = Papa.unparse(csvData, {
      encoding: 'utf-8'
    })

    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8'
    })

    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  }

  static generateTemplate() {
    const template = [{
      'رقم الضمان': 'BG-2025-001',
      'نوع الضمان': 'ضمان أداء',
      'القيمة': '1000000',
      'العملة': 'SAR',
      'تاريخ الإصدار': '2025-01-01',
      'تاريخ الانتهاء': '2025-12-31',
      'الحالة': 'نشط',
      'اسم البنك': 'البنك الأهلي',
      'المستفيد': 'أمانة منطقة الرياض',
      'الوصف': 'وصف الضمان'
    }]

    const csv = Papa.unparse(template, { encoding: 'utf-8' })
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8'
    })

    saveAs(blob, 'template_bank_guarantees.csv')
  }
}
```

### 6.2 CSV Import Component
```typescript
// components/forms/CSVImportForm.tsx
'use client'

import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { Upload, Download, FileText } from 'lucide-react'
import { CSVService } from '@/lib/csv-utils'
import { GuaranteeService } from '@/lib/database'

interface CSVImportFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function CSVImportForm({ onSuccess, onCancel }: CSVImportFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('يرجى اختيار ملف CSV فقط')
      return
    }

    setFile(selectedFile)

    try {
      const guarantees = await CSVService.parseCSV(selectedFile)
      setPreview(guarantees.slice(0, 5)) // Show first 5 rows for preview
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطأ في قراءة الملف')
      setFile(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    try {
      const guarantees = await CSVService.parseCSV(file)
      
      if (guarantees.length === 0) {
        toast.error('لم يتم العثور على بيانات صحيحة في الملف')
        return
      }

      await GuaranteeService.bulkInsert(guarantees)
      toast.success(`تم استيراد ${guarantees.length} ضمان بنجاح`)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل في استيراد البيانات')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          استيراد الضمانات من ملف CSV
        </h3>
        <p className="text-gray-600 text-sm">
          اختر ملف CSV يحتوي على بيانات الضمانات البنكية
        </p>
      </div>

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        {!file ? (
          <>
            <p className="text-gray-600 mb-4">
              اسحب الملف هنا أو انقر لاختيار ملف CSV
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#2c5530] text-white px-4 py-2 rounded-md hover:bg-[#1e3a20] transition-colors"
            >
              اختيار ملف
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <FileText className="mx-auto h-8 w-8 text-green-600" />
            <p className="text-green-600 font-medium">{file.name}</p>
            <p className="text-sm text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              type="button"
              onClick={() => {
                setFile(null)
                setPreview([])
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              إزالة الملف
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Template Download */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">تحتاج إلى قالب؟</h4>
            <p className="text-blue-700 text-sm">
              قم بتحميل قالب CSV مع الأعمدة المطلوبة
            </p>
          </div>
          <button
            type="button"
            onClick={CSVService.generateTemplate}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>تحميل القالب</span>
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="border rounded-md">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h4 className="font-medium text-gray-900">معاينة البيانات (أول 5 صفوف)</h4>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right pb-2">رقم الضمان</th>
                  <th className="text-right pb-2">النوع</th>
                  <th className="text-right pb-2">القيمة</th>
                  <th className="text-right pb-2">البنك</th>
                  <th className="text-right pb-2">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{row.guarantee_number}</td>
                    <td className="py-2">{row.guarantee_type}</td>
                    <td className="py-2">{row.value?.toLocaleString()}</td>
                    <td className="py-2">{row.bank_name}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        row.status === 'active' ? 'bg-green-100 text-green-800' :
                        row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {row.status === 'active' ? 'نشط' : 
                         row.status === 'pending' ? 'قيد المراجعة' : 
                         'منتهي الصلاحية'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-reverse space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={!file || loading}
          className="px-4 py-2 bg-[#2c5530] text-white rounded-md hover:bg-[#1e3a20] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري الاستيراد...' : 'استيراد البيانات'}
        </button>
      </div>
    </div>
  )
}
```

---

## 7. Performance Optimization Strategies

### 7.1 Caching Strategy
```typescript
// lib/cache.ts
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private TTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }
}

export const cache = new CacheManager()
```

### 7.2 Optimized Database Queries
```typescript
// lib/database-optimized.ts
import { supabase } from './supabase'
import { cache } from './cache'

export class OptimizedGuaranteeService {
  static async getGuarantees(filters?: {
    status?: string
    bank_name?: string
    date_range?: { start: string; end: string }
  }) {
    const cacheKey = `guarantees_${JSON.stringify(filters)}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    let query = supabase
      .from('bank_guarantees')
      .select('*')

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.bank_name) {
      query = query.ilike('bank_name', `%${filters.bank_name}%`)
    }

    if (filters?.date_range) {
      query = query
        .gte('issue_date', filters.date_range.start)
        .lte('issue_date', filters.date_range.end)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    cache.set(cacheKey, data)
    return data || []
  }

  static async getStats() {
    const cacheKey = 'guarantee_stats'
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .rpc('get_guarantee_stats') // Custom SQL function

    if (error) throw new Error(error.message)

    cache.set(cacheKey, data)
    return data
  }
}
```

### 7.3 Custom SQL Functions for Performance
```sql
-- Custom RPC function for statistics
CREATE OR REPLACE FUNCTION get_guarantee_stats()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'total_count', (SELECT COUNT(*) FROM bank_guarantees),
    'active_count', (SELECT COUNT(*) FROM bank_guarantees WHERE status = 'active'),
    'pending_count', (SELECT COUNT(*) FROM bank_guarantees WHERE status = 'pending'),
    'expired_count', (SELECT COUNT(*) FROM bank_guarantees WHERE status = 'expired'),
    'total_value', (SELECT SUM(value) FROM bank_guarantees),
    'active_value', (SELECT SUM(value) FROM bank_guarantees WHERE status = 'active'),
    'banks_count', (SELECT COUNT(DISTINCT bank_name) FROM bank_guarantees),
    'guarantee_types', (
      SELECT json_agg(json_build_object('type', guarantee_type, 'count', count))
      FROM (
        SELECT guarantee_type, COUNT(*) as count 
        FROM bank_guarantees 
        GROUP BY guarantee_type
      ) t
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 8. Security Considerations

### 8.1 Row Level Security Enhancements
```sql
-- More granular RLS policies
CREATE POLICY "Users can read own organization data" ON public.bank_guarantees
  FOR SELECT TO authenticated
  USING (
    beneficiary = (
      SELECT organization 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Audit policy
CREATE POLICY "Users can read audit logs" ON public.guarantee_audit
  FOR SELECT TO authenticated
  USING (
    guarantee_id IN (
      SELECT id FROM public.bank_guarantees 
      WHERE beneficiary = (
        SELECT organization 
        FROM auth.users 
        WHERE id = auth.uid()
      )
    )
  );
```

### 8.2 Input Validation & Sanitization
```typescript
// lib/validation.ts
import { z } from 'zod'

export const guaranteeNumberRegex = /^BG-\d{4}-\d{3}$/
export const saudiPhoneRegex = /^(\+966|966|0)?[5][0-9]{8}$/

export const guaranteeValidationSchema = z.object({
  guarantee_number: z.string()
    .regex(guaranteeNumberRegex, 'رقم الضمان يجب أن يكون بالصيغة: BG-YYYY-XXX'),
  
  guarantee_type: z.enum([
    'ضمان أداء',
    'ضمان ابتدائي', 
    'ضمان نهائي',
    'ضمان دفعة مقدمة',
    'ضمان صيانة'
  ], { errorMap: () => ({ message: 'نوع ضمان غير صحيح' }) }),

  value: z.number()
    .min(1000, 'القيمة الدنيا هي 1000 ريال')
    .max(100000000, 'القيمة القصوى هي 100 مليون ريال'),

  bank_name: z.string()
    .min(2, 'اسم البنك يجب أن يحتوي على حرفين على الأقل')
    .max(200, 'اسم البنك طويل جداً'),

  issue_date: z.string()
    .refine(date => new Date(date) <= new Date(), {
      message: 'تاريخ الإصدار لا يمكن أن يكون في المستقبل'
    }),

  expiry_date: z.string()
    .refine((date, ctx) => {
      const issueDate = ctx.parent.issue_date
      if (issueDate) {
        return new Date(date) > new Date(issueDate)
      }
      return true
    }, { message: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار' })
})

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
}
```

---

## 9. Step-by-Step Implementation Order

### Phase 1: Foundation (Days 1-2)
1. **Install Dependencies**: Add all required packages
2. **Environment Setup**: Configure Supabase credentials
3. **Database Schema**: Create tables, RLS policies, and sample data
4. **Type Definitions**: Define TypeScript interfaces

### Phase 2: Core Infrastructure (Days 3-4)
1. **Supabase Client**: Configure client with proper settings
2. **Database Service**: Implement CRUD operations
3. **Real-time Hook**: Create real-time subscription hook
4. **Basic Components**: Header, loading states, error boundaries

### Phase 3: Dashboard Implementation (Days 5-7)
1. **KPI Cards**: Statistics with real-time updates
2. **Chart Components**: Pie and line charts with Chart.js
3. **Data Table**: Real-time table with search and filters
4. **Main Dashboard**: Integrate all components

### Phase 4: CRUD Operations (Days 8-10)
1. **Guarantee Form**: Add/edit form with validation
2. **Modal System**: Reusable modal components
3. **Actions Integration**: Connect forms to database
4. **Error Handling**: Comprehensive error management

### Phase 5: CSV Operations (Days 11-12)
1. **CSV Utilities**: Parse and export functionality
2. **Import Component**: File upload with preview
3. **Export Features**: Generate CSV downloads
4. **Template Generation**: Create CSV templates

### Phase 6: Optimization & Polish (Days 13-14)
1. **Performance**: Caching and query optimization
2. **Security**: Enhanced validation and RLS
3. **Testing**: Comprehensive testing
4. **Documentation**: Code documentation and user guides

---

## 10. Best Practices Summary

### Database Best Practices
- Use indexes on frequently queried columns
- Implement proper RLS policies
- Use transactions for bulk operations
- Regular database maintenance

### Real-time Best Practices
- Limit subscription scope with filters
- Implement proper cleanup in useEffect
- Use debouncing for rapid updates
- Handle connection states gracefully

### Performance Best Practices
- Implement caching strategies
- Use pagination for large datasets
- Optimize Supabase queries
- Lazy load components when possible

### Security Best Practices
- Validate all inputs client and server-side
- Use parameterized queries
- Implement proper authentication
- Regular security audits

### Code Quality Best Practices
- Use TypeScript strictly
- Implement proper error boundaries
- Write comprehensive tests
- Follow consistent naming conventions
- Use ESLint and Prettier for code consistency

---

## Conclusion

This implementation plan provides a comprehensive roadmap for building a modern, real-time Bank Guarantees Dashboard that maintains the exact Arabic UI from the original HTML while adding powerful real-time capabilities. The plan emphasizes:

1. **Scalability**: Proper database design and caching strategies
2. **Performance**: Optimized queries and real-time subscriptions
3. **Security**: Comprehensive RLS policies and input validation
4. **Maintainability**: Clean code structure and TypeScript usage
5. **User Experience**: Smooth real-time updates and intuitive interface

The phased approach ensures steady progress while maintaining code quality and allowing for testing at each stage.