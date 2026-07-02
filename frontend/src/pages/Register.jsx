import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import client from '../api/client'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await client.post('/auth/register', form)
      toast.success('Cuenta creada. Iniciá sesión.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { width: '100%', border: '1px solid #ccc', borderRadius: 4, padding: '10px 12px', fontSize: 15, outline: 'none' }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7' }}>
      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 8, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Crear cuenta</h1>
        <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>Uníte a LaCasacaSubastas</p>
        <form onSubmit={handleSubmit}>
          {[
            { label: 'Nombre', key: 'nombre', type: 'text', placeholder: 'Tu nombre completo' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'tu@email.com' },
            { label: 'Contraseña', key: 'password', type: 'password', placeholder: 'Mínimo 6 caracteres' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#3665f3'}
                onBlur={e => e.target.style.borderColor = '#ccc'}
                required
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#3665f3', color: 'white', border: 'none', borderRadius: 24, padding: '12px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
        <hr style={{ margin: '24px 0', borderColor: '#eee' }} />
        <p style={{ textAlign: 'center', fontSize: 14, color: '#666' }}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" style={{ color: '#3665f3', fontWeight: 600 }}>Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}
