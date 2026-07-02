import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { Search, ShoppingBag, Plus, ChevronDown } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')

  const isActive = (path) => location.pathname === path

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/busqueda?q=${encodeURIComponent(search)}`)
  }

  return (
    <header style={{ background: 'white', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, height: 64 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #2A398D, #3CAC3B)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 16, color: '#1a1a1a', lineHeight: 1 }}>LaCasacaSubastas</p>
              <p style={{ fontSize: 10, color: '#888', lineHeight: 1 }}>Subastas de ropa deportiva</p>
            </div>
          </Link>

          {user ? (
            <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ropa, marcas, categorías..."
                style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 24, padding: '9px 16px 9px 36px', outline: 'none', fontSize: 14, background: '#fafafa' }}
                onFocus={e => e.target.style.borderColor = '#2A398D'}
                onBlur={e => e.target.style.borderColor = '#eee'}
              />
            </form>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          <nav style={{ display: 'flex', gap: 2 }}>
            {[
              { to: '/', label: 'Inicio' },
              { to: '/mis-subastas', label: 'Mis subastas', auth: true },
              { to: '/mis-pujas', label: 'Mis ofertas', auth: true },
      { to: '/mis-disputas', label: 'Mis disputas', auth: true },
              { to: '/mis-productos', label: 'Mis productos', auth: true },
            ].filter(l => !l.auth || user).map(l => (
              <Link key={l.to} to={l.to} style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 14,
                fontWeight: isActive(l.to) ? 600 : 400,
                color: isActive(l.to) ? '#2A398D' : '#555',
                background: isActive(l.to) ? '#e8eaf6' : 'transparent',
              }}>{l.label}</Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
            {user ? (
              <>

                {user.roles?.includes('ADMIN') ? (
                  <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: '1px solid #eee' }}>
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{user.email?.[0]?.toUpperCase()}</div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{user.nombre || user.email?.split('@')[0]}</span>
                    <ChevronDown size={14} color="#888" />
                  </Link>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: '1px solid #eee' }}>
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{user.email?.[0]?.toUpperCase()}</div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{user.nombre || user.email?.split('@')[0]}</span>
                  </div>
                )}
                <button onClick={() => { logout(); navigate('/login') }}
                  style={{ background: 'none', border: '1px solid #eee', color: '#666', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 14, color: '#555', fontWeight: 500 }}>Iniciar sesión</Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13 }}>Registrarse</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
