import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useSearch } from '../context/SearchContext'
import { Clock, TrendingUp } from 'lucide-react'

function Countdown({ fechaCierre }) {
  const [t, setT] = useState('')
  useEffect(() => {
    const iv = setInterval(() => {
      const diff = new Date(fechaCierre + 'Z') - new Date()
      if (diff <= 0) { setT('00:00:00'); clearInterval(iv); return }
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setT(`${h}:${m}:${s}`)
    }, 1000)
    return () => clearInterval(iv)
  }, [fechaCierre])
  return <span className="countdown">{t}</span>
}

function SubastaCard({ s }) {
  return (
    <Link to={`/subastas/${s.id}`}>
      <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.12)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
      >
        <div style={{ position: 'relative', height: 200, background: '#f5f5f5', overflow: 'hidden' }}>
          {s.producto?.imagenBase64
            ? <img src={s.producto.imagenBase64} alt={s.producto.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 13 }}>Sin imagen</div>
          }
          <span className={`badge ${s.estado === 'ACTIVA' ? 'badge-green' : s.estado === 'PUBLICADA' ? 'badge-orange' : 'badge-gray'}`}
            style={{ position: 'absolute', top: 10, left: 10 }}>
            {s.estado}
          </span>
        </div>
        <div style={{ padding: 14 }}>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.producto?.titulo}</p>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{s.producto?.categoria?.nombre}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: 11, color: '#888' }}>Oferta actual</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>${s.montoActual?.toLocaleString('es-AR')}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                <Clock size={11} /> Termina en
              </p>
              <Countdown fechaCierre={s.fechaCierre} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [subastas, setSubastas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [catSeleccionada, setCatSeleccionada] = useState(null)
  const { search: busqueda } = useSearch()

  useEffect(() => {
    const cargar = () => {
      Promise.all([
        client.get('/subastas'),
        client.get('/categorias')
      ]).then(([s, c]) => {
        setSubastas(s.data)
        setCategorias(c.data)
      }).finally(() => setLoading(false))
    }
    cargar()
    const intervalo = setInterval(cargar, 10000)
    return () => clearInterval(intervalo)
  }, [])

  const subastasFiltradas = subastas
    .filter(s => catSeleccionada ? s.producto?.categoria?.id === catSeleccionada : true)
    .filter(s => busqueda.trim()
      ? s.producto?.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.producto?.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.producto?.categoria?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
      : true
    )

  const porFinalizar = [...subastas].sort((a, b) => new Date(a.fechaCierre) - new Date(b.fechaCierre)).slice(0, 3)

  return (
    <div className="page">
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: 20 }}>

        {/* Sidebar izquierdo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link to="/crear-subasta" className="btn btn-primary btn-block" style={{ borderRadius: 10, padding: '12px 16px' }}>
            + Publicar subasta
          </Link>
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Categorías</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button onClick={() => setCatSeleccionada(null)}
                style={{ background: catSeleccionada === null ? '#e8eaf6' : 'none', color: catSeleccionada === null ? '#2A398D' : '#444', border: 'none', padding: '8px 10px', borderRadius: 8, textAlign: 'left', fontWeight: catSeleccionada === null ? 600 : 400, cursor: 'pointer', fontSize: 13 }}>
                Todas las categorías
              </button>
              {categorias.map(c => (
                <button key={c.id} onClick={() => setCatSeleccionada(c.id)}
                  style={{ background: catSeleccionada === c.id ? '#e8eaf6' : 'none', color: catSeleccionada === c.id ? '#2A398D' : '#444', border: 'none', padding: '8px 10px', borderRadius: 8, textAlign: 'left', fontWeight: catSeleccionada === c.id ? 600 : 400, cursor: 'pointer', fontSize: 13 }}>
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Centro */}
        <div>
          {/* Hero */}
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', borderRadius: 16, padding: '32px 40px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ color: '#3CAC3B', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Mundial 2026</p>
              <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
                Tu próxima prenda<br />
                <span style={{ color: '#3CAC3B' }}>te está esperando</span>
              </h1>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>Subastá y encontrá ropa deportiva de calidad<br />a los mejores precios.</p>
              <Link to='/busqueda' className='btn btn-primary' style={{ borderRadius: 24, padding: '10px 24px' }}>Explorar subastas</Link>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>
              {catSeleccionada ? categorias.find(c => c.id === catSeleccionada)?.nombre : 'Subastas destacadas'}
            </h2>
            <span style={{ fontSize: 13, color: '#888' }}>{subastasFiltradas.length} resultados</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Cargando...</div>
          ) : subastasFiltradas.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: '#888' }}>
              <p style={{ fontSize: 16, marginBottom: 8 }}>No hay subastas activas</p>
              <Link to="/crear-subasta" style={{ color: '#2A398D', fontWeight: 600 }}>Crear una subasta</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {subastasFiltradas.map(s => <SubastaCard key={s.id} s={s} />)}
            </div>
          )}
        </div>

        {/* Sidebar derecho */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 16 }}>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div className="avatar">{user.email?.[0]?.toUpperCase()}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>¡Hola, {user.nombre || user.email?.split('@')[0]}!</p>
                    <p style={{ fontSize: 12, color: '#888' }}>Bienvenido a LaCasacaSubastas</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <Link to="/mis-pujas" style={{ background: '#e8eaf6', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#2A398D' }}>{subastas.length}</p>
                    <p style={{ fontSize: 11, color: '#888' }}>Subastas activas</p>
                  </Link>
                  <Link to="/mis-subastas" style={{ background: '#e8eaf6', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#2A398D' }}>→</p>
                    <p style={{ fontSize: 11, color: '#888' }}>Mis subastas</p>
                  </Link>
                </div>
                <Link to="/mis-subastas" className="btn btn-secondary btn-block" style={{ borderRadius: 8, fontSize: 13 }}>
                  Ver mis actividades
                </Link>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div className="avatar">?</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>¡Hola!</p>
                    <p style={{ fontSize: 12, color: '#888' }}>Iniciá sesión para pujar</p>
                  </div>
                </div>
                <Link to="/login" className="btn btn-primary btn-block" style={{ marginBottom: 8, borderRadius: 8 }}>Iniciar sesión</Link>
                <Link to="/register" className="btn btn-outline btn-block" style={{ borderRadius: 8 }}>Registrarse</Link>
              </>
            )}
          </div>

          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} color="#dc2626" /> Por finalizar
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {porFinalizar.length === 0
                ? <p style={{ color: '#888', fontSize: 13 }}>No hay subastas próximas a cerrar</p>
                : porFinalizar.map(s => (
                  <Link key={s.id} to={`/subastas/${s.id}`}>
                    <div style={{ display: 'flex', gap: 10, paddingBottom: 10, borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                      <div style={{ width: 44, height: 44, background: '#f5f5f5', borderRadius: 8, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {s.producto?.imagenBase64 && <img src={s.producto.imagenBase64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.producto?.titulo}</p>
                        <p style={{ fontSize: 12, fontWeight: 700 }}>${s.montoActual?.toLocaleString('es-AR')}</p>
                        <Countdown fechaCierre={s.fechaCierre} />
                      </div>
                    </div>
                  </Link>
                ))
              }
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={15} color="#2A398D" /> ¿Cómo funciona?
            </p>
            {[
              { n: '1', t: 'Explorá', d: 'Buscá prendas que te gusten' },
              { n: '2', t: 'Ofertá', d: 'Hacé tu mejor oferta y competí' },
              { n: '3', t: 'Ganá', d: '¡Si sos el mejor postor, la prenda es tuya!' },
              { n: '4', t: 'Recibí', d: 'Coordina la entrega con el vendedor' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, background: '#e8eaf6', color: '#2A398D', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.n}</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{s.t}</p>
                  <p style={{ fontSize: 12, color: '#888' }}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
