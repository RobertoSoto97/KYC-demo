import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { authApi } from '../services/api.js'
import { REJECT_LABELS } from './KycPage.jsx'

const STATUS_CONFIG = {
  NOT_STARTED: {
    icon: '○', label: 'Sin verificar', color: 'var(--text-muted)', bg: 'rgba(136,146,164,.1)',
    desc: 'Todavía no iniciaste el proceso. Necesitamos verificar tu identidad para habilitarte.',
    action: 'Iniciar verificación →',
  },
  PENDING: {
    icon: '📬', label: 'En revisión', color: 'var(--warning)', bg: 'rgba(240,160,48,.1)',
    desc: 'Recibimos tus documentos. Un revisor los analizará en breve. Te notificaremos el resultado.',
    action: null,
  },
  IN_REVIEW: {
    icon: '🔍', label: 'Siendo revisado', color: '#a78bfa', bg: 'rgba(167,139,250,.1)',
    desc: 'Tu verificación está siendo revisada activamente. Ya casi estás.',
    action: null,
  },
  APPROVED: {
    icon: '✅', label: 'Verificado', color: 'var(--primary)', bg: 'rgba(0,200,150,.1)',
    desc: 'Tu identidad fue verificada exitosamente. Tenés acceso completo a la plataforma.',
    action: null,
  },
  DECLINED: {
    icon: '❌', label: 'Rechazado', color: 'var(--danger)', bg: 'rgba(224,82,82,.1)',
    desc: 'Tu verificación fue rechazada.',
    action: 'Reintentar verificación →',
  },
}

export default function DashboardPage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(user)
  const [polling, setPolling] = useState(false)

  // Polling liviano: refresca cada 6s mientras el estado es transitorio
  // Así el usuario ve el cambio cuando el admin toma una decisión, sin recargar la página
  useEffect(() => {
    if (['PENDING', 'IN_REVIEW'].includes(currentUser.kycStatus)) {
      setPolling(true)
      const id = setInterval(async () => {
        try {
          const { data } = await authApi.getUser(currentUser.id)
          if (data.kycStatus !== currentUser.kycStatus) {
            setCurrentUser(data)
            updateUser(data)
          }
          if (['APPROVED', 'DECLINED'].includes(data.kycStatus)) {
            clearInterval(id)
            setPolling(false)
          }
        } catch {}
      }, 6000)
      return () => clearInterval(id)
    }
  }, [currentUser.kycStatus])

  const cfg = STATUS_CONFIG[currentUser.kycStatus] || STATUS_CONFIG.NOT_STARTED

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Top bar */}
        <div style={s.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <div style={s.avatar}>{currentUser.nombre[0]}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{currentUser.nombre} {currentUser.apellido}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>{currentUser.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            {currentUser.admin && (
              <button className="btn btn-outline"
                onClick={() => navigate('/admin')}
                style={{ fontSize: '.85rem', padding: '.5rem 1rem', color: '#a78bfa', borderColor: '#a78bfa44' }}>
                Panel Admin
              </button>
            )}
            <button className="btn btn-outline" onClick={logout}
              style={{ fontSize: '.85rem', padding: '.5rem 1rem' }}>
              Salir
            </button>
          </div>
        </div>

        {/* Estado KYC */}
        <div style={{ ...s.kycCard, background: cfg.bg, borderColor: cfg.color + '44' }}>
          <div style={s.kycHeader}>
            <span style={{ fontSize: '1.6rem' }}>{cfg.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Estado de tu verificación KYC</div>
              <span style={{ ...s.badge, color: cfg.color, borderColor: cfg.color + '55' }}>
                {cfg.label}
              </span>
              {polling && <span style={s.pulse}> · actualizando...</span>}
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', marginTop: '.75rem', fontSize: '.9rem' }}>
            {cfg.desc}
          </p>

          {/* Razón de rechazo */}
          {currentUser.kycStatus === 'DECLINED' && currentUser.kycRejectReason && (
            <div style={s.rejectBox}>
              <div><strong>Razón:</strong> {REJECT_LABELS[currentUser.kycRejectReason] || currentUser.kycRejectReason}</div>
              {currentUser.kycAdminComment && (
                <div style={{ marginTop: '.35rem' }}><strong>Comentario del revisor:</strong> {currentUser.kycAdminComment}</div>
              )}
            </div>
          )}

          {cfg.action && (
            <button className="btn btn-primary" onClick={() => navigate('/kyc')} style={{ marginTop: '1.25rem' }}>
              {cfg.action}
            </button>
          )}
        </div>

        {/* Features grid */}
        <div style={s.grid}>
          {[
            { icon: '📊', title: 'Proyectos disponibles', desc: 'Explorá proyectos de energía renovable tokenizados', locked: currentUser.kycStatus !== 'APPROVED' },
            { icon: '💎', title: 'Invertir tokens LKN',   desc: 'Comprá participaciones en proyectos verificados',   locked: currentUser.kycStatus !== 'APPROVED' },
            { icon: '💰', title: 'Mis dividendos',        desc: 'Revisá y reclamá tus rendimientos acumulados',      locked: currentUser.kycStatus !== 'APPROVED' },
            { icon: '👤', title: 'Mi perfil',             desc: 'Datos personales y configuración de seguridad',     locked: false },
          ].map(item => (
            <div key={item.title} style={{ ...s.featureCard, opacity: item.locked ? .5 : 1 }}>
              <span style={{ fontSize: '1.75rem' }}>{item.icon}</span>
              <div style={{ fontWeight: 600, marginTop: '.5rem' }}>{item.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginTop: '.25rem' }}>{item.desc}</div>
              {item.locked && <div style={s.lockTag}>🔒 Requiere KYC aprobado</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', padding: '2rem 1rem' },
  container: { maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem 1.5rem' },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' },
  kycCard: { border: '1px solid', borderRadius: 'var(--radius)', padding: '1.5rem' },
  kycHeader: { display: 'flex', alignItems: 'center', gap: '1rem' },
  badge: { display: 'inline-block', padding: '.2rem .75rem', borderRadius: 999, fontSize: '.8rem', fontWeight: 700, border: '1px solid', marginTop: '.35rem' },
  pulse: { color: 'var(--warning)', fontSize: '.8rem' },
  rejectBox: { marginTop: '1rem', padding: '.75rem', background: 'rgba(224,82,82,.1)', border: '1px solid rgba(224,82,82,.3)', borderRadius: 8, fontSize: '.875rem', color: 'var(--danger)', lineHeight: 1.6 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  featureCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' },
  lockTag: { marginTop: '.75rem', fontSize: '.8rem', color: 'var(--text-muted)' },
}
