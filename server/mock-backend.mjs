import http from 'node:http'
import { randomUUID } from 'node:crypto'

const port = Number(process.env.PORT ?? 8000)
const owners = new Map()
const pets = new Map()

function sendJson(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  })
  res.end(body)
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
  })
}

function getOwnerPets(ownerId) {
  const ids = owners.get(ownerId) ?? []
  return ids.map((id) => pets.get(id)).filter(Boolean)
}

function createPet({ owner_id, species = 'cat', name, template = 'genki' }) {
  const pet = {
    pet_id: randomUUID(),
    owner_id,
    species,
    name,
    template,
    bond_stage: 'New',
    created_at: new Date().toISOString(),
    stats: {
      mood: 0.72,
      energy: 0.68,
      boredom: 0.18
    }
  }

  pets.set(pet.pet_id, pet)
  owners.set(owner_id, [...(owners.get(owner_id) ?? []), pet.pet_id])
  return pet
}

function ensureSeed(ownerId) {
  if ((owners.get(ownerId) ?? []).length > 0) return
  createPet({ owner_id: ownerId, species: 'cat', name: '六毛', template: 'genki' })
}

function sendSse(res, event, data) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

async function streamChat(req, res, petId) {
  const body = await readJson(req)
  const pet = pets.get(petId)

  if (!pet) {
    sendJson(res, 404, { detail: 'Pet not found' })
    return
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  })

  const message = body.message || ''
  const chunks = [
    `喵，${pet.name} 收到：`,
    message,
    '。我现在心情不错，可以陪你聊天，也可以假装很忙但偷偷听着。'
  ]

  sendSse(res, 'turn_start', { pet_id: petId })
  await delay(120)
  sendSse(res, 'thinking', { text: '判断铲屎官的语气和猫咪当前状态...\n' })
  await delay(160)

  for (const chunk of chunks) {
    sendSse(res, 'llm_text', { chunk })
    await delay(180)
  }

  pet.bond_stage = 'Companion'
  pet.stats.mood = Math.min(1, pet.stats.mood + 0.04)
  pet.stats.boredom = Math.max(0, pet.stats.boredom - 0.03)

  sendSse(res, 'done', { ok: true })
  res.end()
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {})
      return
    }

    const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
    const path = url.pathname

    if (req.method === 'GET' && path === '/health') {
      sendJson(res, 200, { status: 'ok' })
      return
    }

    if (req.method === 'POST' && path === '/api/adopt') {
      const body = await readJson(req)
      if (!body.owner_id || !body.name) {
        sendJson(res, 400, { detail: 'owner_id and name are required' })
        return
      }

      const pet = createPet(body)
      sendJson(res, 200, {
        pet_id: pet.pet_id,
        pet,
        greeting: `${pet.name} 抬头看了你一眼，勉强同意被收养。`
      })
      return
    }

    const ownerPetsMatch = path.match(/^\/api\/owner\/([^/]+)\/pets$/)
    if (req.method === 'GET' && ownerPetsMatch) {
      const ownerId = decodeURIComponent(ownerPetsMatch[1])
      ensureSeed(ownerId)
      sendJson(res, 200, { pets: getOwnerPets(ownerId) })
      return
    }

    const statusMatch = path.match(/^\/api\/pet\/([^/]+)\/status$/)
    if (req.method === 'GET' && statusMatch) {
      const pet = pets.get(decodeURIComponent(statusMatch[1]))
      if (!pet) {
        sendJson(res, 404, { detail: 'Pet not found' })
        return
      }

      sendJson(res, 200, {
        name: pet.name,
        bond: {
          score: pet.bond_stage === 'Companion' ? 0.58 : 0.28,
          stage: pet.bond_stage
        },
        stats: pet.stats,
        soul_summary: {
          personality_tags: [pet.template, 'curious', 'desktop companion'],
          tone: `${pet.name} 正在以 ${pet.template} 模式观察你，尾巴摇得很克制。`
        }
      })
      return
    }

    const releaseMatch = path.match(/^\/api\/pet\/([^/]+)\/release$/)
    if (req.method === 'POST' && releaseMatch) {
      const petId = decodeURIComponent(releaseMatch[1])
      const body = await readJson(req)
      const ownerPetIds = owners.get(body.owner_id) ?? []
      owners.set(
        body.owner_id,
        ownerPetIds.filter((id) => id !== petId)
      )
      pets.delete(petId)
      sendJson(res, 200, { ok: true })
      return
    }

    const streamMatch = path.match(/^\/api\/pet\/([^/]+)\/chat\/stream$/)
    if (req.method === 'POST' && streamMatch) {
      await streamChat(req, res, decodeURIComponent(streamMatch[1]))
      return
    }

    const chatMatch = path.match(/^\/api\/pet\/([^/]+)\/chat$/)
    if (req.method === 'POST' && chatMatch) {
      const body = await readJson(req)
      sendJson(res, 200, { content: `喵，我听到了：${body.message || ''}` })
      return
    }

    sendJson(res, 404, { detail: 'Not found' })
  } catch (error) {
    sendJson(res, 500, { detail: error instanceof Error ? error.message : 'Internal error' })
  }
})

server.listen(port, () => {
  console.log(`6mao mock backend listening on http://localhost:${port}`)
})
