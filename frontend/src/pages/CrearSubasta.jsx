import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import client from '../api/client'
import toast from 'react-hot-toast'
import { Upload, ArrowLeft } from 'lucide-react'

export default function CrearSubasta() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [form, setForm] = useState({ productoId: '', precioBase: '', incrementoMinimo: '', fechaInicio: '', fechaCierre: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { client.get('/productos').then(r => setProductos(r.data)) }, [])

  const crear = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await client.post('/subastas/seller', {
        ...form,
        productoId: parseInt(form.productoId),
        precioBase: parseFloat(form.precioBase),
        incrementoMinimo: parseFloat(form.incrementoMinimo),
        fechaInicio: new Date(form.fechaInicio).toISOString().slice(0, 19),
        fechaCierre: new Date(form.fechaCierre).toISOString().slice(0, 19),
      })
      await client.post(`/subastas/seller/${res.data.id}/publicar`)
      toast.success('Subasta creada y publicada')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear subasta')
    } finally {
      setLoading(false)
    }
  }

  const guardarBorrador = async () => {
    if (!form.productoId || !form.precioBase || !form.incrementoMinimo || !form.fechaInicio || !form.fechaCierre) {
      toast.error('Completá todos los campos')
      return
    }
    setLoading(true)
    try {
      await client.post('/subastas/seller', {
        ...form,
        productoId: parseInt(form.productoId),
        precioBase: parseFloat(form.precioBase),
        incrementoMinimo: parseFloat(form.incrementoMinimo),
        fechaInicio: new Date(form.fechaInicio).toISOString().slice(0, 19),
        fechaCierre: new Date(form.fechaCierre).toISOString().slice(0, 19),
      })
      toast.success('Borrador guardado')
      navigate('/mis-subastas')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar borrador')
    } finally {
      setLoading(false)
    }
  }

  const productoSeleccionado = productos.find(p => p.id === parseInt(form.productoId))

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 13, marginBottom: 20 }}>
        <ArrowLeft size={15} /> Volver
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Crear subasta</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Datos de la subasta</h2>
          <form onSubmit={crear}>
            <div className="field">
              <label className="label">Producto</label>
              <select className="input" value={form.productoId} onChange={e => setForm({ ...form, productoId: e.target.value })} required>
                <option value="">Seleccionar producto...</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
              </select>
              {productos.length === 0 && (
                <p style={{ fontSize: 12, color: '#2A398D', marginTop: 4 }}>
                  <Link to="/mis-productos" style={{ color: '#2A398D' }}>+ Primero creá un producto</Link>
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label className="label">Precio base ($)</label>
                <input className="input" type="number" step="0.01" min="0.01" value={form.precioBase} onChange={e => setForm({ ...form, precioBase: e.target.value })} required placeholder="0.00" />
              </div>
              <div className="field">
                <label className="label">Incremento mínimo ($)</label>
                <input className="input" type="number" step="0.01" min="0.01" value={form.incrementoMinimo} onChange={e => setForm({ ...form, incrementoMinimo: e.target.value })} required placeholder="500" />
              </div>
            </div>

            <div className="field">
              <label className="label">Fecha de inicio</label>
              <input className="input" type="datetime-local" value={form.fechaInicio} onChange={e => setForm({ ...form, fechaInicio: e.target.value })} required />
            </div>
            <div className="field">
              <label className="label">Fecha de cierre</label>
              <input className="input" type="datetime-local" value={form.fechaCierre} onChange={e => setForm({ ...form, fechaCierre: e.target.value })} required />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={guardarBorrador} disabled={loading} className="btn btn-outline btn-block" style={{ borderRadius: 8 }}>
                Guardar borrador
              </button>
              <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ borderRadius: 8 }}>
                {loading ? 'Publicando...' : 'Publicar subasta'}
              </button>
            </div>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Vista previa</h2>
            {productoSeleccionado ? (
              <div>
                <div style={{ height: 200, background: '#f5f5f5', borderRadius: 10, marginBottom: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {productoSeleccionado.imagenBase64
                    ? <img src={productoSeleccionado.imagenBase64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#ccc', fontSize: 13 }}>Sin imagen</span>
                  }
                </div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{productoSeleccionado.titulo}</p>
                <p style={{ fontSize: 12, color: '#2A398D', marginTop: 4 }}>{productoSeleccionado.categoria?.nombre}</p>
                <p style={{ fontSize: 13, color: '#555', marginTop: 6 }}>{productoSeleccionado.descripcion}</p>
                {form.precioBase && (
                  <div style={{ marginTop: 12, padding: 12, background: '#e8eaf6', borderRadius: 8 }}>
                    <p style={{ fontSize: 12, color: '#888' }}>Precio base</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#2A398D' }}>${parseFloat(form.precioBase || 0).toLocaleString('es-AR')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ height: 200, background: '#f5f5f5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                <p style={{ fontSize: 13 }}>Seleccioná un producto para ver la vista previa</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
