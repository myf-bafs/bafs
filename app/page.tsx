'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)

  const createRoom = async () => {
    if (!playerName.trim()) return alert('請輸入你的名字')
    setLoading(true)
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const { data: room, error } = await supabase
      .from('rooms')
      .insert({ id: code, status: 'waiting', host_player_id: 'temp' })
      .select()
      .single()
    if (error) {
      alert('創建失敗: ' + error.message)
      setLoading(false)
      return
    }
    // 加入房间
    const { data: player } = await supabase
      .from('players')
      .insert({ room_id: code, name: playerName, score: 0 })
      .select()
      .single()
    // 更新房主為該player id
    await supabase.from('rooms').update({ host_player_id: player.id }).eq('id', code)
    localStorage.setItem('playerId', player.id)
    localStorage.setItem('playerName', playerName)
    router.push(`/room/${code}`)
  }

  const joinRoom = async () => {
    if (!playerName.trim()) return alert('請輸入你的名字')
    if (!roomCode.trim()) return alert('請輸入房間碼')
    setLoading(true)
    const { data: room } = await supabase.from('rooms').select('*').eq('id', roomCode).single()
    if (!room) {
      alert('房間不存在')
      setLoading(false)
      return
    }
    const { data: player } = await supabase
      .from('players')
      .insert({ room_id: roomCode, name: playerName, score: 0 })
      .select()
      .single()
    localStorage.setItem('playerId', player.id)
    localStorage.setItem('playerName', playerName)
    router.push(`/room/${roomCode}`)
  }

  return (
    <div style={{ maxWidth: 400, margin: 'auto', paddingTop: 50 }}>
      <h1>PVP 商科問答比賽</h1>
      <input placeholder="你的名字" value={playerName} onChange={e => setPlayerName(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 12 }} />
      <button onClick={createRoom} disabled={loading} style={{ width: '100%', padding: 10, marginBottom: 12 }}>➕ 建立房間</button>
      <hr />
      <input placeholder="輸入 6 位房間碼" value={roomCode} onChange={e => setRoomCode(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 12 }} />
      <button onClick={joinRoom} disabled={loading} style={{ width: '100%', padding: 10 }}>🔑 加入房間</button>
    </div>
  )
}
