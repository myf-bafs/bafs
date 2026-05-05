'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Room, Player, Question } from '@/lib/types'

export default function RoomPage() {
  const { roomId } = useParams() as { roomId: string }
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [myAnswer, setMyAnswer] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(10)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    const storedId = localStorage.getItem('playerId')
    setMyPlayerId(storedId)

    // 获取房间信息
    const fetchRoom = async () => {
      const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single()
      setRoom(data)
      setGameStarted(data?.status === 'playing')
      setLoading(false)
    }
    fetchRoom()

    // 实时监听玩家列表
    const playersChannel = supabase
      .channel(`room-${roomId}-players`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, () => {
        refreshPlayers()
      })
      .subscribe()

    // 实时监听房间状态变化
    const roomChannel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'update', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        const newRoom = payload.new as Room
        setRoom(newRoom)
        if (newRoom.status === 'playing' && !gameStarted) {
          setGameStarted(true)
          startGameCycle()
        }
        if (newRoom.status === 'finished') {
          alert('遊戲已結束！')
        }
      })
      .subscribe()

    const refreshPlayers = async () => {
      const { data } = await supabase.from('players').select('*').eq('room_id', roomId).order('score', { ascending: false })
      setPlayers(data || [])
    }
    refreshPlayers()

    return () => {
      supabase.removeChannel(playersChannel)
      supabase.removeChannel(roomChannel)
    }
  }, [roomId])

  const startGameCycle = async () => {
    // 获取第一题
    const { data: firstQuestion } = await supabase.from('questions').select('*').limit(1).single()
    setCurrentQuestion(firstQuestion)
    setMyAnswer(null)
    setTimeLeft(10)
    // 更新房间的 current_question_id
    await supabase.from('rooms').update({ current_question_id: firstQuestion.id }).eq('id', roomId)
    // 开始倒计时
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          // 时间到，自动下一题或结束
          nextQuestion()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const nextQuestion = async () => {
    // 随机取下一题（实际应该按顺序，这里简化）
    const { data: questions } = await supabase.from('questions').select('id')
    const nextId = questions?.[Math.floor(Math.random() * questions.length)]?.id
    if (!nextId) return
    const { data: nextQ } = await supabase.from('questions').select('*').eq('id', nextId).single()
    setCurrentQuestion(nextQ)
    setMyAnswer(null)
    setTimeLeft(10)
    await supabase.from('rooms').update({ current_question_id: nextId }).eq('id', roomId)
  }

  const submitAnswer = async (selectedIdx: number) => {
    if (myAnswer !== null || !currentQuestion) return
    setMyAnswer(selectedIdx)
    const isCorrect = (selectedIdx === currentQuestion.correct_answer)
    // 调用 API 更新分数
    await fetch(`/api/rooms/${roomId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: myPlayerId, isCorrect })
    })
  }

  const startGame = async () => {
    // 只有房主可以调用
    await fetch(`/api/rooms/${roomId}/start`, { method: 'POST' })
  }

  if (loading) return <div>載入中...</div>

  const isHost = myPlayerId === room?.host_player_id

  if (!gameStarted) {
    return (
      <div>
        <h2>房間碼：{roomId}</h2>
        <h3>玩家列表：</h3>
        <ul>{players.map(p => <li key={p.id}>{p.name}（分數：{p.score}）</li>)}</ul>
        {isHost && <button onClick={startGame} style={{ padding: 12, fontSize: 18 }}>開始遊戲</button>}
        {!isHost && <p>等待房主開始遊戲...</p>}
      </div>
    )
  }

  return (
    <div>
      <h2>房間：{roomId}</h2>
      <div style={{ display: 'flex', gap: 40 }}>
        <div style={{ flex: 2 }}>
          {currentQuestion ? (
            <>
              <h3>⏱️ 剩餘 {timeLeft} 秒</h3>
              <h3>{currentQuestion.question_text}</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => submitAnswer(idx)}
                    disabled={myAnswer !== null}
                    style={{
                      padding: 12,
                      backgroundColor: myAnswer === idx ? (idx === currentQuestion.correct_answer ? '#8f8' : '#f88') : '#eee'
                    }}
                  >
                    {String.fromCharCode(65+idx)}. {opt}
                  </button>
                ))}
              </div>
            </>
          ) : <p>載入問題中...</p>}
        </div>
        <div style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: 20 }}>
          <h3>即時排名</h3>
          <ol>
            {players.map(p => (
              <li key={p.id}>{p.name} - {p.score} 分</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
