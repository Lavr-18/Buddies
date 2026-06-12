import { useEffect, useState } from 'react'
import { api } from '../api'
import { haptic } from '../tg'

export default function Responses({ request, onBack }) {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await api.getResponses(request.id)
      setResponses(data.responses || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(responseId) {
    haptic()
    try {
      await api.acceptResponse(responseId)
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleReject(responseId) {
    haptic('light')
    try {
      await api.rejectResponse(responseId)
      setResponses(prev => prev.filter(r => r.id !== responseId))
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="screen">
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} style={{ fontSize: 20, background: 'transparent', padding: 4 }}>←</button>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Отклики</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{request.activity_type} · {request.description?.slice(0, 40)}...</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Загружаем...</div>
      ) : responses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <p>Пока никто не откликнулся. Ждём!</p>
        </div>
      ) : (
        responses.map(resp => (
          <ResponseCard
            key={resp.id}
            response={resp}
            onAccept={() => handleAccept(resp.id)}
            onReject={() => handleReject(resp.id)}
          />
        ))
      )}
    </div>
  )
}

function ResponseCard({ response, onAccept, onReject }) {
  const user = response.user
  const isAccepted = response.status === 'accepted'
  const isRejected = response.status === 'rejected'
  const initials = user?.first_name?.[0]?.toUpperCase() || '?'

  return (
    <div className="card" style={{ opacity: isRejected ? 0.5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="avatar">{initials}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.first_name}, {user?.age}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {user?.gender === 'male' ? '👨' : '👩'} {user?.interests?.slice(0, 3).join(', ')}
          </div>
        </div>
        {isAccepted && (
          <span style={{ marginLeft: 'auto', background: '#E8F5E9', color: '#2E7D32', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            Принято ✓
          </span>
        )}
      </div>

      {!isAccepted && !isRejected && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={onAccept}
          >
            Принять
          </button>
          <button
            onClick={onReject}
            style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #e0e0e0', background: '#fff', fontSize: 15, color: 'var(--text-muted)' }}
          >
            Отклонить
          </button>
        </div>
      )}

      {isAccepted && user?.username && (
        <a
          href={`tg://resolve?domain=${user.username}`}
          style={{ display: 'block', textAlign: 'center', color: 'var(--primary)', fontWeight: 600, fontSize: 14, marginTop: 8 }}
        >
          Написать @{user.username}
        </a>
      )}
    </div>
  )
}
