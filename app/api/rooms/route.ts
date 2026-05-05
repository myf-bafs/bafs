import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST() {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const { data, error } = await supabase.from('rooms').insert({ id: code, status: 'waiting' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ roomId: code })
}
