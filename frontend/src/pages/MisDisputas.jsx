import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import toast from 'react-hot-toast'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

export default function MisDisputas() {
  const [disputas, setDisputas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/disputas/mis-disputas').then(r => setDisputas(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 13, marginBottom: 20 }}>
        <ArrowLeft size={15} /> Volver
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Mis Disputas</h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Cargando...</div>
      ) : disputas.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: '#888' }}>
          <AlertTriangle size={40} color="#ddd" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 16, marginBottom: 8 }}>No tenés disputas abiertas</p>
          <p style={{ fontSize: 13 }}>Podés abrir una disputa desde el detalle de una subasta adjudicada</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {disputas.map(d => (
            <div key={d.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    Subasta #{d.subasta?.id} — {d.subasta?.producto?.titulo}
                  </p>
                  <p style={{ fontSize: 13, color: '#666' }}>Motivo: {d.motivo}</p>
                  {d.descripcion && <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{d.descripcion}</p>}
                </div>
                <span className={`badge ${d.resolucionAdmin ? 'badge-green' : 'badge-orange'}`}>
                  {d.resolucionAdmin ? 'Resuelta' : 'En revisión'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#888', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                <span>Abierta: {new Date(d.fechaCreacion).toLocaleDateString('es-AR')}</span>
                {d.fechaResolucion && <span>Resuelta: {new Date(d.fechaResolucion).toLocaleDateString('es-AR')}</span>}
              </div>
              {d.resolucionAdmin && (
                <div style={{ marginTop: 12, background: '#f0fdf4', borderRadius: 8, padding: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>Resolución del administrador:</p>
                  <p style={{ fontSize: 13, color: '#555' }}>{d.resolucionAdmin}</p>
                </div>
              )}
              <Link to={`/subastas/${d.subasta?.id}`} style={{ display: 'inline-block', marginTop: 12, color: '#2A398D', fontSize: 13, fontWeight: 600 }}>
                Ver subasta →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
