import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { playerName } = await req.json()
  const { data, error } = await supabase
    .from('players')
    .insert({ room_id: params.roomId, name: playerName, score: 0 })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ player: data })
}
