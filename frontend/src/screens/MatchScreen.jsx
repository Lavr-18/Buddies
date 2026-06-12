export default function MatchScreen({ match, onClose }) {
  const { partner_name, partner_username } = match

  return (
    <div className="match-overlay" onClick={onClose}>
      <div className="match-sheet" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 20, fontSize: 20, background: 'transparent', color: 'var(--text-muted)' }}>✕</button>

        <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
        <h2>Вы договорились!</h2>
        <p>Познакомьтесь и договоритесь о встрече</p>

        <div className="match-avatars">
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 22 }}>Я</div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 20 }}>💕</div>
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 22 }}>{partner_name?.[0]?.toUpperCase()}</div>
        </div>

        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>{partner_name}</div>

        {partner_username ? (
          <a
            href={`tg://resolve?domain=${partner_username}`}
            className="btn-primary"
            style={{ display: 'block', textDecoration: 'none', padding: '14px', borderRadius: 12, textAlign: 'center' }}
          >
            Написать @{partner_username}
          </a>
        ) : (
          <button className="btn-primary" disabled style={{ background: '#ccc' }}>
            Username не указан
          </button>
        )}
      </div>
    </div>
  )
}
