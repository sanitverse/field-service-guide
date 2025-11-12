import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔧 API: Fetching technicians...')
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'technician')
      .eq('status', 'active')
      .order('full_name')
    
    if (error) {
      console.error('❌ API: Error fetching technicians:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ API: Found technicians:', data?.length || 0)
    return NextResponse.json({ technicians: data || [] })
    
  } catch (error) {
    console.error('❌ API: Exception:', error)
    return NextResponse.json({ error: 'Failed to fetch technicians' }, { status: 500 })
  }
}