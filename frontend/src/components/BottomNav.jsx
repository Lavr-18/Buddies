export default function BottomNav({ tab, setTab }) {
  return (
    <nav className="bottom-nav">
      <button className={tab === 'feed' ? 'active' : ''} onClick={() => setTab('feed')}>
        <span className="nav-icon">🏠</span>
        Лента
      </button>
      <button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>
        <span className="nav-icon">➕</span>
        Создать
      </button>
      <button className={tab === 'my' ? 'active' : ''} onClick={() => setTab('my')}>
        <span className="nav-icon">👤</span>
        Мои
      </button>
    </nav>
  )
}
