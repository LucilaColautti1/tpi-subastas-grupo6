import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Bienvenido')
      navigate('/')
    } catch {
      toast.error('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7' }}>
      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 8, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Iniciar sesión</h1>
        <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>Accedé a tu cuenta de LaCasacaSubastas</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={{ width: '100%', border: '1px solid #ccc', borderRadius: 4, padding: '10px 12px', fontSize: 15, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#3665f3'}
              onBlur={e => e.target.style.borderColor = '#ccc'}
              required
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ width: '100%', border: '1px solid #ccc', borderRadius: 4, padding: '10px 12px', fontSize: 15, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#3665f3'}
              onBlur={e => e.target.style.borderColor = '#ccc'}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#3665f3', color: 'white', border: 'none', borderRadius: 24, padding: '12px', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
        <hr style={{ margin: '24px 0', borderColor: '#eee' }} />
        <p style={{ textAlign: 'center', fontSize: 14, color: '#666' }}>
          ¿No tenés cuenta?{' '}
          <Link to="/register" style={{ color: '#3665f3', fontWeight: 600 }}>Registrate</Link>
        </p>
      </div>
    </div>
  )
}
