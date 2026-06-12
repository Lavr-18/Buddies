import { useState } from 'react'
import { api } from '../api'
import { getTgUser, haptic } from '../tg'

const INTERESTS = ['Спорт', 'Кофе', 'Кино', 'Еда', 'Прогулки', 'Настолки', 'Музыка', 'Фото', 'Путешествия', 'Йога', 'Падел', 'Кальян']
const GOALS = [
  { key: 'romance', icon: '💕', label: 'Романтика', desc: 'Ищу свидание' },
  { key: 'friendship', icon: '🤝', label: 'Дружба', desc: 'Новый друг' },
  { key: 'company', icon: '🎉', label: 'Компания', desc: 'Весело провести время' },
]

export default function Onboarding({ onComplete }) {
  const tgUser = getTgUser()
  const [step, setStep] = useState(1)
  const [name, setName] = useState(tgUser?.first_name || '')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [interests, setInterests] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleInterest(i) {
    haptic('light')
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  function toggleGoal(g) {
    haptic('light')
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  const canNext2 = name.trim() && age >= 18 && age <= 80 && gender
  const canNext3 = interests.length >= 2
  const canFinish = goals.length >= 1

  async function finish() {
    if (!canFinish || loading) return
    haptic()
    setLoading(true)
    setError('')
    try {
      const user = await api.register({
        telegram_id: tgUser?.id || 0,
        username: tgUser?.username || null,
        first_name: name.trim(),
        age: parseInt(age),
        gender,
        interests: interests.map(i => i.toLowerCase()),
        goal: goals,
      })
      onComplete(user)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: '24px 20px' }}>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${(step / 4) * 100}%` }} />
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Шаг {step} из 4</div>

      {step === 1 && (
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>👥</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginBottom: 8 }}>Buddies</h1>
          <p style={{ fontSize: 18, color: 'var(--text)', marginBottom: 12 }}>Найди с кем провести время</p>
          <p style={{ color: 'var(--text-muted)', marginBottom: 40, fontSize: 15 }}>
            Размести заявку или откликнись на чужую — и встреться сегодня
          </p>
          <button className="btn-primary" onClick={() => { haptic(); setStep(2) }}>Начать</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>О тебе</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Имя</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Твоё имя"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e0e0e0', fontSize: 16 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Возраст</label>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="18–80"
              min={18}
              max={80}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e0e0e0', fontSize: 16 }}
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Пол</label>
            <div className="pill-group">
              {['male', 'female'].map(g => (
                <button key={g} className={`pill ${gender === g ? 'active' : ''}`} onClick={() => { haptic('light'); setGender(g) }}>
                  {g === 'male' ? '👨 Мужчина' : '👩 Женщина'}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary" disabled={!canNext2} onClick={() => { haptic(); setStep(3) }}>
            Далее
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Твои интересы</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Выбери минимум 2</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 32 }}>
            {INTERESTS.map(i => (
              <button key={i} className={`tag ${interests.includes(i) ? 'active' : ''}`} onClick={() => toggleInterest(i)}>
                {i}
              </button>
            ))}
          </div>
          <button className="btn-primary" disabled={!canNext3} onClick={() => { haptic(); setStep(4) }}>
            Далее
          </button>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Твоя цель</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Можно выбрать несколько</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {GOALS.map(g => (
              <button
                key={g.key}
                onClick={() => toggleGoal(g.key)}
                style={{
                  padding: '16px',
                  borderRadius: 16,
                  border: `2px solid ${goals.includes(g.key) ? 'var(--primary)' : '#e0e0e0'}`,
                  background: goals.includes(g.key) ? '#fdecea' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 28 }}>{g.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{g.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{g.desc}</div>
                </div>
              </button>
            ))}
          </div>
          {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="btn-primary" disabled={!canFinish || loading} onClick={finish}>
            {loading ? 'Сохраняем...' : 'Готово 🎉'}
          </button>
        </div>
      )}
    </div>
  )
}
