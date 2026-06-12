import { useState } from 'react'
import { api } from '../api'
import { haptic } from '../tg'

const ACTIVITIES = [
  { key: 'coffee', emoji: '☕', label: 'Кофе' },
  { key: 'dinner', emoji: '🍕', label: 'Ужин' },
  { key: 'sport', emoji: '🏃', label: 'Спорт' },
  { key: 'cinema', emoji: '🎬', label: 'Кино' },
  { key: 'board', emoji: '🎲', label: 'Настолки' },
  { key: 'walk', emoji: '🌳', label: 'Прогулка' },
  { key: 'photo', emoji: '📸', label: 'Фото' },
  { key: 'other', emoji: '✏️', label: 'Другое' },
]

const GENDERS = [
  { key: 'any', label: 'Любого' },
  { key: 'male', label: 'Мужчину' },
  { key: 'female', label: 'Женщину' },
]

const GOALS = [
  { key: 'romance', label: '💕 Романтика' },
  { key: 'friendship', label: '🤝 Дружба' },
  { key: 'company', label: '🎉 Компания' },
]

export default function CreateRequest({ onCreated }) {
  const [activity, setActivity] = useState('')
  const [description, setDescription] = useState('')
  const [timeType, setTimeType] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [lookingGender, setLookingGender] = useState('any')
  const [lookingGoal, setLookingGoal] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function toggleGoal(g) {
    haptic('light')
    setLookingGoal(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  const canSubmit = activity && description.trim() && timeType &&
    (timeType !== 'scheduled' || scheduledAt) && lookingGoal.length >= 1

  async function handleSubmit() {
    if (!canSubmit || loading) return
    haptic()
    setLoading(true)
    setError('')
    try {
      await api.createRequest({
        activity_type: activity,
        description: description.trim(),
        time_type: timeType,
        scheduled_at: scheduledAt || null,
        looking_gender: lookingGender,
        looking_goal: lookingGoal,
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onCreated()
      }, 1200)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 64 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Заявка размещена!</div>
      </div>
    )
  }

  return (
    <div className="screen" style={{ paddingTop: '20px', paddingLeft: '16px', paddingRight: '16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Новая заявка</h2>

      {/* Activity type */}
      <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>Тип активности *</label>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 20, scrollbarWidth: 'none' }}>
        {ACTIVITIES.map(a => (
          <button
            key={a.key}
            onClick={() => { haptic('light'); setActivity(a.key) }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 14px',
              borderRadius: 14,
              border: `2px solid ${activity === a.key ? 'var(--primary)' : '#e0e0e0'}`,
              background: activity === a.key ? '#fdecea' : '#fff',
              minWidth: 64,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 24 }}>{a.emoji}</span>
            <span style={{ fontSize: 11, color: activity === a.key ? 'var(--primary)' : 'var(--text-muted)' }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Description */}
      <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Описание *</label>
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value.slice(0, 300))}
          placeholder="Что хочешь сделать и что ищешь в человеке?"
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            border: '1.5px solid #e0e0e0',
            fontSize: 15,
            resize: 'none',
          }}
        />
        <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 11, color: description.length > 260 ? 'var(--primary)' : 'var(--text-muted)' }}>
          {description.length}/300
        </span>
      </div>

      {/* When */}
      <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>Когда *</label>
      <div className="pill-group" style={{ marginBottom: 20 }}>
        {[
          { key: 'now', label: '⚡ Прямо сейчас' },
          { key: 'today_evening', label: '🌆 Сегодня вечером' },
          { key: 'scheduled', label: '📅 Выбрать время' },
        ].map(t => (
          <button key={t.key} className={`pill ${timeType === t.key ? 'active' : ''}`} onClick={() => { haptic('light'); setTimeType(t.key) }}>
            {t.label}
          </button>
        ))}
      </div>
      {timeType === 'scheduled' && (
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e0e0e0', fontSize: 15, marginBottom: 20 }}
        />
      )}

      {/* Looking gender */}
      <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>Кого ищу</label>
      <div className="pill-group" style={{ marginBottom: 20 }}>
        {GENDERS.map(g => (
          <button key={g.key} className={`pill ${lookingGender === g.key ? 'active' : ''}`} onClick={() => { haptic('light'); setLookingGender(g.key) }}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Goals */}
      <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>Цель *</label>
      <div className="pill-group" style={{ marginBottom: 28 }}>
        {GOALS.map(g => (
          <button key={g.key} className={`pill ${lookingGoal.includes(g.key) ? 'active' : ''}`} onClick={() => toggleGoal(g.key)}>
            {g.label}
          </button>
        ))}
      </div>

      {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button className="btn-primary" disabled={!canSubmit || loading} onClick={handleSubmit}>
        {loading ? 'Размещаем...' : 'Разместить заявку'}
      </button>
    </div>
  )
}
