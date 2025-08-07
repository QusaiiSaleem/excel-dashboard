export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bank_guarantees: {
        Row: {
          id: string
          guarantee_number: string
          guarantee_type: string
          value: number
          currency: string
          issue_date: string
          expiry_date: string
          status: 'active' | 'pending' | 'expired'
          bank_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guarantee_number: string
          guarantee_type: string
          value: number
          currency?: string
          issue_date: string
          expiry_date: string
          status?: 'active' | 'pending' | 'expired'
          bank_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guarantee_number?: string
          guarantee_type?: string
          value?: number
          currency?: string
          issue_date?: string
          expiry_date?: string
          status?: 'active' | 'pending' | 'expired'
          bank_name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}