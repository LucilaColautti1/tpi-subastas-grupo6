import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import client from '../api/client'
import { Clock, Search, SlidersHorizontal, X } from 'lucide-react'

function Countdown({ fechaCierre }) {
  const [t, setT] = useState('')
  useEffect(() => {
    const iv = setInterval(() => {
      const diff = new Date(fechaCierre) - new Date()
      if (diff <= 0) { setT('Cerrada'); clearInterval(iv); return }
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setT(`${h}:${m}:${s}`)
    }, 1000)
    return () => clearInterval(iv)
  }, [fechaCierre])
  return <span className="countdown">{t}</span>
}

const ESTADOS = [
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'PUBLICADA', label: 'Publicada' },
  { value: 'ADJUDICADA', label: 'Adjudicada' },
  { value: 'FINALIZADA', label: 'Finalizada' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'EN_DISPUTA', label: 'En disputa' },
]

const estadoBadge = (e) => ({
  ACTIVA: 'badge-green', ADJUDICADA: 'badge-purple', FINALIZADA: 'badge-gray',
  CANCELADA: 'badge-red', PUBLICADA: 'badge-orange', EN_DISPUTA: 'badge-orange'
}[e] || 'badge-gray')

export default function Busqueda() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [subastas, setSubastas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState(searchParams.get('q') || '')
  const [catsSeleccionadas, setCatsSeleccionadas] = useState([])
  const [estadosSeleccionados, setEstadosSeleccionados] = useState([])
  const [ordenar, setOrdenar] = useState('reciente')
  const [precioMin, setPrecioMin] = useState('')
  const [precioMax, setPrecioMax] = useState('')

  useEffect(() => {
    const cargar = () => {
      Promise.all([client.get('/subastas/publicas'), client.get('/categorias')])
        .then(([s, c]) => { setSubastas(s.data); setCategorias(c.data) })
        .finally(() => setLoading(false))
    }
    cargar()
    const intervalo = setInterval(cargar, 10000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    setBusqueda(searchParams.get('q') || '')
  }, [searchParams])

  const toggleCat = (id) => setCatsSeleccionadas(prev =>
    prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
  )

  const toggleEstado = (v) => setEstadosSeleccionados(prev =>
    prev.includes(v) ? prev.filter(s => s !== v) : [...prev, v]
  )

  const limpiar = () => {
    setCatsSeleccionadas([])
    setEstadosSeleccionados([])
    setPrecioMin('')
    setPrecioMax('')
    setOrdenar('reciente')
    setBusqueda('')
    setSearchParams({})
  }

  const filtradas = subastas
    .filter(s => catsSeleccionadas.length === 0 || catsSeleccionadas.includes(s.producto?.categoria?.id))
    .filter(s => estadosSeleccionados.length === 0 || estadosSeleccionados.includes(s.estado))
    .filter(s => busqueda.trim()
      ? s.producto?.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.producto?.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.producto?.categoria?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
      : true
    )
    .filter(s => precioMin ? s.montoActual >= parseFloat(precioMin) : true)
    .filter(s => precioMax ? s.montoActual <= parseFloat(precioMax) : true)
    .sort((a, b) => {
      if (ordenar === 'precio-asc') return a.montoActual - b.montoActual
      if (ordenar === 'precio-desc') return b.montoActual - a.montoActual
      if (ordenar === 'cierre') return new Date(a.fechaCierre) - new Date(b.fechaCierre)
      return b.id - a.id
    })

  const filtrosActivos = catsSeleccionadas.length + estadosSeleccionados.length + (precioMin ? 1 : 0) + (precioMax ? 1 : 0)

  return (
    <div className="page">
      <form onSubmit={e => { e.preventDefault(); setSearchParams(busqueda ? { q: busqueda } : {}) }}
        style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por título, descripción o categoría..."
            className="input" style={{ paddingLeft: 40, borderRadius: 24 }} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ borderRadius: 24, padding: '0 24px' }}>Buscar</button>
      </form>

      {filtrosActivos > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {catsSeleccionadas.map(id => {
            const cat = categorias.find(c => c.id === id)
            return (
              <span key={id} onClick={() => toggleCat(id)}
                style={{ background: '#e8eaf6', color: '#2A398D', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {cat?.nombre} <X size={12} />
              </span>
            )
          })}
          {estadosSeleccionados.map(v => {
            const estado = ESTADOS.find(e => e.value === v)
            return (
              <span key={v} onClick={() => toggleEstado(v)}
                style={{ background: '#e8eaf6', color: '#2A398D', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {estado?.label} <X size={12} />
              </span>
            )
          })}
          <button onClick={limpiar} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Limpiar todo
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16, alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <SlidersHorizontal size={14} /> Filtros
              {filtrosActivos > 0 && <span style={{ background: '#2A398D', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{filtrosActivos}</span>}
            </p>
            {filtrosActivos > 0 && <button onClick={limpiar} style={{ background: 'none', border: 'none', color: '#2A398D', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Limpiar</button>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Categoría</p>
            {categorias.map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
                <input type="checkbox" checked={catsSeleccionadas.includes(c.id)} onChange={() => toggleCat(c.id)} style={{ accentColor: '#2A398D', width: 15, height: 15 }} />
                <span style={{ fontSize: 13, color: catsSeleccionadas.includes(c.id) ? '#2A398D' : '#444', fontWeight: catsSeleccionadas.includes(c.id) ? 600 : 400 }}>{c.nombre}</span>
              </label>
            ))}
          </div>

          <hr className="divider" />

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Estado</p>
            {ESTADOS.map(e => (
              <label key={e.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
                <input type="checkbox" checked={estadosSeleccionados.includes(e.value)} onChange={() => toggleEstado(e.value)} style={{ accentColor: '#2A398D', width: 15, height: 15 }} />
                <span className={`badge ${estadoBadge(e.value)}`}>{e.label}</span>
              </label>
            ))}
          </div>

          <hr className="divider" />

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Precio</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" type="number" placeholder="Mín $" value={precioMin} onChange={e => setPrecioMin(e.target.value)} style={{ padding: '7px 10px' }} />
              <input className="input" type="number" placeholder="Máx $" value={precioMax} onChange={e => setPrecioMax(e.target.value)} style={{ padding: '7px 10px' }} />
            </div>
          </div>

          <hr className="divider" />

          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Ordenar por</p>
            {[
              { v: 'reciente', l: 'Más reciente' },
              { v: 'precio-asc', l: 'Menor precio' },
              { v: 'precio-desc', l: 'Mayor precio' },
              { v: 'cierre', l: 'Próximo a cerrar' },
            ].map(o => (
              <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
                <input type="radio" name="orden" checked={ordenar === o.v} onChange={() => setOrdenar(o.v)} style={{ accentColor: '#2A398D' }} />
                <span style={{ fontSize: 13, color: ordenar === o.v ? '#2A398D' : '#444', fontWeight: ordenar === o.v ? 600 : 400 }}>{o.l}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 14 }}>
            {loading ? 'Cargando...' : <><strong>{filtradas.length}</strong> resultados{busqueda ? ` para "${busqueda}"` : ''}</>}
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Cargando...</div>
          ) : filtradas.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: '#888' }}>
              <p style={{ fontSize: 16, marginBottom: 8 }}>No se encontraron subastas</p>
              <p style={{ fontSize: 13, marginBottom: 16 }}>Probá con otros términos o quitá los filtros</p>
              <button onClick={limpiar} className="btn btn-secondary" style={{ borderRadius: 8 }}>Limpiar filtros</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtradas.map((s, i) => (
                <Link key={s.id} to={`/subastas/${s.id}`}>
                  <div style={{
                    background: 'white', border: '1px solid #eee',
                    borderTop: i > 0 ? 'none' : '1px solid #eee',
                    borderRadius: i === 0 ? '8px 8px 0 0' : i === filtradas.length - 1 ? '0 0 8px 8px' : 0,
                    display: 'flex', gap: 16, padding: 16, cursor: 'pointer'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e8eaf6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ width: 130, height: 100, flexShrink: 0, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.producto?.imagenBase64
                        ? <img src={s.producto.imagenBase64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ color: '#ccc', fontSize: 12 }}>Sin imagen</span>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{s.producto?.titulo}</p>
                      <p style={{ fontSize: 12, color: '#2A398D', marginBottom: 6 }}>{s.producto?.categoria?.nombre}</p>
                      <p style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{s.producto?.descripcion}</p>
                      <div style={{ display: 'flex', gap: 20 }}>
                        <div>
                          <p style={{ fontSize: 11, color: '#888' }}>Oferta actual</p>
                          <p style={{ fontSize: 20, fontWeight: 800 }}>${s.montoActual?.toLocaleString('es-AR')}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: '#888' }}>Precio base</p>
                          <p style={{ fontSize: 14, color: '#555' }}>${s.precioBase?.toLocaleString('es-AR')}</p>
                        </div>
                        {s.estado === 'ACTIVA' && (
                          <div>
                            <p style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} /> Cierra en</p>
                            <Countdown fechaCierre={s.fechaCierre} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
                      <span className={`badge ${estadoBadge(s.estado)}`}>{ESTADOS.find(e => e.value === s.estado)?.label || s.estado}</span>
                      <button className="btn btn-primary" style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8 }}>Ver subasta</button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
