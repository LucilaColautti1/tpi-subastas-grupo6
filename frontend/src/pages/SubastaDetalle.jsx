import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'
import toast from 'react-hot-toast'
import { Clock, ArrowLeft, Send, Trash2, AlertTriangle, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatFecha } from '../utils/fecha'

function Countdown({ fechaCierre }) {
  const [parts, setParts] = useState({ h: '00', m: '00', s: '00' })
  useEffect(() => {
    const iv = setInterval(() => {
      const diff = new Date(fechaCierre + 'Z') - new Date()
      if (diff <= 0) { setParts({ h: '00', m: '00', s: '00' }); clearInterval(iv); return }
      setParts({
        h: String(Math.floor(diff / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [fechaCierre])
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[parts.h, parts.m, parts.s].map((v, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ background: '#1a1a1a', color: 'white', borderRadius: 6, padding: '6px 10px', fontSize: 20, fontWeight: 800, fontFamily: 'monospace', minWidth: 48 }}>{v}</div>
          <p style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{['Hs', 'Min', 'Seg'][i]}</p>
        </div>
      ))}
    </div>
  )
}

export default function SubastaDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const [subasta, setSubasta] = useState(null)
  const [monto, setMonto] = useState('')
  const [loading, setLoading] = useState(false)
  const [misPujas, setMisPujas] = useState([])
  const [todasPujas, setTodasPujas] = useState([])
  const [comentarios, setComentarios] = useState([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [loadingComentario, setLoadingComentario] = useState(false)
  const [mostrarDisputa, setMostrarDisputa] = useState(false)
  const [disputaForm, setDisputaForm] = useState({ motivo: '', descripcion: '' })
  const [loadingDisputa, setLoadingDisputa] = useState(false)
  const [mostrarCancelar, setMostrarCancelar] = useState(false)
  const [motivoCancelar, setMotivoCancelar] = useState('')

  const cargar = () => {
    client.get(`/subastas/${id}`).then(r => setSubasta(r.data))
    client.get(`/subastas/${id}/pujas/mias`).then(r => setMisPujas(r.data)).catch(() => {})
    client.get(`/subastas/${id}/pujas`).then(r => setTodasPujas(r.data)).catch(() => {})
    client.get(`/subastas/${id}/comentarios`).then(r => setComentarios(r.data)).catch(() => {})
  }

  useEffect(() => { cargar() }, [id])

  const pujar = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await client.post(`/subastas/${id}/pujar`, { monto: parseFloat(monto) })
      toast.success('Puja registrada')
      setMonto('')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al pujar')
    } finally {
      setLoading(false)
    }
  }

  const cancelarSubasta = async () => {
    try {
      await client.post(`/subastas/${id}/cancelar`, { motivo: motivoCancelar })
      toast.success('Subasta cancelada')
      setMostrarCancelar(false)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cancelar')
    }
  }

  const abrirDisputa = async (e) => {
    e.preventDefault()
    setLoadingDisputa(true)
    try {
      await client.post(`/disputas/subasta/${id}`, disputaForm)
      toast.success('Disputa abierta')
      setMostrarDisputa(false)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al abrir disputa')
    } finally {
      setLoadingDisputa(false)
    }
  }

  if (!subasta) return <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>Cargando...</div>

  const minimo = subasta.montoActual + subasta.incrementoMinimo
  const estadoBadge = { ACTIVA: 'badge-green', ADJUDICADA: 'badge-purple', FINALIZADA: 'badge-gray', CANCELADA: 'badge-red', EN_DISPUTA: 'badge-orange' }[subasta.estado] || 'badge-gray'
  const esVendedor = user && subasta.vendedor?.email === user.email
  const esGanador = user && subasta.ganador?.email === user.email
  const puedeDisputar = subasta.estado === 'ADJUDICADA' && (esVendedor || esGanador)
  const puedeCancel = esVendedor && (subasta.estado === 'ACTIVA' || subasta.estado === 'PUBLICADA') && todasPujas.length === 0

  const anonimizar = (nombre) => nombre ? nombre[0] + '***' : 'Usuario ***'

  return (
    <div className="page">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 13, marginBottom: 16 }}>
        <ArrowLeft size={15} /> Volver a subastas
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ height: 420, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {subasta.producto?.imagenBase64
                ? <img src={subasta.producto.imagenBase64} alt={subasta.producto.titulo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <div style={{ color: '#ccc', fontSize: 13 }}>Sin imagen</div>
              }
            </div>
          </div>

          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Descripción del producto</h3>
            <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7 }}>{subasta.producto?.descripcion || 'Sin descripción'}</p>
            <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 14, borderTop: '1px solid #eee', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Vendedor</p>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{subasta.vendedor?.nombre}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Categoría</p>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{subasta.producto?.categoria?.nombre}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Inicio</p>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{formatFecha(subasta.fechaInicio)}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Cierre</p>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{formatFecha(subasta.fechaCierre)}</p>
              </div>
            </div>
          </div>

          {(misPujas.length > 0 || todasPujas.length > 0) && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Últimas ofertas</h3>
              {(todasPujas.length > 0 ? todasPujas : misPujas).slice(0, 5).map((p, i) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{(p.usuario?.nombre || 'U')[0]}</div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{todasPujas.length > 0 ? anonimizar(p.usuario?.nombre) : 'Mi oferta'}</p>
                      <p style={{ fontSize: 11, color: '#888' }}>{formatFecha(p.fecha)}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>${p.monto?.toLocaleString('es-AR')}</p>
                    {i === 0 && <span className="badge badge-green" style={{ fontSize: 10 }}>Liderando</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Comentarios ({comentarios.length})</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!nuevoComentario.trim()) return
              setLoadingComentario(true)
              try {
                await client.post(`/subastas/${id}/comentarios`, { texto: nuevoComentario })
                setNuevoComentario('')
                client.get(`/subastas/${id}/comentarios`).then(r => setComentarios(r.data))
              } catch { toast.error('Error al comentar') }
              finally { setLoadingComentario(false) }
            }} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input className="input" value={nuevoComentario} onChange={e => setNuevoComentario(e.target.value)} placeholder="Escribí tu comentario..." style={{ flex: 1 }} />
              <button className="btn btn-primary" type="submit" disabled={loadingComentario} style={{ borderRadius: 8, padding: '0 16px' }}>
                <Send size={15} />
              </button>
            </form>
            {comentarios.length === 0
              ? <p style={{ color: '#888', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sé el primero en comentar</p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {comentarios.map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                      <div className="avatar" style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0 }}>{c.usuario?.nombre?.[0]?.toUpperCase()}</div>
                      <div style={{ flex: 1, background: '#f9f5ff', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{c.usuario?.nombre}</span>
                            <span style={{ color: '#888', fontSize: 11, marginLeft: 8 }}>{formatFecha(c.fecha)}</span>
                          </div>
                          <button onClick={async () => {
                            await client.delete(`/subastas/${id}/comentarios/${c.id}`)
                            client.get(`/subastas/${id}/comentarios`).then(r => setComentarios(r.data))
                          }} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: 0 }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p style={{ fontSize: 13, color: '#444', marginTop: 4 }}>{c.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <h1 style={{ fontSize: 17, fontWeight: 800, flex: 1, paddingRight: 10, lineHeight: 1.3 }}>{subasta.producto?.titulo}</h1>
              <span className={`badge ${estadoBadge}`}>{subasta.estado}</span>
            </div>

            <div style={{ background: '#f9f5ff', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Precio base</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#555', marginBottom: 12 }}>${subasta.precioBase?.toLocaleString('es-AR')}</p>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Oferta actual</p>
              <p style={{ fontSize: 30, fontWeight: 800, color: '#7c3aed', marginBottom: 4 }}>${subasta.montoActual?.toLocaleString('es-AR')}</p>
              <p style={{ fontSize: 12, color: '#888' }}>{todasPujas.length} ofertas realizadas</p>
            </div>

            {subasta.estado === 'ACTIVA' && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: '#666', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> La subasta termina en
                  </p>
                  <Countdown fechaCierre={subasta.fechaCierre} />
                </div>
                {!esVendedor && (
                  <form onSubmit={pujar}>
                    <div className="field">
                      <label className="label">Hacé tu oferta</label>
                      <p style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Monto mínimo: <strong>${minimo?.toLocaleString('es-AR')}</strong></p>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#555' }}>$</span>
                        <input className="input" type="number" value={monto} onChange={e => setMonto(e.target.value)}
                          min={minimo} step="0.01" placeholder={minimo?.toLocaleString('es-AR')} required style={{ paddingLeft: 28 }} />
                      </div>
                    </div>
                    <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ borderRadius: 10, padding: '13px', fontSize: 15 }}>
                      {loading ? 'Enviando...' : 'Ofertar'}
                    </button>
                  </form>
                )}
              </>
            )}

            {subasta.estado === 'ADJUDICADA' && (
              <div style={{ background: '#dcfce7', borderRadius: 10, padding: 14, textAlign: 'center', marginBottom: 12 }}>
                <p style={{ fontWeight: 700, color: '#16a34a' }}>Subasta adjudicada</p>
                <p style={{ fontSize: 13, color: '#555' }}>Precio final: <strong>${subasta.precioFinal?.toLocaleString('es-AR')}</strong></p>
              </div>
            )}

            {subasta.estado === 'EN_DISPUTA' && (
              <div style={{ background: '#fff7ed', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <p style={{ fontWeight: 700, color: '#ea580c' }}>Subasta en disputa</p>
                <p style={{ fontSize: 13, color: '#555' }}>Un administrador está revisando el caso.</p>
              </div>
            )}

            {puedeCancel && (
              <button onClick={() => setMostrarCancelar(true)} className="btn btn-block"
                style={{ borderRadius: 8, background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', marginTop: 12 }}>
                Cancelar subasta
              </button>
            )}

            {puedeDisputar && (
              <button onClick={() => setMostrarDisputa(true)} className="btn btn-block"
                style={{ borderRadius: 8, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', marginTop: 8 }}>
                <AlertTriangle size={15} /> Abrir disputa
              </button>
            )}
          </div>

          {misPujas.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Mis ofertas</h3>
              {misPujas.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                  <span style={{ color: '#666' }}>{formatFecha(p.fecha)}</span>
                  <span style={{ fontWeight: 700 }}>${p.monto?.toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {mostrarCancelar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: 28, width: '100%', maxWidth: 420, position: 'relative' }}>
            <button onClick={() => setMostrarCancelar(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Cancelar subasta</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>{subasta.producto?.titulo}</p>
            <div className="field">
              <label className="label">Motivo</label>
              <textarea className="input" value={motivoCancelar} onChange={e => setMotivoCancelar(e.target.value)}
                rows={3} placeholder="Indicá el motivo..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setMostrarCancelar(false)} className="btn btn-secondary" style={{ flex: 1, borderRadius: 8 }}>Volver</button>
              <button onClick={cancelarSubasta} disabled={!motivoCancelar.trim()} className="btn btn-danger" style={{ flex: 1, borderRadius: 8 }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarDisputa && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: 28, width: '100%', maxWidth: 460, position: 'relative' }}>
            <button onClick={() => setMostrarDisputa(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Abrir disputa</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Un administrador va a revisar tu caso.</p>
            <form onSubmit={abrirDisputa}>
              <div className="field">
                <label className="label">Motivo</label>
                <input className="input" value={disputaForm.motivo} onChange={e => setDisputaForm({ ...disputaForm, motivo: e.target.value })}
                  placeholder="Ej: El producto no coincide con la descripción" required />
              </div>
              <div className="field">
                <label className="label">Descripción detallada</label>
                <textarea className="input" value={disputaForm.descripcion} onChange={e => setDisputaForm({ ...disputaForm, descripcion: e.target.value })}
                  rows={4} placeholder="Describí el problema en detalle..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setMostrarDisputa(false)} className="btn btn-secondary" style={{ flex: 1, borderRadius: 8 }}>Cancelar</button>
                <button type="submit" disabled={loadingDisputa} className="btn btn-primary" style={{ flex: 1, borderRadius: 8, background: '#ea580c' }}>
                  {loadingDisputa ? 'Abriendo...' : 'Confirmar disputa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
