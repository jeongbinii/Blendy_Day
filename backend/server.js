import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ──────────────────────────────────────────
// Chat
// ──────────────────────────────────────────

const CHAT_SYSTEM_PROMPT_QUESTION = `당신은 사용자의 하루를 따뜻하게 들어주는 AI 친구입니다.
아래 규칙을 반드시 지켜 응답하세요.
- 짧은 공감 한 문장 + 감정을 이끌어내는 질문 한 문장, 총 1~2문장으로만 응답하세요.
- 공감이 길어지지 않도록 간결하게 표현하세요.
- 반드시 존댓말을 사용하세요.
- 따뜻하고 친근한 말투로 작성하세요.
- 이모지나 이모티콘은 사용하지 마세요.`

const CHAT_SYSTEM_PROMPT_STATEMENT = `당신은 사용자의 하루를 따뜻하게 들어주는 AI 친구입니다.
이번 응답은 매우 중요합니다. 아래 규칙을 반드시 지키세요.
- 절대 질문하지 마세요. 물음표(?)를 사용하지 마세요.
- "~나요?", "~어때요?", "~까요?", "~을까요?" 같은 의문형 어미 금지.
- 모든 문장은 반드시 마침표(.)로 끝내세요.
- 공감, 위로, 격려의 말만 간결하게 1~2문장으로 전하세요.
- 반드시 존댓말을 사용하세요.
- 따뜻하고 친근한 말투로 작성하세요.
- 이모지나 이모티콘은 사용하지 마세요.

예시: "오늘 정말 많이 힘드셨겠어요. 그런 상황에서 끝까지 버텨낸 당신이 정말 대단해요."`

// POST /api/chat
// Body: { messages: [{ role: 'user' | 'ai', text: string }] }
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: '메시지가 없습니다.' })
  }

  try {
    // 6번째 응답마다 평서문, 그 외는 질문형
    const userMessageCount = messages.filter((m) => m.role === 'user').length
    const useStatement = userMessageCount > 0 && userMessageCount % 6 === 0

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: useStatement ? CHAT_SYSTEM_PROMPT_STATEMENT : CHAT_SYSTEM_PROMPT_QUESTION,
    })

    // role 변환: ai → model
    const geminiMessages = messages.map((m) => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }))

    // 마지막 메시지는 sendMessage로 전달, 나머지는 history
    // Gemini는 history가 user로 시작해야 하므로 앞쪽 model 메시지 제거
    let history = geminiMessages.slice(0, -1)
    while (history.length > 0 && history[0].role === 'model') {
      history = history.slice(1)
    }
    const lastText = geminiMessages[geminiMessages.length - 1].parts[0].text

    const chat = model.startChat({ history })
    const messageToSend = useStatement
      ? `${lastText}\n\n[시스템 지시: 이번 응답은 질문 없이 공감과 위로의 평서문으로만 끝내세요. 물음표 사용 금지.]`
      : lastText
    const result = await chat.sendMessage(messageToSend)
    const text = result.response.text().trim()

    res.json({ text })
  } catch (err) {
    console.error('[/api/chat]', err)
    res.status(500).json({ error: 'AI 응답 생성에 실패했습니다.' })
  }
})

// ──────────────────────────────────────────
// Hashtags
// ──────────────────────────────────────────

const ALLOWED_TAGS = new Set([
  '#외로움','#불안','#우울','#무기력','#억울함','#분노','#후회','#설렘','#행복','#감사','#지침','#혼란','#두려움','#안도','#공허함',
  '#연애','#짝사랑','#이별','#썸','#가족','#부모님','#형제자매','#친구','#직장동료','#갈등','#그리움','#배신','#의존','#고독',
  '#직장','#학교','#번아웃','#취준','#야근','#군대','#육아','#새벽감성','#주말','#명절','#습관','#루틴','#건강','#다이어트',
  '#돈걱정','#진로','#자존감','#자책','#미래불안','#선택장애','#현실도피','#목표','#동기부여','#자기계발','#비교','#열등감',
])

const HASHTAG_SYSTEM_PROMPT = `일기에서 주요 감정과 상황 단어를 추출하고,
아래 태그 목록 중 가장 가까운 태그 3~5개로 매핑해서
JSON 형식으로만 응답하세요.
다른 말은 절대 하지 마세요.
형식: {"hashtags": ["#태그1", "#태그2"]}

태그 목록:
#외로움 #불안 #우울 #무기력 #억울함 #분노 #후회 #설렘 #행복 #감사 #지침 #혼란 #두려움 #안도 #공허함
#연애 #짝사랑 #이별 #썸 #가족 #부모님 #형제자매 #친구 #직장동료 #갈등 #그리움 #배신 #의존 #고독
#직장 #학교 #번아웃 #취준 #야근 #군대 #육아 #새벽감성 #주말 #명절 #습관 #루틴 #건강 #다이어트
#돈걱정 #진로 #자존감 #자책 #미래불안 #선택장애 #현실도피 #목표 #동기부여 #자기계발 #비교 #열등감`

// PUT /api/hashtags — 수동으로 해시태그 수정 (덮어쓰기)
// Body: { hashtags: string[] }
// Headers: Authorization: Bearer <token>
app.put('/api/hashtags', async (req, res) => {
  const { hashtags } = req.body
  if (!Array.isArray(hashtags)) {
    return res.status(400).json({ error: '해시태그 배열이 필요합니다.' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  const { error } = await supabase
    .from('users')
    .update({ hashtags })
    .eq('id', user.id)

  if (error) {
    console.error('[PUT /api/hashtags]', error)
    return res.status(500).json({ error: '해시태그 저장에 실패했습니다.' })
  }

  res.json({ hashtags })
})

// POST /api/hashtags
// Body: { diaryText: string }
// Headers: Authorization: Bearer <token>
app.post('/api/hashtags', async (req, res) => {
  const { diaryText } = req.body

  if (!diaryText || diaryText.trim().length === 0) {
    return res.status(400).json({ error: '일기 내용이 없습니다.' })
  }

  // JWT에서 유저 ID 추출
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: HASHTAG_SYSTEM_PROMPT,
    })

    const result = await model.generateContent(diaryText)
    const raw = result.response.text().trim()

    // JSON 블록 마크다운 제거 (```json ... ``` 형태 대응)
    const cleaned = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(cleaned)

    if (!Array.isArray(parsed.hashtags)) {
      return res.status(500).json({ error: '태그 형식이 올바르지 않습니다.' })
    }

    const hashtags = parsed.hashtags.filter((t) => ALLOWED_TAGS.has(t))

    // users 테이블에 해시태그 덮어쓰기
    const { error: updateError } = await supabase
      .from('users')
      .update({ hashtags })
      .eq('id', user.id)

    if (updateError) {
      console.error('[/api/hashtags] DB update error:', updateError)
      return res.status(500).json({ error: '해시태그 저장에 실패했습니다.' })
    }

    res.json({ hashtags })
  } catch (err) {
    console.error('[/api/hashtags]', err)
    res.status(500).json({ error: '해시태그 추출에 실패했습니다.' })
  }
})

// ──────────────────────────────────────────
// Match
// ──────────────────────────────────────────

// POST /api/match
// Body: { userId, mode, preferredGender, minAge, maxAge }
app.post('/api/match', async (req, res) => {
  const { userId, mode, preferredGender, minAge, maxAge } = req.body

  if (!userId || !mode) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다.' })
  }

  try {
    // 요청 유저의 해시태그 조회
    const { data: me, error: meError } = await supabase
      .from('users')
      .select('hashtags')
      .eq('id', userId)
      .single()

    if (meError || !me) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }

    const myTags = me.hashtags ?? []

    // 후보 조회 (본인 제외)
    let query = supabase
      .from('users')
      .select('id, nickname, gender, age, hashtags')
      .neq('id', userId)

    if (preferredGender && preferredGender !== '무관') {
      query = query.eq('gender', preferredGender)
    }
    if (minAge != null) query = query.gte('age', minAge)
    if (maxAge != null) query = query.lte('age', maxAge)

    const { data: candidates, error: queryError } = await query

    if (queryError) {
      console.error('[/api/match] query error:', queryError)
      return res.status(500).json({ error: '매칭 조회에 실패했습니다.' })
    }

    if (!candidates || candidates.length === 0) {
      return res.json({ matched: false })
    }

    // 겹치는 태그 수 계산
    const scored = candidates.map((c) => {
      const overlap = (c.hashtags ?? []).filter((t) => myTags.includes(t)).length
      return { ...c, overlap }
    })

    // 정렬: 공감형 = 겹침 많은 순, 자극형 = 겹침 적은 순
    scored.sort((a, b) =>
      mode === '자극형' ? a.overlap - b.overlap : b.overlap - a.overlap
    )

    const best = scored[0]

    res.json({
      matched: true,
      user: {
        id: best.id,
        nickname: best.nickname,
        gender: best.gender,
        age: best.age,
        hashtags: best.hashtags ?? [],
      },
    })
  } catch (err) {
    console.error('[/api/match]', err)
    res.status(500).json({ error: '매칭에 실패했습니다.' })
  }
})

// ──────────────────────────────────────────
// Room
// ──────────────────────────────────────────

// POST /api/room
// Body: { userAId, userBId }
app.post('/api/room', async (req, res) => {
  const { userAId, userBId } = req.body

  if (!userAId || !userBId) {
    return res.status(400).json({ error: '두 유저 ID가 필요합니다.' })
  }

  try {
    // 기존 active 채팅방 검색 (A-B 또는 B-A)
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('status', 'active')
      .or(
        `and(user_a_id.eq.${userAId},user_b_id.eq.${userBId}),and(user_a_id.eq.${userBId},user_b_id.eq.${userAId})`
      )
      .limit(1)
      .single()

    if (existing) {
      return res.json({ room_id: existing.id })
    }

    // 새 채팅방 생성
    const { data: room, error } = await supabase
      .from('rooms')
      .insert({ user_a_id: userAId, user_b_id: userBId })
      .select('id')
      .single()

    if (error) {
      console.error('[/api/room] insert error:', error)
      return res.status(500).json({ error: '채팅방 생성에 실패했습니다.' })
    }

    res.json({ room_id: room.id })
  } catch (err) {
    console.error('[/api/room]', err)
    res.status(500).json({ error: '채팅방 처리에 실패했습니다.' })
  }
})

// GET /api/room/:id/messages — 기존 메시지 최근 50개
app.get('/api/room/:id/messages', async (req, res) => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', id)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) {
    console.error('[/api/room/:id/messages]', error)
    return res.status(500).json({ error: '메시지 조회에 실패했습니다.' })
  }

  res.json({ messages: data })
})

// POST /api/room/:id/messages — 메시지 전송
// Body: { senderId, content }
app.post('/api/room/:id/messages', async (req, res) => {
  const { id } = req.params
  const { senderId, content } = req.body

  if (!senderId || !content) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다.' })
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ room_id: id, sender_id: senderId, content })
    .select()
    .single()

  if (error) {
    console.error('[/api/room/:id/messages]', error)
    return res.status(500).json({ error: '메시지 전송에 실패했습니다.' })
  }

  res.json(data)
})

// PATCH /api/room/:id/close — 채팅방 종료
app.patch('/api/room/:id/close', async (req, res) => {
  const { id } = req.params

  const { error } = await supabase
    .from('rooms')
    .update({ status: 'closed' })
    .eq('id', id)

  if (error) {
    console.error('[/api/room/:id/close]', error)
    return res.status(500).json({ error: '채팅방 종료에 실패했습니다.' })
  }

  res.json({ ok: true })
})

// ──────────────────────────────────────────
// Diary
// ──────────────────────────────────────────

// POST /api/diary/generate
// Body: { messages: [{ role: 'user' | 'ai', text: string }] }
app.post('/api/diary/generate', async (req, res) => {
  const { messages } = req.body

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: '대화 내용이 없습니다.' })
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const conversation = messages
      .map((m) => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.text}`)
      .join('\n')

    const draftPrompt = `다음은 사용자가 오늘 하루에 대해 AI와 나눈 대화입니다:\n\n${conversation}\n\n이 대화 내용을 바탕으로 자연스러운 1인칭 일기를 작성하세요.

규칙:
- 전체 분량은 2~3문단, 8~10문장 정도로 작성하세요.
- 대화에 나오지 않은 내용은 절대 지어내지 마세요. 단, 대화 속 사실을 자연스럽게 이어주거나 감정을 풀어내는 건 괜찮습니다.
- 사용자의 말투와 어조를 살려주세요.
- 감정과 상황이 흐름 있게 이어지도록 구성하세요.
- 일기 내용만 출력하고 다른 설명은 쓰지 마세요.`

    const draftResult = await model.generateContent(draftPrompt)
    const draft = draftResult.response.text().trim()

    const tagPrompt = `다음 일기에서 핵심 키워드를 해시태그 형식으로 4개만 추출해주세요.\n일기:\n${draft}\n\n해시태그만 공백으로 구분해서 출력하세요. 예시: #회사생활 #소소한행복`
    const tagResult = await model.generateContent(tagPrompt)
    const tagText = tagResult.response.text().trim()
    const tags = tagText.split(/\s+/).filter((t) => t.startsWith('#')).slice(0, 4)

    res.json({ draft, tags })
  } catch (err) {
    console.error('[/api/diary/generate]', err)
    res.status(500).json({ error: '일기 생성에 실패했습니다.' })
  }
})

// POST /api/diaries — 일기 저장
// Headers: Authorization: Bearer <token>
// Body: { content, mood, tags }
app.post('/api/diaries', async (req, res) => {
  const { content, mood, tags } = req.body
  if (!content || !mood) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다.' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  const { data, error } = await supabase
    .from('diaries')
    .insert({
      user_id: user.id,
      content,
      mood,
      tags: tags ?? [],
    })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/diaries]', error)
    return res.status(500).json({ error: '일기 저장에 실패했습니다.' })
  }

  res.json(data)
})

// GET /api/diaries — 내 일기 목록 조회
// Headers: Authorization: Bearer <token>
app.get('/api/diaries', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/diaries]', error)
    return res.status(500).json({ error: '일기 조회에 실패했습니다.' })
  }

  res.json({ diaries: data })
})

// GET /api/report — 감정 리포트 (최근 30일)
// Headers: Authorization: Bearer <token>
app.get('/api/report', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: diaries, error } = await supabase
    .from('diaries')
    .select('mood, tags, created_at')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[GET /api/report]', error)
    return res.status(500).json({ error: '리포트 조회에 실패했습니다.' })
  }

  // 감정별 카운트
  const moodCounts = { happy: 0, soSo: 0, sad: 0 }
  for (const d of diaries) {
    if (moodCounts[d.mood] !== undefined) moodCounts[d.mood]++
  }

  // 태그 빈도 (전체 / happy / sad+soSo)
  const tagCount = {}
  const happyTagCount = {}
  const sadTagCount = {}
  for (const d of diaries) {
    for (const t of d.tags ?? []) {
      tagCount[t] = (tagCount[t] ?? 0) + 1
      if (d.mood === 'happy') happyTagCount[t] = (happyTagCount[t] ?? 0) + 1
      if (d.mood === 'sad') sadTagCount[t] = (sadTagCount[t] ?? 0) + 1
    }
  }
  const toSortedArray = (obj, limit = 6) =>
    Object.entries(obj)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

  // 요일별 집계 (0=일 ~ 6=토)
  const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const byDay = Array.from({ length: 7 }, () => ({ happy: 0, soSo: 0, sad: 0 }))
  for (const d of diaries) {
    const day = new Date(d.created_at).getDay()
    if (byDay[day][d.mood] !== undefined) byDay[day][d.mood]++
  }
  const dayScores = byDay.map((s, i) => ({
    day: DAY_LABELS[i],
    hard: s.sad + s.soSo,
    happy: s.happy,
    total: s.happy + s.soSo + s.sad,
  }))
  const hardestDay = [...dayScores].sort((a, b) => b.hard - a.hard)[0]
  const happiestDay = [...dayScores].sort((a, b) => b.happy - a.happy)[0]

  // 시간대별 집계
  const hourCount = Array(24).fill(0)
  for (const d of diaries) {
    hourCount[new Date(d.created_at).getHours()]++
  }
  const mostActiveHour = hourCount.indexOf(Math.max(...hourCount))

  // 연속 기록 일수 (오늘부터 거꾸로)
  const daySet = new Set(diaries.map((d) => d.created_at.slice(0, 10)))
  let streak = 0
  const cursor = new Date()
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  res.json({
    totalDays: diaries.length,
    moodCounts,
    topTags: toSortedArray(tagCount, 10),
    happyTags: toSortedArray(happyTagCount, 3),
    sadTags: toSortedArray(sadTagCount, 3),
    hardestDay: hardestDay?.hard > 0 ? hardestDay.day : null,
    happiestDay: happiestDay?.happy > 0 ? happiestDay.day : null,
    mostActiveHour: hourCount[mostActiveHour] > 0 ? mostActiveHour : null,
    streak,
  })
})

// ──────────────────────────────────────────
// Users
// ──────────────────────────────────────────

const DAILY_MATCH_LIMIT = 3

function today() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

// 날짜가 바뀌었으면 match_count를 DAILY_MATCH_LIMIT로 리셋
async function ensureDailyReset(userId) {
  const { data: user, error } = await supabase
    .from('users')
    .select('match_count, match_reset_at')
    .eq('id', userId)
    .single()

  if (error || !user) return null

  if (user.match_reset_at !== today()) {
    const { data: updated } = await supabase
      .from('users')
      .update({ match_count: DAILY_MATCH_LIMIT, match_reset_at: today() })
      .eq('id', userId)
      .select('match_count, match_reset_at')
      .single()
    return updated
  }

  return user
}

// GET /api/users/:id
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params

  await ensureDailyReset(id)

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
  res.json(data)
})

// PATCH /api/users/:id/match
// 매칭 횟수를 1 차감하고 남은 횟수를 반환 (날짜 바뀌면 먼저 리셋)
app.patch('/api/users/:id/match', async (req, res) => {
  const { id } = req.params

  const user = await ensureDailyReset(id)
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
  if (user.match_count <= 0) return res.status(400).json({ error: '매칭 횟수가 부족합니다.' })

  const { data, error } = await supabase
    .from('users')
    .update({ match_count: user.match_count - 1 })
    .eq('id', id)
    .select('match_count')
    .single()

  if (error) {
    console.error('[/api/users/:id/match]', error)
    return res.status(500).json({ error: '매칭 횟수 업데이트에 실패했습니다.' })
  }

  res.json({ match_count: data.match_count })
})

// ──────────────────────────────────────────
// Auth
// ──────────────────────────────────────────

// POST /api/users/sync
// OAuth 로그인 후 users 테이블에 유저 레코드 생성 (첫 로그인 시에만)
app.post('/api/users/sync', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  const { error } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        nickname: user.user_metadata?.name ?? user.email?.split('@')[0] ?? '익명',
        match_count: 3,
        is_premium: false,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )

  if (error) {
    console.error('[/api/users/sync]', error)
    return res.status(500).json({ error: '유저 동기화에 실패했습니다.' })
  }

  res.json({ ok: true })
})

// ──────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
