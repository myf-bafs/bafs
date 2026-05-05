import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  // 获取第一题
  const { data: firstQuestion } = await supabase.from('questions').select('id').limit(1).single()
  if (!firstQuestion) return NextResponse.json({ error: '沒有題目' }, { status: 400 })
  await supabase
    .from('rooms')
    .update({ status: 'playing', current_question_id: firstQuestion.id, started_at: new Date().toISOString() })
    .eq('id', params.roomId)
  return NextResponse.json({ success: true })
}
