import { useEffect, useState, useRef } from 'react'
import client from '../api/client'
import toast from 'react-hot-toast'
import { Upload, Trash2, Pencil, X, Check, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

export default function MisProductos() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState({ titulo: '', descripcion: '', categoriaId: '', imagenBase64: '' })
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [editando, setEditando] = useState(null) // id del producto en edición
  const [editForm, setEditForm] = useState({})
  const [editPreview, setEditPreview] = useState(null)
  const fileRef = useRef()
  const editFileRef = useRef()

  const cargar = () => {
    client.get('/productos').then(r => setProductos(r.data))
    client.get('/categorias').then(r => setCategorias(r.data))
  }

  useEffect(() => { cargar() }, [])

  const handleFile = async (file) => {
    if (!file) return
    const base64 = await toBase64(file)
    setPreview(base64)
    setForm(f => ({ ...f, imagenBase64: base64 }))
  }

  const handleEditFile = async (file) => {
    if (!file) return
    const base64 = await toBase64(file)
    setEditPreview(base64)
    setEditForm(f => ({ ...f, imagenBase64: base64 }))
  }

  const crear = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await client.post('/productos', { ...form, categoriaId: parseInt(form.categoriaId) })
      toast.success('Producto creado')
      setForm({ titulo: '', descripcion: '', categoriaId: '', imagenBase64: '' })
      setPreview(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const iniciarEdicion = (p) => {
    setEditando(p.id)
    setEditForm({ titulo: p.titulo, descripcion: p.descripcion || '', categoriaId: p.categoria?.id || '', imagenBase64: p.imagenBase64 || '' })
    setEditPreview(p.imagenBase64 || null)
  }

  const guardarEdicion = async (id) => {
    try {
      await client.put(`/productos/${id}`, { ...editForm, categoriaId: parseInt(editForm.categoriaId) })
      toast.success('Producto actualizado')
      setEditando(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error')
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await client.delete(`/productos/${id}`)
      toast.success('Eliminado')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error')
    }
  }

  return (
    <div className="page">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 13, marginBottom: 20 }}>
        <ArrowLeft size={15} /> Volver
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Mis Productos</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20 }}>

        {/* Formulario crear */}
        <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Agregar producto</h2>
          <form onSubmit={crear}>
            <div
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              style={{ border: `2px dashed ${dragOver ? '#7c3aed' : '#ddd'}`, borderRadius: 10, height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 16, background: dragOver ? '#f9f5ff' : '#fafafa', overflow: 'hidden', transition: 'all 0.2s' }}>
              {preview
                ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <>
                    <Upload size={28} color="#aaa" style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>Arrastrá y soltá o hacé clic<br />para seleccionar</p>
                    <p style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>JPG, PNG hasta 5MB</p>
                  </>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />

            <div className="field">
              <label className="label">Título</label>
              <input className="input" type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Camiseta Argentina 2026" required />
            </div>
            <div className="field">
              <label className="label">Descripción</label>
              <textarea className="input" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3} style={{ resize: 'vertical' }} placeholder="Estado, talle, material, marca..." />
            </div>
            <div className="field">
              <label className="label">Categoría</label>
              <select className="input" value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: e.target.value })} required>
                <option value="">Seleccionar...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ borderRadius: 8 }}>
              {loading ? 'Creando...' : 'Crear producto'}
            </button>
          </form>
        </div>

        {/* Lista productos */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Mis productos ({productos.length})</h2>
          {productos.length === 0
            ? <div className="card" style={{ padding: 48, textAlign: 'center', color: '#888' }}>
                <p style={{ marginBottom: 8 }}>Todavía no tenés productos</p>
                <p style={{ fontSize: 13 }}>Agregá uno para poder crear subastas</p>
              </div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {productos.map(p => (
                  <div key={p.id} className="card" style={{ padding: 16 }}>
                    {editando === p.id ? (
                      // Modo edición
                      <div style={{ display: 'flex', gap: 14 }}>
                        <div
                          onClick={() => editFileRef.current.click()}
                          style={{ width: 100, height: 100, background: '#f5f5f5', borderRadius: 8, flexShrink: 0, overflow: 'hidden', cursor: 'pointer', border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {editPreview
                            ? <img src={editPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Upload size={20} color="#aaa" />
                          }
                        </div>
                        <input ref={editFileRef} type="file" accept="image/*" onChange={e => handleEditFile(e.target.files[0])} style={{ display: 'none' }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input className="input" value={editForm.titulo} onChange={e => setEditForm({ ...editForm, titulo: e.target.value })} placeholder="Título" />
                          <textarea className="input" value={editForm.descripcion} onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })} rows={2} style={{ resize: 'none' }} placeholder="Descripción" />
                          <select className="input" value={editForm.categoriaId} onChange={e => setEditForm({ ...editForm, categoriaId: e.target.value })}>
                            <option value="">Seleccionar categoría...</option>
                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                          </select>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => guardarEdicion(p.id)} className="btn btn-primary" style={{ borderRadius: 6, padding: '7px 16px', fontSize: 13 }}>
                              <Check size={14} /> Guardar
                            </button>
                            <button onClick={() => setEditando(null)} className="btn btn-danger" style={{ borderRadius: 6, padding: '7px 16px', fontSize: 13 }}>
                              <X size={14} /> Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Modo vista
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{ width: 72, height: 72, background: '#f5f5f5', borderRadius: 8, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.imagenBase64
                            ? <img src={p.imagenBase64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ color: '#ccc', fontSize: 10 }}>Sin img</span>
                          }
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.titulo}</p>
                          <span className="badge badge-purple">{p.categoria?.nombre}</span>
                          {p.descripcion && <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{p.descripcion}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button onClick={() => iniciarEdicion(p)} className="btn btn-secondary" style={{ borderRadius: 6, padding: '7px 12px', fontSize: 13 }}>
                            <Pencil size={13} /> Editar
                          </button>
                          <button onClick={() => eliminar(p.id)} className="btn btn-danger" style={{ borderRadius: 6, padding: '7px 12px', fontSize: 13 }}>
                            <Trash2 size={13} /> Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  )
}
