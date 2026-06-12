import { useEffect, useState } from 'react'
import { api } from './api'
import BottomNav from './components/BottomNav'
import Responses from './screens/Responses'
import CreateRequest from './screens/CreateRequest'
import Feed from './screens/Feed'
import MatchScreen from './screens/MatchScreen'
import MySection from './screens/MySection'
import Onboarding from './screens/Onboarding'
import { initTg } from './tg'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('feed')
  const [responsesScreen, setResponsesScreen] = useState(null)
  const [pendingMatch, setPendingMatch] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    initTg()
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const me = await api.getMe()
      setUser(me)
      checkPendingMatch()
    } catch {
      // Not registered yet — show onboarding
    } finally {
      setLoading(false)
    }
  }

  async function checkPendingMatch() {
    try {
      const data = await api.getMyMatches()
      const matches = data.matches || []
      // Show latest unseen match (in real app, track seen matches in localStorage)
      const seen = JSON.parse(localStorage.getItem('seen_matches') || '[]')
      const unseen = matches.find(m => !seen.includes(m.id))
      if (unseen) setPendingMatch(unseen)
    } catch {}
  }

  function closeMatch() {
    if (pendingMatch) {
      const seen = JSON.parse(localStorage.getItem('seen_matches') || '[]')
      localStorage.setItem('seen_matches', JSON.stringify([...seen, pendingMatch.id]))
    }
    setPendingMatch(null)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div>Загружаем...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Onboarding onComplete={(u) => { setUser(u); checkPendingMatch() }} />
  }

  if (responsesScreen) {
    return <Responses request={responsesScreen} onBack={() => setResponsesScreen(null)} />
  }

  return (
    <>
      {tab === 'feed' && (
        <Feed
          currentUser={user}
          onOpenResponses={setResponsesScreen}
          setTab={setTab}
        />
      )}
      {tab === 'create' && (
        <CreateRequest
          onCreated={() => {
            showToast('Заявка размещена! 🎉')
            setTab('my')
          }}
        />
      )}
      {tab === 'my' && (
        <MySection
          currentUser={user}
          onOpenResponses={setResponsesScreen}
        />
      )}

      <BottomNav tab={tab} setTab={setTab} />

      {pendingMatch && <MatchScreen match={pendingMatch} onClose={closeMatch} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
