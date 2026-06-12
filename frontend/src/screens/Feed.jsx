import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import RequestCard from '../components/RequestCard'

const FILTERS = [
  { key: null, label: 'Все' },
  { key: 'romance', label: '💕 Романтика' },
  { key: 'friendship', label: '🤝 Дружба' },
  { key: 'company', label: '🎉 Компания' },
]

export default function Feed({ currentUser, onOpenResponses, setTab }) {
  const [goal, setGoal] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(null)

  async function load(g = goal) {
    setLoading(true)
    try {
      const data = await api.getFeed(g)
      setRequests(data.requests || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(goal) }, [goal])

  // Pull to refresh
  function onTouchStart(e) { startY.current = e.touches[0].clientY }
  async function onTouchEnd(e) {
    if (!startY.current) return
    const dy = e.changedTouches[0].clientY - startY.current
    if (dy > 60) {
      setRefreshing(true)
      await load(goal)
      setRefreshing(false)
    }
    startY.current = null
  }

  return (
    <div className="screen" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>Buddies</h1>
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>📍 Москва</span>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px', overflowX: 'auto', marginBottom: 16, scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setGoal(f.key)}
            style={{
              padding: '7px 14px',
              borderRadius: 20,
              border: '1.5px solid',
              borderColor: goal === f.key ? 'var(--primary)' : '#e0e0e0',
              background: goal === f.key ? '#fdecea' : '#fff',
              color: goal === f.key ? 'var(--primary)' : 'var(--text)',
              fontSize: 13,
              fontWeight: goal === f.key ? 600 : 400,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {refreshing && (
        <div style={{ textAlign: 'center', padding: '8px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          Обновляем...
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Загружаем...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌟</div>
          <p>Пока заявок нет. Создай первую!</p>
          <button className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }} onClick={() => setTab('create')}>
            Создать заявку
          </button>
        </div>
      ) : (
        requests.map(req => (
          <RequestCard
            key={req.id}
            request={req}
            currentUserId={currentUser?.id}
            onOpenResponses={onOpenResponses}
          />
        ))
      )}
    </div>
  )
}
