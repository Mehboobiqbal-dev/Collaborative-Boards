import { createClient } from 'redis'

class CacheService {
  private client: ReturnType<typeof createClient> | null = null

  async connect() {
    if (!this.client) {
      this.client = createClient({ url: process.env.REDIS_URL })
      await this.client.connect()
    }
    return this.client
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.connect()
      const data = await client.get(key)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const client = await this.connect()
      const data = JSON.stringify(value)
      if (ttlSeconds) {
        await client.setEx(key, ttlSeconds, data)
      } else {
        await client.set(key, data)
      }
    } catch {
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = await this.connect()
      await client.del(key)
    } catch {
    }
  }

  async invalidateBoardCache(boardId: string): Promise<void> {
    const keys = [`board:${boardId}`, `board:${boardId}:lists`, `board:${boardId}:cards`]
    await Promise.all(keys.map(key => this.del(key)))
  }

  async getBoardSnapshot(boardId: string) {
    return this.get(`board:${boardId}`)
  }

  async setBoardSnapshot(boardId: string, data: any, ttlSeconds = 300): Promise<void> {
    await this.set(`board:${boardId}`, data, ttlSeconds)
  }
}

export const cacheService = new CacheService()
