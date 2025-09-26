import { authService } from '../authService'

describe('AuthService', () => {
  describe('signup', () => {
    it('should create a new user', async () => {
      const result = await authService.signup('test@example.com', 'password123', 'Test User')

      expect(result.user).toHaveProperty('id')
      expect(result.user.email).toBe('test@example.com')
      expect(result.user.name).toBe('Test User')
      expect(result.user.verified).toBe(true) // Users are verified by default (simulation)
    })

    it('should throw error for duplicate email', async () => {
      await authService.signup('duplicate@example.com', 'password123', 'Test User')

      await expect(
        authService.signup('duplicate@example.com', 'password456', 'Another User')
      ).rejects.toThrow('User with this email already exists')
    })
  })


  describe('login', () => {
    it('should login user', async () => {
      await authService.signup('login@example.com', 'password123', 'Login User')

      const result = await authService.login('login@example.com', 'password123')

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.email).toBe('login@example.com')
    })

    it('should throw error for invalid credentials', async () => {
      await authService.signup('invalid@example.com', 'password123', 'Invalid User')

      await expect(
        authService.login('invalid@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials')
    })
  })
})
