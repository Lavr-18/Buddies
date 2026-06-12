import { useState } from 'react'
import { api } from '../api'
import { haptic } from '../tg'

const ACTIVITY_EMOJI = {
  coffee: '☕', dinner: '🍕', sport: '🏃', cinema: '🎬',
  board: '🎲', walk: '🌳', photo: '📸', other: '🎤',
}

const GOAL_BADGE = {
  romance: { label: '💕 Романтика', cls: 'badge-romance' },
  friendship: { label: '🤝 Дружба', cls: 'badge-friendship' },
  company: { label: '🎉 Компания', cls: 'badge-company' },
}

function Avatar({ user }) {
  const initials = user?.first_name?.[0]?.toUpperCase() || '?'
  return (
    <div className="avatar">
      {user?.photo_url
        ? <img src={user.photo_url} alt="" />
        : initials}
    </div>
  )
}

function timeLabel(req) {
  if (req.time_type === 'now') return '⏰ Прямо сейчас'
  if (req.time_type === 'today_evening') return '⏰ Сегодня вечером'
  if (req.scheduled_at) {
    const d = new Date(req.scheduled_at)
    return `⏰ ${d.toLocaleDateString('ru', { day: 'numeric', month: 'short' })} в ${d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}`
  }
  return ''
}

export default function RequestCard({ request, currentUserId, onRespond, onOpenResponses }) {
  const [responded, setResponded] = useState(false)
  const [loading, setLoading] = useState(false)
  const isOwn = request.user?.id === currentUserId || request.user_id === currentUserId

  const desc = request.description?.length > 120
    ? request.description.slice(0, 120) + '...'
    : request.description

  async function handleRespond() {
    if (responded || loading) return
    haptic()
    setLoading(true)
    try {
      await api.respond(request.id)
      setResponded(true)
      onRespond?.()
    } catch (e) {
      if (e.message?.includes('Already')) setResponded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Avatar user={request.user} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {request.user?.first_name || 'Пользователь'}
            {request.user?.age ? `, ${request.user.age}` : ''}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {ACTIVITY_EMOJI[request.activity_type] || '🎯'} {request.activity_type}
          </div>
        </div>
        {isOwn && (
          <span style={{ marginLeft: 'auto', background: '#eee', borderRadius: 8, padding: '2px 8px', fontSize: 12, color: 'var(--text-muted)' }}>
            Моя
          </span>
        )}
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 10, color: 'var(--text)' }}>{desc}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{timeLabel(request)}</span>
        {request.looking_goal?.map(g => (
          <span key={g} className={`badge ${GOAL_BADGE[g]?.cls}`}>{GOAL_BADGE[g]?.label}</span>
        ))}
      </div>

      {isOwn ? (
        <button
          className="btn-primary"
          onClick={() => onOpenResponses?.(request)}
          style={{ fontSize: 14 }}
        >
          Отклики {request.response_count > 0 ? `(${request.response_count})` : ''}
        </button>
      ) : responded ? (
        <button className="btn-primary" disabled style={{ background: '#ccc' }}>
          Отклик отправлен ✓
        </button>
      ) : (
        <button className="btn-primary" onClick={handleRespond} disabled={loading}>
          {loading ? 'Отправляем...' : 'Откликнуться'}
        </button>
      )}
    </div>
  )
}
