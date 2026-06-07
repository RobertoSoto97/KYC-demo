import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../services/api.js'
import { useAuth } from '../App.jsx'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '',
    dni: '', telefono: '', fechaNacimiento: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.register(form)
      login(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logo}>⚡</div>
          <h1 style={styles.title}>Crear cuenta</h1>
          <p style={styles.subtitle}>Completá tus datos para comenzar</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <p style={styles.section}>Identidad</p>
          <div style={styles.row}>
            <div style={styles.field}>
              <label>Nombre</label>
              <input className="input" placeholder="Juan" value={form.nombre} onChange={set('nombre')} required />
            </div>
            <div style={styles.field}>
              <label>Apellido</label>
              <input className="input" placeholder="García" value={form.apellido} onChange={set('apellido')} required />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label>Email</label>
              <input className="input" type="email" placeholder="tu@email.com" value={form.email} onChange={set('email')} required />
            </div>
            <div style={styles.field}>
              <label>DNI</label>
              <input className="input" placeholder="12.345.678" value={form.dni} onChange={set('dni')} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label>Fecha de nacimiento</label>
              <input className="input" type="date" value={form.fechaNacimiento} onChange={set('fechaNacimiento')} />
            </div>
            <div style={styles.field}>
              <label>Teléfono</label>
              <input className="input" placeholder="+54 11 1234-5678" value={form.telefono} onChange={set('telefono')} />
            </div>
          </div>

          <p style={styles.section}>Seguridad</p>
          <div style={styles.field}>
            <label>Contraseña</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '.5rem' }}>
            {loading ? 'Registrando...' : 'Crear cuenta →'}
          </button>
        </form>

        <p style={styles.footer}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="link">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' },
  container: { width: '100%', maxWidth: '560px' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  logo: { fontSize: '2.5rem', marginBottom: '.5rem' },
  title: { fontSize: '1.75rem', fontWeight: 700 },
  subtitle: { color: 'var(--text-muted)', fontSize: '.95rem', marginTop: '.25rem' },
  form: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  section: { fontWeight: 600, color: 'var(--primary)', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--border)', paddingBottom: '.5rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '.35rem' },
  footer: { textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '.9rem' },
}
