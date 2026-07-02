import { useEffect, useState } from 'react'
import client from '../api/client'
import toast from 'react-hot-toast'
import { Users, Tag, BarChart2, ArrowLeft, AlertTriangle, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminPanel() {
  const [usuarios, setUsuarios] = useState([])
  const [categorias, setCategorias] = useState([])
  const [subastas, setSubastas] = useState([])
  const [disputas, setDisputas] = useState([])
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [tab, setTab] = useState('dashboard')
  const [resolviendo, setResolviendo] = useState(null)
  const [resolucionForm, setResolucionForm] = useState({ resolucion: '', estadoFinal: 'ADJUDICADA' })

  const cargar = () => {
    client.get('/admin/usuarios').then(r => setUsuarios(r.data)).catch(() => {})
    client.get('/categorias').then(r => setCategorias(r.data))
    client.get('/subastas/todas').then(r => setSubastas(r.data)).catch(() => {})
    client.get('/disputas/todas').then(r => setDisputas(r.data)).catch(() => {})
  }

  useEffect(() => { cargar() }, [])

  const bloquear = async (id, bloqueado) => {
    try {
      await client.post(`/admin/usuarios/${id}/${bloqueado ? 'desbloquear' : 'bloquear'}`)
      toast.success(bloqueado ? 'Desbloqueado' : 'Bloqueado')
      cargar()
    } catch { toast.error('Sin permisos o error') }
  }

  const asignarRol = async (id, rol) => {
    if (!rol) return
    try {
      await client.post(`/admin/usuarios/${id}/rol?rol=${rol}`)
      toast.success(`Rol ${rol} asignado`)
      cargar()
    } catch { toast.error('Error') }
  }

  const crearCategoria = async (e) => {
    e.preventDefault()
    try {
      await client.post('/categorias', { nombre: nuevaCategoria })
      toast.success('Categoría creada')
      setNuevaCategoria('')
      cargar()
    } catch { toast.error('Error') }
  }

  const resolverDisputa = async () => {
    try {
      await client.post(`/disputas/${resolviendo.id}/resolver`, resolucionForm)
      toast.success('Disputa resuelta')
      setResolviendo(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error')
    }
  }

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={15} /> },
    { key: 'usuarios', label: `Usuarios (${usuarios.length})`, icon: <Users size={15} /> },
    { key: 'categorias', label: `Categorías (${categorias.length})`, icon: <Tag size={15} /> },
    { key: 'disputas', label: `Disputas (${disputas.length})`, icon: <AlertTriangle size={15} /> },
  ]

  const estadoLabel = (e) => ({
    ACTIVA: 'Activa', PUBLICADA: 'Publicada', BORRADOR: 'Borrador',
    ADJUDICADA: 'Adjudicada', FINALIZADA: 'Finalizada',
    CANCELADA: 'Cancelada', EN_DISPUTA: 'En disputa'
  }[e] || e)

  const estadoBadge = (e) => ({
    ACTIVA: 'badge-green', ADJUDICADA: 'badge-purple', FINALIZADA: 'badge-gray',
    CANCELADA: 'badge-red', PUBLICADA: 'badge-orange', EN_DISPUTA: 'badge-orange'
  }[e] || 'badge-gray')

  return (
    <div className="page">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 13, marginBottom: 20 }}>
        <ArrowLeft size={15} /> Volver
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Panel de Administración</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 12, alignSelf: 'start' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: 'none',
              borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              background: tab === t.key ? '#e8eaf6' : 'none', color: tab === t.key ? '#2A398D' : '#555',
              marginBottom: 2, textAlign: 'left'
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div>
          {tab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { label: 'Usuarios activos', value: usuarios.filter(u => !u.bloqueado).length, color: '#2A398D' },
                  { label: 'Subastas activas', value: subastas.filter(s => s.estado === 'ACTIVA').length, color: '#16a34a' },
                  { label: 'Disputas pendientes', value: disputas.filter(d => !d.resolucionAdmin).length, color: '#ea580c' },
                  { label: 'Total subastas', value: subastas.length, color: '#2563eb' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <p style={{ fontSize: 32, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</p>
                    <p style={{ fontSize: 12, color: '#888' }}>{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Subastas recientes</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      {['Producto', 'Vendedor', 'Estado', 'Oferta actual', 'Cierre'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#888', fontWeight: 600, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subastas.slice(0, 8).map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 13 }}>{s.producto?.titulo}</td>
                        <td style={{ padding: '10px 12px', color: '#666', fontSize: 13 }}>{s.vendedor?.nombre}</td>
                        <td style={{ padding: '10px 12px' }}><span className={`badge ${estadoBadge(s.estado)}`}>{estadoLabel(s.estado)}</span></td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, fontSize: 13 }}>${s.montoActual?.toLocaleString('es-AR')}</td>
                        <td style={{ padding: '10px 12px', color: '#666', fontSize: 12 }}>{new Date(s.fechaCierre).toLocaleDateString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'usuarios' && (
            <div className="card" style={{ padding: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    {['Usuario', 'Email', 'Roles', 'Estado', 'Acciones'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#888', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{u.nombre?.[0]}</div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{u.nombre}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#666', fontSize: 13 }}>{u.email}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {u.roles?.map(r => (
                            <span key={r.id} className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {r.nombre}
                              <button onClick={async () => {
                                try {
                                  await client.delete(`/admin/usuarios/${u.id}/rol?rol=${r.nombre}`)
                                  toast.success('Rol removido')
                                  cargar()
                                } catch { toast.error('Error') }
                              }} style={{ background: 'none', border: 'none', color: '#2A398D', cursor: 'pointer', padding: 0, fontSize: 14, fontWeight: 700, lineHeight: 1 }}>×</button>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className={`badge ${u.bloqueado ? 'badge-red' : 'badge-green'}`}>{u.bloqueado ? 'Bloqueado' : 'Activo'}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <select onChange={e => { asignarRol(u.id, e.target.value); e.target.value = '' }} defaultValue=""
                            style={{ border: '1px solid #eee', borderRadius: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>
                            <option value="">+ Rol</option>
                            <option value="SELLER">SELLER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          <button onClick={() => bloquear(u.id, u.bloqueado)}
                            style={{ border: `1px solid ${u.bloqueado ? '#16a34a' : '#dc2626'}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600, color: u.bloqueado ? '#16a34a' : '#dc2626', background: 'none' }}>
                            {u.bloqueado ? 'Desbloquear' : 'Bloquear'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'categorias' && (
            <div className="card" style={{ padding: 20 }}>
              <form onSubmit={crearCategoria} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input className="input" type="text" placeholder="Nueva categoría" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} required style={{ maxWidth: 360 }} />
                <button className="btn btn-primary" type="submit" style={{ borderRadius: 8, flexShrink: 0 }}>Agregar</button>
              </form>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {categorias.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', border: '1px solid #eee', borderRadius: 8 }}>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{c.nombre}</span>
                    <button onClick={() => client.delete(`/categorias/${c.id}`).then(() => { toast.success('Eliminada'); cargar() })}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'disputas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {disputas.length === 0
                ? <div className="card" style={{ padding: 48, textAlign: 'center', color: '#888' }}>No hay disputas</div>
                : disputas.map(d => (
                  <div key={d.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                          Subasta #{d.subasta?.id} — {d.subasta?.producto?.titulo}
                        </p>
                        <p style={{ fontSize: 13, color: '#666' }}>Iniciada por: {d.iniciador?.nombre}</p>
                        <p style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Motivo: {d.motivo}</p>
                        {d.descripcion && <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{d.descripcion}</p>}
                      </div>
                      <span className={d.resolucionAdmin ? 'badge badge-green' : 'badge badge-orange'}>
                        {d.resolucionAdmin ? 'Resuelta' : 'Pendiente'}
                      </span>
                    </div>
                    {d.resolucionAdmin && (
                      <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 10, marginTop: 8 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Resolución: {d.resolucionAdmin}</p>
                      </div>
                    )}
                    {!d.resolucionAdmin && (
                      <button onClick={() => { setResolviendo(d); setResolucionForm({ resolucion: '', estadoFinal: 'ADJUDICADA' }) }}
                        className="btn btn-primary" style={{ borderRadius: 6, padding: '7px 16px', fontSize: 13, marginTop: 10 }}>
                        Resolver disputa
                      </button>
                    )}
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {resolviendo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: 28, width: '100%', maxWidth: 460, position: 'relative' }}>
            <button onClick={() => setResolviendo(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Resolver disputa</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
              Subasta #{resolviendo.subasta?.id} — {resolviendo.subasta?.producto?.titulo}
            </p>
            <div className="field">
              <label className="label">Resolución</label>
              <textarea className="input" value={resolucionForm.resolucion}
                onChange={e => setResolucionForm({ ...resolucionForm, resolucion: e.target.value })}
                rows={3} placeholder="Describí la resolución..." style={{ resize: 'vertical' }} />
            </div>
            <div className="field">
              <label className="label">Estado final de la subasta</label>
              <select className="input" value={resolucionForm.estadoFinal}
                onChange={e => setResolucionForm({ ...resolucionForm, estadoFinal: e.target.value })}>
                <option value="ADJUDICADA">Adjudicada (mantener ganador)</option>
                <option value="FINALIZADA">Finalizada (sin ganador)</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setResolviendo(null)} className="btn btn-secondary" style={{ flex: 1, borderRadius: 8 }}>Cancelar</button>
              <button onClick={resolverDisputa} className="btn btn-primary" style={{ flex: 1, borderRadius: 8 }}
                disabled={!resolucionForm.resolucion.trim()}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
