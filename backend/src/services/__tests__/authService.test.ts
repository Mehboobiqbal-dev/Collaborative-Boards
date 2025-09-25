import { authService } from '../authService'

describe('AuthService', () => {
  describe('signup', () => {
    it('should create a new user', async () => {
      const result = await authService.signup('test@example.com', 'password123', 'Test User')

      expect(result.user).toHaveProperty('id')
      expect(result.user.email).toBe('test@example.com')
      expect(result.user.name).toBe('Test User')
      expect(result.user.verified).toBe(false)
      expect(result).toHaveProperty('verificationToken')
    })

    it('should throw error for duplicate email', async () => {
      await authService.signup('duplicate@example.com', 'password123', 'Test User')

      await expect(
        authService.signup('duplicate@example.com', 'password456', 'Another User')
      ).rejects.toThrow('User with this email already exists')
    })
  })

  describe('verifyEmail', () => {
    it('should verify user email', async () => {
      const { verificationToken } = await authService.signup(
        'verify@example.com',
        'password123',
        'Verify User'
      )

      await authService.verifyEmail('verify@example.com', verificationToken)

      const result = await authService.login('verify@example.com', 'password123')
      expect(result.user.verified).toBe(true)
    })

    it('should throw error for invalid token', async () => {
      await expect(
        authService.verifyEmail('nonexistent@example.com', 'invalid-token')
      ).rejects.toThrow('User not found')
    })
  })

  describe('login', () => {
    it('should login verified user', async () => {
      const { verificationToken } = await authService.signup(
        'login@example.com',
        'password123',
        'Login User'
      )
      await authService.verifyEmail('login@example.com', verificationToken)

      const result = await authService.login('login@example.com', 'password123')

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.email).toBe('login@example.com')
    })

    it('should throw error for unverified user', async () => {
      await authService.signup('unverified@example.com', 'password123', 'Unverified User')

      await expect(
        authService.login('unverified@example.com', 'password123')
      ).rejects.toThrow('Please verify your email before logging in')
    })

    it('should throw error for invalid credentials', async () => {
      const { verificationToken } = await authService.signup(
        'invalid@example.com',
        'password123',
        'Invalid User'
      )
      await authService.verifyEmail('invalid@example.com', verificationToken)

      await expect(
        authService.login('invalid@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials')
    })
  })
})
