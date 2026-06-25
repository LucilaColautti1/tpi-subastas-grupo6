import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { ArrowLeft, Clock } from 'lucide-react'

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

export default function MisPujas() {
  const [subastas, setSubastas] = useState([])
  const [tab, setTab] = useState('todas')

  useEffect(() => {
    client.get('/subastas/donde-puje').then(r => setSubastas(r.data))
  }, [])

  const tabs = [
    { key: 'todas', label: 'Todas' },
    { key: 'ACTIVA', label: 'Activas' },
    { key: 'ADJUDICADA', label: 'Ganadas' },
    { key: 'FINALIZADA', label: 'Finalizadas' },
  ]

  const filtradas = tab === 'todas' ? subastas : subastas.filter(s => s.estado === tab)

  const estadoBadge = (e) => ({ ACTIVA: 'badge-green', ADJUDICADA: 'badge-purple', FINALIZADA: 'badge-gray', CANCELADA: 'badge-red' }[e] || 'badge-gray')

  return (
    <div className="page">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 13, marginBottom: 20 }}>
        <ArrowLeft size={15} /> Volver
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Mis Ofertas</h1>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ borderBottom: '1px solid #eee', display: 'flex', padding: '0 20px' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14,
              fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? '#7c3aed' : '#666',
              borderBottom: tab === t.key ? '2px solid #7c3aed' : '2px solid transparent',
              marginBottom: -1
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {filtradas.length === 0
            ? <div style={{ textAlign: 'center', padding: 48, color: '#888' }}>No hay subastas en esta categoría</div>
            : filtradas.map(s => (
                <Link key={s.id} to={`/subastas/${s.id}`}>
                  <div style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9f5ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <div style={{ width: 72, height: 72, background: '#f5f5f5', borderRadius: 8, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.producto?.imagenBase64 ? <img src={s.producto.imagenBase64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#ccc', fontSize: 10 }}>Sin img</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, marginBottom: 4 }}>{s.producto?.titulo}</p>
                      <span className="badge badge-purple" style={{ marginBottom: 6 }}>{s.producto?.categoria?.nombre}</span>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 12, color: '#888' }}>
                        <Clock size={12} /> Termina: {new Date(s.fechaCierre).toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Oferta actual</p>
                      <p style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>${s.montoActual?.toLocaleString('es-AR')}</p>
                      <span className={`badge ${estadoBadge(s.estado)}`}>{s.estado}</span>
                    </div>
                  </div>
                </Link>
              ))
          }
        </div>
      </div>
    </div>
  )
}
