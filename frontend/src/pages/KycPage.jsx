import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { kycApi, authApi } from '../services/api.js'

// Razones de rechazo que puede elegir el admin (se muestran al usuario si fue rechazado)
export const REJECT_LABELS = {
  UNDERAGE_PERSON:    'Menor de edad',
  SANCTIONS:          'Persona en lista de sanciones',
  FRAUD:              'Patrones fraudulentos detectados',
  DATA_MISMATCH:      'Los datos no coinciden con el documento',
  DOCUMENT_EXPIRED:   'Documento vencido',
  DOCUMENT_UNREADABLE:'Documento ilegible o de mala calidad',
}

function FileInput({ label, icon, file, onChange, id }) {
  return (
    <div style={fi.wrapper}>
      <input id={id} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => onChange(e.target.files[0])} />
      <label htmlFor={id} style={fi.label}>
        <div style={fi.icon}>{file ? '✅' : icon}</div>
        <div style={fi.text}>
          <div style={{ fontWeight: 600, marginBottom: '.2rem' }}>{label}</div>
          {file
            ? <span style={{ color: 'var(--primary)', fontSize: '.8rem' }}>{file.name}</span>
            : <span style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>Clic para seleccionar imagen</span>
          }
        </div>
        {file && (
          <img src={URL.createObjectURL(file)}
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, marginLeft: 'auto' }}
            alt="preview" />
        )}
      </label>
    </div>
  )
}

const fi = {
  wrapper: { marginBottom: '.75rem' },
  label: { display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface2)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1rem', cursor: 'pointer', transition: 'border-color .2s' },
  icon: { fontSize: '1.75rem', flexShrink: 0 },
  text: { flex: 1 },
}

export default function KycPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [docFrente, setDocFrente] = useState(null)
  const [docDorso,  setDocDorso]  = useState(null)
  const [selfie,    setSelfie]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  const allUploaded = docFrente && docDorso && selfie

  const handleSubmit = async () => {
    if (!allUploaded) return
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('docFrente', docFrente)
      fd.append('docDorso',  docDorso)
      fd.append('selfie',    selfie)

      const { data } = await kycApi.submitDocuments(user.id, fd)
      updateUser(data.user)
      setSuccess(true)

      // Redirigir al dashboard después de 2s
      setTimeout(() => navigate('/dashboard'), 2500)
    } catch (e) {
      setError(e.response?.data || 'Error al subir documentos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <button onClick={() => navigate('/dashboard')} style={s.back}>← Volver</button>
          <div>
            <h1 style={s.title}>Verificación de identidad</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Paso 3 de 3 · KYC</p>
          </div>
        </div>

        {/* Progreso */}
        <div style={s.progress}>
          {['Perfil', 'Datos', 'KYC'].map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <div style={{ ...s.dot, background: i === 2 ? 'var(--primary)' : 'var(--surface2)', border: i < 2 ? '2px solid var(--primary)' : 'none' }}>
                {i < 2 ? '✓' : '3'}
              </div>
              <span style={{ fontSize: '.85rem', color: i === 2 ? 'var(--primary)' : 'var(--text-muted)' }}>{step}</span>
              {i < 2 && <div style={s.line} />}
            </div>
          ))}
        </div>

        {success ? (
          <div style={s.successBox}>
            <div style={{ fontSize: '3rem' }}>📬</div>
            <h2 style={{ marginTop: '1rem' }}>¡Documentos enviados!</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '.5rem' }}>
              Tu verificación está en proceso. Un revisor analizará tus documentos y recibirás el resultado pronto.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginTop: '1rem' }}>Redirigiendo al dashboard...</p>
          </div>
        ) : (
          <div style={s.card}>
            <h2 style={s.sectionTitle}>🪪 Subí tu documentación</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', marginBottom: '1.5rem' }}>
              Necesitamos verificar tu identidad. Por favor subí fotos claras y legibles de los siguientes documentos.
            </p>

            <FileInput id="frente" label="DNI — Frente" icon="🪪" file={docFrente} onChange={setDocFrente} />
            <FileInput id="dorso"  label="DNI — Dorso"  icon="🪪" file={docDorso}  onChange={setDocDorso} />
            <FileInput id="selfie" label="Selfie con DNI en mano" icon="🤳" file={selfie} onChange={setSelfie} />

            <div style={s.tips}>
              <p style={{ fontWeight: 600, marginBottom: '.5rem' }}>💡 Consejos para una verificación exitosa</p>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '.875rem', lineHeight: '1.7' }}>
                <li>Usá buena iluminación, sin flash directo</li>
                <li>El documento debe estar completo y legible</li>
                <li>La selfie debe mostrar tu cara y el DNI claramente</li>
                <li>Formatos aceptados: JPG, PNG</li>
              </ul>
            </div>

            {error && <p className="error-msg" style={{ marginBottom: '1rem' }}>{error}</p>}

            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!allUploaded || loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Subiendo documentos...' : allUploaded ? 'Enviar para verificación →' : 'Completá los 3 documentos para continuar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', padding: '2rem 1rem' },
  container: { maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem' },
  back: { background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '1rem', fontFamily: 'var(--font)', padding: '.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700 },
  progress: { display: 'flex', alignItems: 'center', gap: '.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem 1.5rem' },
  dot: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', fontWeight: 700, color: '#fff' },
  line: { width: 24, height: 2, background: 'var(--primary)', borderRadius: 2 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.75rem' },
  sectionTitle: { fontWeight: 700, fontSize: '1.1rem', marginBottom: '.5rem' },
  tips: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', margin: '1.25rem 0' },
  successBox: { background: 'var(--surface)', border: '1px solid rgba(0,200,150,.4)', borderRadius: 'var(--radius)', padding: '3rem 2rem', textAlign: 'center' },
}
