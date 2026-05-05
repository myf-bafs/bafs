import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { playerId, isCorrect } = await req.json()
  const increment = isCorrect ? 10 : 0
  if (increment > 0) {
    const { error } = await supabase.rpc('increment_score', { player_uuid: playerId, score_add: increment })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
