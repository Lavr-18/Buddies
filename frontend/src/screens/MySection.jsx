import { useEffect, useState } from 'react'
import { api } from '../api'
import RequestCard from '../components/RequestCard'
import Responses from './Responses'

const GOAL_BADGE = {
  romance: { label: '💕 Романтика', cls: 'badge-romance' },
  friendship: { label: '🤝 Дружба', cls: 'badge-friendship' },
  company: { label: '🎉 Компания', cls: 'badge-company' },
}

export default function MySection({ currentUser, onOpenResponses }) {
  const [tab, setTab] = useState('requests')
  const [requestsTab, setRequestsTab] = useState('active')
  const [requests, setRequests] = useState([])
  const [myResponses, setMyResponses] = useState([])
  const [loading, setLoading] = useState(false)
  const [responsesScreen, setResponsesScreen] = useState(null)

  useEffect(() => {
    if (tab === 'requests') loadRequests()
    else loadMyResponses()
  }, [tab, requestsTab])

  async function loadRequests() {
    setLoading(true)
    try {
      const data = await api.getMyRequests(requestsTab)
      setRequests(data.requests || [])
    } finally {
      setLoading(false)
    }
  }

  async function loadMyResponses() {
    setLoading(true)
    try {
      const data = await api.getMyResponses()
      setMyResponses(data.responses || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    await api.deleteRequest(id)
    loadRequests()
  }

  if (responsesScreen) {
    return <Responses request={responsesScreen} onBack={() => { setResponsesScreen(null); loadRequests() }} />
  }

  return (
    <div className="screen">
      <div style={{ padding: '16px 16px 0' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Мои</h2>

        {/* Top tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[{ key: 'requests', label: 'Заявки' }, { key: 'responses', label: 'Отклики' }].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                border: '1.5px solid',
                borderColor: tab === t.key ? 'var(--primary)' : '#e0e0e0',
                background: tab === t.key ? '#fdecea' : '#fff',
                color: tab === t.key ? 'var(--primary)' : 'var(--text)',
                fontWeight: tab === t.key ? 600 : 400,
                fontSize: 14,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'requests' && (
        <>
          <div style={{ display: 'flex', gap: 8, padding: '0 16px', marginBottom: 16 }}>
            {[{ key: 'active', label: 'Активные' }, { key: 'expired', label: 'Завершённые' }].map(t => (
              <button
                key={t.key}
                onClick={() => setRequestsTab(t.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1.5px solid',
                  borderColor: requestsTab === t.key ? 'var(--secondary)' : '#e0e0e0',
                  background: requestsTab === t.key ? '#fff3ee' : '#fff',
                  color: requestsTab === t.key ? 'var(--secondary)' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: requestsTab === t.key ? 600 : 400,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Загружаем...</div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>У тебя пока нет заявок</p>
            </div>
          ) : (
            requests.map(req => (
              <RequestCard
                key={req.id}
                request={{ ...req, user: currentUser }}
                currentUserId={currentUser?.id}
                onOpenResponses={() => setResponsesScreen(req)}
              />
            ))
          )}
        </>
      )}

      {tab === 'responses' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Загружаем...</div>
          ) : myResponses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <p>Ты ещё ни на что не откликался(ась)</p>
            </div>
          ) : (
            <div style={{ padding: '0 16px' }}>
              {myResponses.map(r => (
                <div key={r.id} className="card" style={{ marginLeft: 0, marginRight: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {r.request?.activity_type || '—'}
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {r.request?.description?.slice(0, 80)}
                    {r.request?.description?.length > 80 ? '...' : ''}
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {r.request?.looking_goal?.map(g => (
                      <span key={g} className={`badge ${GOAL_BADGE[g]?.cls}`}>{GOAL_BADGE[g]?.label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Ожидает', bg: '#f0f0f0', color: '#888' },
    accepted: { label: 'Принято ✓', bg: '#E8F5E9', color: '#2E7D32' },
    rejected: { label: 'Отклонено', bg: '#f0f0f0', color: '#aaa' },
  }
  const s = map[status] || map.pending
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {s.label}
    </span>
  )
}
