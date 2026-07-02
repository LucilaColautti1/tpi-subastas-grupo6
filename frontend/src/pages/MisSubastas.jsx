import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import toast from 'react-hot-toast'
import { ArrowLeft, Clock, Pencil, X, Ban, Check } from 'lucide-react'

function Countdown({ fechaCierre }) {
  const [t, setT] = useState('')
  useEffect(() => {
    const iv = setInterval(() => {
      const diff = new Date(fechaCierre + 'Z') - new Date()
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

const estadoBadge = (e) => ({
  ACTIVA: 'badge-green', ADJUDICADA: 'badge-purple', FINALIZADA: 'badge-gray',
  CANCELADA: 'badge-red', PUBLICADA: 'badge-orange', BORRADOR: 'badge-gray', EN_DISPUTA: 'badge-orange'
}[e] || 'badge-gray')

function toLocalDatetime(utcStr) {
  if (!utcStr) return ''
  const d = new Date(utcStr + 'Z')
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function MisSubastas() {
  const [subastas, setSubastas] = useState([])
  const [tab, setTab] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [cancelando, setCancelando] = useState(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')

  const cargar = () => {
    client.get('/subastas/mis-subastas').then(r => setSubastas(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 10000)
    return () => clearInterval(intervalo)
  }, [])

  const abrirEdicion = (s) => {
    setEditando(s)
    setEditForm({
      precioBase: s.precioBase,
      incrementoMinimo: s.incrementoMinimo,
      fechaInicio: toLocalDatetime(s.fechaInicio),
      fechaCierre: toLocalDatetime(s.fechaCierre),
    })
  }

  const guardarEdicion = async () => {
    setLoadingEdit(true)
    try {
      await client.put(`/subastas/seller/${editando.id}`, {
        precioBase: parseFloat(editForm.precioBase),
        incrementoMinimo: parseFloat(editForm.incrementoMinimo),
        fechaInicio: new Date(editForm.fechaInicio).toISOString().slice(0, 19),
        fechaCierre: new Date(editForm.fechaCierre).toISOString().slice(0, 19),
      })
      toast.success('Subasta actualizada')
      setEditando(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al editar')
    } finally {
      setLoadingEdit(false)
    }
  }

  const publicar = async (id) => {
    try {
      await client.post(`/subastas/seller/${id}/publicar`)
      toast.success('Subasta publicada')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al publicar')
    }
  }

  const cancelar = async () => {
    try {
      await client.post(`/subastas/${cancelando.id}/cancelar`, { motivo: motivoCancelacion })
      toast.success('Subasta cancelada')
      setCancelando(null)
      setMotivoCancelacion('')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cancelar')
    }
  }

  const tabs = [
    { key: 'todas', label: 'Todas' },
    { key: 'BORRADOR', label: 'Borradores' },
    { key: 'PUBLICADA', label: 'Publicadas' },
    { key: 'ACTIVA', label: 'Activas' },
    { key: 'ADJUDICADA', label: 'Adjudicadas' },
    { key: 'FINALIZADA', label: 'Finalizadas' },
    { key: 'CANCELADA', label: 'Canceladas' },
  ]

  const estadoLabel = (e) => ({
    ACTIVA: 'Activa', PUBLICADA: 'Publicada', BORRADOR: 'Borrador',
    ADJUDICADA: 'Adjudicada', FINALIZADA: 'Finalizada',
    CANCELADA: 'Cancelada', EN_DISPUTA: 'En disputa'
  }[e] || e)

  const filtradas = tab === 'todas' ? subastas : subastas.filter(s => s.estado === tab)

  return (
    <div className="page">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 13, marginBottom: 20 }}>
        <ArrowLeft size={15} /> Volver
      </Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Mis Subastas</h1>
        <Link to="/crear-subasta" className="btn btn-primary" style={{ borderRadius: 8 }}>+ Nueva subasta</Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ borderBottom: '1px solid #eee', display: 'flex', overflowX: 'auto', padding: '0 16px' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
              fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? '#2A398D' : '#666',
              borderBottom: tab === t.key ? '2px solid #2A398D' : '2px solid transparent',
              marginBottom: -1
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#888' }}>Cargando...</div>
          ) : filtradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#888' }}>
              <p style={{ marginBottom: 8 }}>No tenés subastas en esta categoría</p>
              <Link to="/crear-subasta" style={{ color: '#2A398D', fontWeight: 600 }}>Crear una subasta</Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  {['Producto', 'Estado', 'Oferta actual', 'Precio base', 'Inicio', 'Cierre', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#888', fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 48, height: 48, background: '#f5f5f5', borderRadius: 6, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {s.producto?.imagenBase64
                            ? <img src={s.producto.imagenBase64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ color: '#ccc', fontSize: 10 }}>Sin img</span>
                          }
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 13 }}>{s.producto?.titulo}</p>
                          <span className="badge badge-purple" style={{ fontSize: 10 }}>{s.producto?.categoria?.nombre}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${estadoBadge(s.estado)}`}>{estadoLabel(s.estado)}</span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700, fontSize: 14 }}>${s.montoActual?.toLocaleString('es-AR')}</td>
                    <td style={{ padding: '12px', color: '#666', fontSize: 13 }}>${s.precioBase?.toLocaleString('es-AR')}</td>
                    <td style={{ padding: '12px', color: '#666', fontSize: 12 }}>{new Date(s.fechaInicio).toLocaleDateString('es-AR')}</td>
                    <td style={{ padding: '12px', fontSize: 12 }}>
                      {s.estado === 'ACTIVA'
                        ? <Countdown fechaCierre={s.fechaCierre} />
                        : <span style={{ color: '#666' }}>{new Date(s.fechaCierre).toLocaleDateString('es-AR')}</span>
                      }
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/subastas/${s.id}`} style={{ color: '#2A398D', fontWeight: 600, fontSize: 13 }}>Ver</Link>

                        {(s.estado === 'BORRADOR' || s.estado === 'PUBLICADA' || s.estado === 'ACTIVA') && s.estado !== 'CANCELADA' && s.estado !== 'FINALIZADA' && s.estado !== 'ADJUDICADA' && (
                          <button onClick={() => { setCancelando(s); setMotivoCancelacion('') }}
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Ban size={13} /> Cancelar
                          </button>
                        )}
                        {s.estado === 'BORRADOR' && (
                          <button onClick={() => publicar(s.id)}
                            style={{ background: 'none', border: 'none', color: '#3CAC3B', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={13} /> Publicar
                          </button>
                        )}
                        {(s.estado === 'BORRADOR' || s.estado === 'PUBLICADA') && (
                          <button onClick={() => abrirEdicion(s)}
                            style={{ background: 'none', border: 'none', color: '#2A398D', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Pencil size={13} /> Editar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal edición */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: 28, width: '100%', maxWidth: 480, position: 'relative' }}>
            <button onClick={() => setEditando(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Editar subasta — {editando.producto?.titulo}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label className="label">Precio base ($)</label>
                <input className="input" type="number" step="0.01" value={editForm.precioBase}
                  onChange={e => setEditForm({ ...editForm, precioBase: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">Incremento mínimo ($)</label>
                <input className="input" type="number" step="0.01" value={editForm.incrementoMinimo}
                  onChange={e => setEditForm({ ...editForm, incrementoMinimo: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label className="label">Fecha de inicio</label>
              <input className="input" type="datetime-local" value={editForm.fechaInicio}
                onChange={e => setEditForm({ ...editForm, fechaInicio: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Fecha de cierre</label>
              <input className="input" type="datetime-local" value={editForm.fechaCierre}
                onChange={e => setEditForm({ ...editForm, fechaCierre: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setEditando(null)} className="btn btn-danger" style={{ flex: 1, borderRadius: 8 }}>
                Cancelar
              </button>
              <button onClick={guardarEdicion} className="btn btn-primary" disabled={loadingEdit} style={{ flex: 1, borderRadius: 8 }}>
                {loadingEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cancelación */}
      {cancelando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: 28, width: '100%', maxWidth: 440, position: 'relative' }}>
            <button onClick={() => setCancelando(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Cancelar subasta</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>{cancelando.producto?.titulo}</p>
            <div className="field">
              <label className="label">Motivo de la cancelación</label>
              <textarea className="input" value={motivoCancelacion}
                onChange={e => setMotivoCancelacion(e.target.value)}
                rows={3} placeholder="Indicá el motivo..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setCancelando(null)} className="btn btn-secondary" style={{ flex: 1, borderRadius: 8 }}>
                Volver
              </button>
              <button onClick={cancelar} className="btn btn-danger" disabled={!motivoCancelacion.trim()} style={{ flex: 1, borderRadius: 8 }}>
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
