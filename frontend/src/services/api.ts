import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { AuthTokens, User, Board, Card, List, Notification, Attachment } from '../types'

class ApiService {
  private api: AxiosInstance
  private refreshPromise: Promise<AuthTokens> | null = null

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
      timeout: 10000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const tokens = await this.refreshTokens()
            localStorage.setItem('accessToken', tokens.accessToken)
            localStorage.setItem('refreshToken', tokens.refreshToken)
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`
            return this.api(originalRequest)
          } catch (refreshError) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private async refreshTokens(): Promise<AuthTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.api.post('/auth/refresh', {
      refreshToken: localStorage.getItem('refreshToken'),
    }).then(response => response.data)

    try {
      const tokens = await this.refreshPromise
      return tokens
    } finally {
      this.refreshPromise = null
    }
  }

  async signup(data: { email: string; password: string; name: string }): Promise<{ user: User; verificationToken: string }> {
    const response = await this.api.post('/auth/signup', data)
    return response.data
  }

  async login(credentials: { email: string; password: string }): Promise<AuthTokens> {
    const response = await this.api.post('/auth/login', credentials)
    const tokens = response.data
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    return tokens
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.api.post('/auth/logout', {
      refreshToken: localStorage.getItem('refreshToken'),
    })
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    return response.data
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get('/users/me')
    return response.data
  }

  async getBoards(): Promise<Board[]> {
    const response = await this.api.get('/boards')
    return response.data
  }

  async createBoard(title: string): Promise<Board> {
    const response = await this.api.post('/boards', { title })
    return response.data
  }

  async getBoard(boardId: string): Promise<Board> {
    const response = await this.api.get(`/boards/${boardId}`)
    return response.data
  }

  async updateBoard(boardId: string, title: string): Promise<Board> {
    const response = await this.api.patch(`/boards/${boardId}`, { title })
    return response.data
  }

  async deleteBoard(boardId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/boards/${boardId}`)
    return response.data
  }

  async createList(boardId: string, title: string, position?: number): Promise<List> {
    const response = await this.api.post(`/boards/${boardId}/lists`, { title, position })
    return response.data
  }

  async updateList(listId: string, updates: { title?: string; position?: number }): Promise<List> {
    const response = await this.api.patch(`/lists/${listId}`, updates)
    return response.data
  }

  async deleteList(listId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/lists/${listId}`)
    return response.data
  }

  async createCard(listId: string, card: {
    title: string
    description?: string
    labels?: string[]
    assigneeId?: string
    dueDate?: string
  }): Promise<Card> {
    const response = await this.api.post(`/lists/${listId}/cards`, card)
    return response.data
  }

  async getCard(cardId: string): Promise<Card> {
    const response = await this.api.get(`/cards/${cardId}`)
    return response.data
  }

  async updateCard(cardId: string, updates: {
    title?: string
    description?: string
    labels?: string[]
    assigneeId?: string
    dueDate?: string
    position?: number
    listId?: string
  }): Promise<Card> {
    const response = await this.api.patch(`/cards/${cardId}`, updates)
    return response.data
  }

  async deleteCard(cardId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/cards/${cardId}`)
    return response.data
  }

  async moveCard(cardId: string, listId: string, position: number): Promise<Card> {
    const response = await this.api.post(`/cards/${cardId}/move`, { listId, position })
    return response.data
  }

  async searchCards(filters: {
    query?: string
    labels?: string[]
    assignee?: string
    dueFrom?: string
    dueTo?: string
    boardId?: string
    listId?: string
    limit?: number
    offset?: number
  }): Promise<{ cards: Card[]; total: number; limit: number; offset: number }> {
    const params = new URLSearchParams()

    if (filters.query) params.append('query', filters.query)
    if (filters.labels) filters.labels.forEach(label => params.append('labels', label))
    if (filters.assignee) params.append('assignee', filters.assignee)
    if (filters.dueFrom) params.append('dueFrom', filters.dueFrom)
    if (filters.dueTo) params.append('dueTo', filters.dueTo)
    if (filters.boardId) params.append('boardId', filters.boardId)
    if (filters.listId) params.append('listId', filters.listId)
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.offset) params.append('offset', filters.offset.toString())

    const response = await this.api.get(`/cards/search?${params.toString()}`)
    return response.data
  }

  async addComment(cardId: string, content: string): Promise<Comment> {
    const response = await this.api.post(`/cards/${cardId}/comments`, { content })
    return response.data
  }

  async getCardComments(cardId: string): Promise<Comment[]> {
    const response = await this.api.get(`/cards/${cardId}/comments`)
    return response.data
  }

  async getNotifications(limit = 50, offset = 0): Promise<{ notifications: Notification[]; total: number }> {
    const response = await this.api.get(`/notifications?limit=${limit}&offset=${offset}`)
    return response.data
  }

  async markNotificationRead(notificationId: string): Promise<Notification> {
    const response = await this.api.patch(`/notifications/${notificationId}/read`)
    return response.data
  }

  async uploadAttachment(cardId: string, file: File): Promise<Attachment> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.api.post(`/cards/${cardId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async deleteAttachment(attachmentId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/attachments/${attachmentId}`)
    return response.data
  }
}

export const apiService = new ApiService()
