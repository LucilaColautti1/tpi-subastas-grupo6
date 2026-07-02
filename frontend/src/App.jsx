import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import SubastaDetalle from './pages/SubastaDetalle'
import MisProductos from './pages/MisProductos'
import CrearSubasta from './pages/CrearSubasta'
import MisPujas from './pages/MisPujas'
import MisSubastas from './pages/MisSubastas'
import MisDisputas from './pages/MisDisputas'
import AdminPanel from './pages/AdminPanel'
import Busqueda from './pages/Busqueda'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" />
  if (!user?.roles?.includes('ADMIN')) return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/busqueda" element={<Busqueda />} />
        <Route path="/subastas/:id" element={<PrivateRoute><SubastaDetalle /></PrivateRoute>} />
        <Route path="/mis-productos" element={<PrivateRoute><MisProductos /></PrivateRoute>} />
        <Route path="/mis-subastas" element={<PrivateRoute><MisSubastas /></PrivateRoute>} />
        <Route path="/crear-subasta" element={<PrivateRoute><CrearSubasta /></PrivateRoute>} />
        <Route path="/mis-pujas" element={<PrivateRoute><MisPujas /></PrivateRoute>} />
        <Route path="/mis-disputas" element={<PrivateRoute><MisDisputas /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      </Routes>
    </div>
  )
}
