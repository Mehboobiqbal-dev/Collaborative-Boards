import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const VerifyEmailPage: React.FC = () => {
  const [token, setToken] = useState('')
  const location = useLocation()
  const email = location.state?.email || ''
  const { verifyEmail, error } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await verifyEmail(email, token)
      navigate('/login')
    } catch (err) {
    }
  }

  return (
    <div className="auth-container">
      <h2>Verify Email</h2>
      <p>Please enter the verification token sent to your email.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            readOnly
          />
        </div>
        <div className="form-group">
          <label htmlFor="token">Verification Token</label>
          <input
            type="text"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="btn btn-primary">
          Verify Email
        </button>
      </form>
    </div>
  )
}

export default VerifyEmailPage
