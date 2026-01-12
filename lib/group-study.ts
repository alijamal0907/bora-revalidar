import { createClient } from "@/lib/supabase/client"

export type GroupRoom = {
  id: string
  room_code: string
  host_user_id: string
  question_count: number
  status: "open" | "closed" | "finished"
  created_at: string
  updated_at: string
}

export type RoomParticipant = {
  id: string
  room_id: string
  user_id: string
  is_host: boolean
  joined_at: string
  finished_at?: string
  total_time_seconds?: number
}

export type RoomAnswer = {
  id: string
  room_id: string
  user_id: string
  question_pk: string
  selected_answer: string
  is_correct: boolean
  answered_at: string
}

// Gerar código único de 6 caracteres
function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Criar sala
export async function createGroupRoom(
  userId: string,
  questionCount: number,
): Promise<{ room: GroupRoom; code: string } | null> {
  const supabase = createClient()

  console.log("[v0] Iniciando criação da sala:", { userId, questionCount })

  // Gerar código único de 6 caracteres
  const roomCode = generateRoomCode()

  console.log("[v0] Código gerado:", roomCode)

  const { data: room, error } = await supabase
    .from("group_study_rooms")
    .insert({
      room_code: roomCode,
      host_user_id: userId,
      question_count: questionCount,
      status: "open",
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Erro ao criar sala:", error)
    return null
  }

  if (!room) {
    console.error("[v0] Sala não foi criada - sem dados retornados")
    return null
  }

  console.log("[v0] Sala criada com sucesso:", room)

  const { error: participantError } = await supabase.from("group_study_participants").insert({
    room_id: room.id,
    user_id: userId,
    is_host: true,
  })

  if (participantError) {
    console.error("[v0] Erro ao adicionar host como participante:", participantError)
    // Deletar sala se não conseguir adicionar o participante
    await supabase.from("group_study_rooms").delete().eq("id", room.id)
    return null
  }

  console.log("[v0] Host adicionado como participante. Retornando:", { room, code: roomCode })

  return { room, code: roomCode }
}

// Entrar em sala por código
export async function joinGroupRoom(userId: string, roomCode: string): Promise<GroupRoom | null> {
  const supabase = createClient()

  const { data: room, error } = await supabase
    .from("group_study_rooms")
    .select()
    .eq("room_code", roomCode.toUpperCase())
    .eq("status", "open")
    .single()

  if (error || !room) {
    console.error("Sala não encontrada:", error)
    return null
  }

  const { data: existingParticipants } = await supabase
    .from("group_study_participants")
    .select("id")
    .eq("room_id", room.id)

  if (existingParticipants && existingParticipants.length >= 10) {
    console.error("Sala está cheia (máximo 10 participantes)")
    return null
  }

  const { data: alreadyInRoom } = await supabase
    .from("group_study_participants")
    .select("id")
    .eq("room_id", room.id)
    .eq("user_id", userId)
    .single()

  if (alreadyInRoom) {
    return room // Já está na sala, retorna sucesso
  }

  // Adicionar participante
  const { error: joinError } = await supabase.from("group_study_participants").insert({
    room_id: room.id,
    user_id: userId,
    is_host: false,
  })

  if (joinError) {
    console.error("Erro ao entrar na sala:", joinError)
    return null
  }

  return room
}

// Buscar participantes da sala
export async function getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("group_study_participants")
    .select("*")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true })

  if (error) {
    console.error("Erro ao buscar participantes:", error)
    return []
  }

  return data || []
}

export const getParticipants = getRoomParticipants

// Salvar resposta do participante
export async function saveGroupAnswer(
  roomId: string,
  userId: string,
  questionPk: string,
  selectedAnswer: string,
  isCorrect: boolean,
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("group_study_answers").upsert(
    {
      room_id: roomId,
      user_id: userId,
      question_pk: questionPk,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
    },
    {
      onConflict: "room_id,user_id,question_pk",
    },
  )

  if (error) {
    console.error("Erro ao salvar resposta:", error)
    return false
  }

  return true
}

// Buscar progresso dos participantes
export async function getRoomProgress(roomId: string): Promise<Map<string, number>> {
  const supabase = createClient()

  const { data, error } = await supabase.from("group_study_answers").select("user_id").eq("room_id", roomId)

  if (error) {
    console.error("Erro ao buscar progresso:", error)
    return new Map()
  }

  const progressMap = new Map<string, number>()
  data?.forEach((answer) => {
    const current = progressMap.get(answer.user_id) || 0
    progressMap.set(answer.user_id, current + 1)
  })

  return progressMap
}

// Finalizar participação
export async function finishGroupStudy(roomId: string, userId: string, totalTimeSeconds: number): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("group_study_participants")
    .update({
      finished_at: new Date().toISOString(),
      total_time_seconds: totalTimeSeconds,
    })
    .eq("room_id", roomId)
    .eq("user_id", userId)

  if (error) {
    console.error("Erro ao finalizar participação:", error)
    return false
  }

  return true
}

// Fechar sala (apenas host)
export async function closeGroupRoom(roomId: string, userId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("group_study_rooms")
    .update({ status: "closed" })
    .eq("id", roomId)
    .eq("host_user_id", userId)

  if (error) {
    console.error("Erro ao fechar sala:", error)
    return false
  }

  return true
}

// Buscar ranking da sala
export async function getRoomRanking(roomId: string): Promise<any[]> {
  const supabase = createClient()

  // Buscar respostas
  const { data: answers, error } = await supabase
    .from("group_study_answers")
    .select("user_id, is_correct")
    .eq("room_id", roomId)

  if (error) {
    console.error("[v0] Erro ao buscar ranking:", error)
    return []
  }

  // Buscar participantes para pegar os nomes
  const { data: participants } = await supabase
    .from("group_study_participants")
    .select("user_id, user_name")
    .eq("room_id", roomId)

  const participantNames = new Map<string, string>()
  participants?.forEach((p) => {
    participantNames.set(p.user_id, p.user_name || "Participante")
  })

  const scoreMap = new Map<string, { correct: number; total: number }>()

  answers?.forEach((answer) => {
    const current = scoreMap.get(answer.user_id) || { correct: 0, total: 0 }
    scoreMap.set(answer.user_id, {
      correct: current.correct + (answer.is_correct ? 1 : 0),
      total: current.total + 1,
    })
  })

  return Array.from(scoreMap.entries())
    .map(([visitorId, stats]) => ({
      user_id: visitorId,
      visitorId: visitorId,
      visitorName: participantNames.get(visitorId) || "Participante",
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.correct - a.correct)
}

export async function startGroupRoom(roomId: string, userId: string, questionIds: string[]): Promise<boolean> {
  const supabase = createClient()

  console.log("[v0] Iniciando sala:", roomId, "com", questionIds.length, "questões")

  // Verificar se é o host
  const { data: room, error: roomError } = await supabase
    .from("group_study_rooms")
    .select("host_user_id")
    .eq("id", roomId)
    .single()

  if (roomError || !room || room.host_user_id !== userId) {
    console.error("[v0] Usuário não é host ou erro:", roomError)
    return false
  }

  const { data: existingQuestions } = await supabase
    .from("group_study_room_questions")
    .select("id")
    .eq("room_id", roomId)
    .limit(1)

  if (existingQuestions && existingQuestions.length > 0) {
    console.log("[v0] Simulado já foi iniciado anteriormente")
    return true // Retorna sucesso porque já está iniciado
  }

  // Atualizar status para 'closed' (simulado iniciado)
  const { error: updateError } = await supabase.from("group_study_rooms").update({ status: "closed" }).eq("id", roomId)

  if (updateError) {
    console.error("[v0] Erro ao atualizar status da sala:", updateError)
    return false
  }

  // Salvar questões da sala
  const questionsToInsert = questionIds.map((questionPk, index) => ({
    room_id: roomId,
    question_pk: questionPk,
    question_order: index,
  }))

  const { error: questionsError } = await supabase.from("group_study_room_questions").insert(questionsToInsert)

  if (questionsError) {
    console.error("[v0] Erro ao salvar questões da sala:", questionsError.message)
    return false
  }

  console.log("[v0] Sala iniciada com sucesso!")
  return true
}

export async function getRoomQuestions(roomId: string): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("group_study_room_questions")
    .select("question_pk")
    .eq("room_id", roomId)
    .order("question_order", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao buscar questões da sala:", error)
    return []
  }

  return data?.map((q) => q.question_pk) || []
}

export async function sendChatMessage(roomId: string, userId: string, message: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("group_study_chat").insert({
    room_id: roomId,
    user_id: userId,
    message: message.trim(),
  })

  if (error) {
    console.error("[v0] Erro ao enviar mensagem:", error)
    return false
  }

  return true
}

export async function getChatMessages(roomId: string): Promise<any[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("group_study_chat")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(100)

  if (error) {
    console.error("[v0] Erro ao buscar mensagens:", error)
    return []
  }

  return data || []
}

export async function getUserWrongAnswers(roomId: string, userId: string): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("group_study_answers")
    .select("question_pk")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .eq("is_correct", false)

  if (error) {
    console.error("[v0] Erro ao buscar respostas erradas:", error)
    return []
  }

  return data?.map((a) => a.question_pk) || []
}

export async function getRandomQuestions(count: number): Promise<any[]> {
  const supabase = createClient()

  // Buscar questões aleatórias do banco
  const { data, error } = await supabase
    .from("questoes")
    .select("*")
    .limit(count * 3) // Buscar 3x mais para ter margem de escolha

  if (error || !data || data.length === 0) {
    console.error("[v0] Erro ao buscar questões aleatórias:", error)
    return []
  }

  // Embaralhar e retornar apenas a quantidade solicitada
  const shuffled = data.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export async function deleteGroupRoom(roomId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("group_study_rooms").delete().eq("id", roomId)

  if (error) {
    console.error("Erro ao deletar sala:", error)
    return false
  }

  return true
}

export async function debugGroupStudySetup() {
  const supabase = createClient()

  const results = {
    authenticated: false,
    userId: null as string | null,
    userEmail: null as string | null,
    tablesExist: {
      rooms: false,
      participants: false,
      questions: false,
      chat: false,
      answers: false,
    },
    canInsert: {
      rooms: false,
      participants: false,
    },
    realtimeEnabled: false,
    errors: [] as string[],
  }

  try {
    // 1. Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError) {
      results.errors.push(`Auth error: ${authError.message}`)
    } else if (user) {
      results.authenticated = true
      results.userId = user.id
      results.userEmail = user.email || null
    }

    // 2. Verificar se tabelas existem
    const tableChecks = [
      { name: "rooms", table: "group_study_rooms" },
      { name: "participants", table: "group_study_participants" },
      { name: "questions", table: "group_study_room_questions" },
      { name: "chat", table: "group_study_chat" },
      { name: "answers", table: "group_study_answers" },
    ]

    for (const check of tableChecks) {
      const { error } = await supabase.from(check.table).select("id").limit(1)
      if (!error) {
        results.tablesExist[check.name as keyof typeof results.tablesExist] = true
      } else {
        results.errors.push(`Table ${check.table}: ${error.message}`)
      }
    }

    // 3. Testar inserção (e deletar imediatamente)
    if (results.authenticated && results.tablesExist.rooms) {
      const testRoom = {
        room_code: "TEST99",
        host_user_id: results.userId,
        question_count: 25,
        status: "open",
      }

      const { data: insertedRoom, error: insertError } = await supabase
        .from("group_study_rooms")
        .insert(testRoom)
        .select()
        .single()

      if (!insertError && insertedRoom) {
        results.canInsert.rooms = true
        // Deletar imediatamente
        await supabase.from("group_study_rooms").delete().eq("id", insertedRoom.id)
      } else if (insertError) {
        results.errors.push(`Insert test: ${insertError.message}`)
      }
    }
  } catch (err: any) {
    results.errors.push(`Unexpected error: ${err.message}`)
  }

  return results
}
