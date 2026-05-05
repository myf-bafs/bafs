export type Room = {
  id: string
  status: 'waiting' | 'playing' | 'finished'
  current_question_id: number | null
  host_player_id: string
  started_at?: string
  created_at: string
}

export type Player = {
  id: string
  room_id: string
  name: string
  score: number
}

export type Question = {
  id: number
  question_text: string
  options: string[]
  correct_answer: number
  explanation?: string
}
