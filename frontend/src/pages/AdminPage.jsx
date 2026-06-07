import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { adminApi } from '../services/api.js'
import { REJECT_LABELS } from './KycPage.jsx'

const STATUS_TABS = [
  { value: 'PENDING',   label: 'Pendientes',  color: 'var(--warning)' },
  { value: 'IN_REVIEW', label: 'En revisión', color: '#a78bfa' },
  { value: 'APPROVED',  label: 'Aprobados',   color: 'var(--primary)' },
  { value: 'DECLINED',  label: 'Rechazados',  color: 'var(--danger)' },
  { value: '',          label: 'Todos',        color: 'var(--text-muted)' },
]

function DocViewer({ userId, hasFrente, hasDorso, hasSelfie }) {
  const [viewing, setViewing] = useState(null)
  const docs = [
    { key: 'frente', label: 'DNI Frente', has: hasFrente },
    { key: 'dorso',  label: 'DNI Dorso',  has: hasDorso },
    { key: 'selfie', label: 'Selfie',     has: hasSelfie },
  ]
  return (
    <div>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem', flexWrap: 'wrap' }}>
        {docs.map(d => (
          <button key={d.key}
            className="btn btn-outline"
            disabled={!d.has}
            onClick={() => setViewing(viewing === d.key ? null : d.key)}
            style={{ fontSize: '.8rem', padding: '.4rem .85rem', opacity: d.has ? 1 : .4 }}>
            {viewing === d.key ? '▲' : '▼'} {d.label}
          </button>
        ))}
      </div>
      {viewing && (
        <div style={{ marginBottom: '1rem' }}>
          <img
            src={adminApi.documentUrl(userId, viewing)}
            alt={viewing}
            style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, border: '1px solid var(--border)', objectFit: 'contain', background: '#000' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>
      )}
    </div>
  )
}

function UserCard({ user, onDecision }) {
  const [expanded, setExpanded] = useState(false)
  const [decision,   setDecision]   = useState('APPROVED')
  const [rejectReason, setRejectReason] = useState('DATA_MISMATCH')
  const [comment,    setComment]    = useState('')
  const [loading,    setLoading]    = useState(false)
  const [msg,        setMsg]        = useState('')

  const statusColor = {
    PENDING:   'var(--warning)',
    IN_REVIEW: '#a78bfa',
    APPROVED:  'var(--primary)',
    DECLINED:  'var(--danger)',
    NOT_STARTED: 'var(--text-muted)',
  }[user.kycStatus] || 'var(--text-muted)'

  const handleDecide = async () => {
    setLoading(true)
    setMsg('')
    try {
      await adminApi.decide(user.id, decision,
        decision === 'DECLINED' ? rejectReason : '',
        comment)
      setMsg('✅ Decisión aplicada correctamente')
      onDecision()
    } catch (e) {
      setMsg('❌ Error: ' + (e.response?.data || e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={uc.card}>
      {/* Header del card */}
      <div style={uc.header} onClick={() => setExpanded(!expanded)}>
        <div style={uc.avatar}>{user.nombre[0]}{user.apellido[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{user.nombre} {user.apellido}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>
            {user.email} · DNI: {user.dni || '—'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span style={{ ...uc.badge, color: statusColor, borderColor: statusColor + '44' }}>
            {user.kycStatus}
          </span>
          {user.kycSubmittedAt && (
            <span style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>
              {new Date(user.kycSubmittedAt).toLocaleDateString('es-AR')}
            </span>
          )}
          <span style={{ color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div style={uc.body}>
          {/* Documentos */}
          {(user.hasDocFrente || user.hasDocDorso || user.hasSelfie) ? (
            <>
              <p style={uc.sectionLabel}>📎 Documentos subidos</p>
              <DocViewer
                userId={user.id}
                hasFrente={user.hasDocFrente}
                hasDorso={user.hasDocDorso}
                hasSelfie={user.hasSelfie}
              />
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '.875rem', marginBottom: '1rem' }}>
              ⚠️ El usuario no subió documentos todavía.
            </p>
          )}

          {/* Info de rechazo previo */}
          {user.kycStatus === 'DECLINED' && user.kycRejectReason && (
            <div style={uc.rejectInfo}>
              <strong>Razón de rechazo anterior:</strong> {REJECT_LABELS[user.kycRejectReason] || user.kycRejectReason}
              {user.kycAdminComment && <div style={{ marginTop: '.25rem' }}>Comentario: {user.kycAdminComment}</div>}
            </div>
          )}

          {/* Panel de decisión */}
          {user.kycStatus !== 'APPROVED' && (
            <>
              <p style={uc.sectionLabel}>⚖️ Tomar decisión</p>

              <div style={uc.decisionRow}>
                {[
                  { value: 'APPROVED',  label: '✅ Aprobar',      cls: 'btn-primary' },
                  { value: 'IN_REVIEW', label: '🔍 En revisión',  cls: 'btn-outline' },
                  { value: 'DECLINED',  label: '❌ Rechazar',     cls: 'btn-danger'  },
                ].map(opt => (
                  <button key={opt.value}
                    className={`btn ${decision === opt.value ? opt.cls : 'btn-outline'}`}
                    onClick={() => setDecision(opt.value)}
                    style={{ flex: 1, fontSize: '.85rem' }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {decision === 'DECLINED' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label>Razón del rechazo</label>
                  <select className="input" value={rejectReason} onChange={e => setRejectReason(e.target.value)}>
                    {Object.entries(REJECT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label>Comentario para el usuario (opcional)</label>
                <input className="input" placeholder="Ej: Por favor resubí el DNI con mejor iluminación"
                  value={comment} onChange={e => setComment(e.target.value)} />
              </div>

              {msg && (
                <div style={{ ...uc.msg, background: msg.startsWith('✅') ? 'rgba(0,200,150,.1)' : 'rgba(224,82,82,.1)', color: msg.startsWith('✅') ? 'var(--primary)' : 'var(--danger)' }}>
                  {msg}
                </div>
              )}

              <button className={`btn ${decision === 'DECLINED' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleDecide} disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Aplicando...' : `Confirmar: ${decision}`}
              </button>
            </>
          )}

          {user.kycStatus === 'APPROVED' && (
            <div style={{ ...uc.msg, background: 'rgba(0,200,150,.1)', color: 'var(--primary)' }}>
              ✅ Este usuario ya fue aprobado el {user.kycVerifiedAt ? new Date(user.kycVerifiedAt).toLocaleDateString('es-AR') : '—'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const uc = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '1rem' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer', userSelect: 'none' },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.9rem', flexShrink: 0 },
  badge: { padding: '.2rem .65rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 700, border: '1px solid' },
  body: { padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--border)' },
  sectionLabel: { fontWeight: 600, fontSize: '.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', margin: '1rem 0 .75rem' },
  decisionRow: { display: 'flex', gap: '.5rem', marginBottom: '1rem' },
  rejectInfo: { background: 'rgba(224,82,82,.1)', border: '1px solid rgba(224,82,82,.3)', borderRadius: 8, padding: '.75rem', fontSize: '.875rem', color: 'var(--danger)', marginBottom: '1rem' },
  msg: { borderRadius: 8, padding: '.75rem', fontSize: '.875rem', marginBottom: '1rem' },
}

export default function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab,    setTab]    = useState('PENDING')
  const [users,  setUsers]  = useState([])
  const [loading, setLoading] = useState(true)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.listUsers(tab)
      setUsers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [tab])

  const pendingCount = users.filter(u => u.kycStatus === 'PENDING').length

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <div style={s.adminBadge}>👤 Admin</div>
            <div>
              <div style={{ fontWeight: 600 }}>Panel de revisión KYC</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-outline" onClick={logout} style={{ fontSize: '.85rem', padding: '.5rem 1rem' }}>
            Salir
          </button>
        </div>

        {/* Tabs de filtro */}
        <div style={s.tabs}>
          {STATUS_TABS.map(t => (
            <button key={t.value}
              className={`btn ${tab === t.value ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTab(t.value)}
              style={{ fontSize: '.85rem', padding: '.5rem 1rem', position: 'relative' }}>
              {t.label}
              {t.value === 'PENDING' && pendingCount > 0 && (
                <span style={s.badge}>{pendingCount}</span>
              )}
            </button>
          ))}
          <button className="btn btn-outline" onClick={loadUsers} style={{ marginLeft: 'auto', fontSize: '.85rem' }}>
            🔄 Actualizar
          </button>
        </div>

        {/* Lista de usuarios */}
        {loading ? (
          <div style={s.empty}>Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div style={s.empty}>No hay usuarios en este estado.</div>
        ) : (
          users.map(u => (
            <UserCard key={u.id} user={u} onDecision={loadUsers} />
          ))
        )}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', padding: '2rem 1rem' },
  container: { maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem 1.5rem' },
  adminBadge: { background: 'rgba(167,139,250,.2)', color: '#a78bfa', border: '1px solid rgba(167,139,250,.4)', padding: '.3rem .75rem', borderRadius: 6, fontSize: '.85rem', fontWeight: 700 },
  tabs: { display: 'flex', gap: '.5rem', flexWrap: 'wrap' },
  badge: { position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: '.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  empty: { textAlign: 'center', color: 'var(--text-muted)', padding: '3rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' },
}
