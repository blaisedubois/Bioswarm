import { useEffect, useState } from 'react';

export default function Leaderboard() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScores() {
      try {
        const res = await fetch('/api/score');
        const json = await res.json();
        if (json.status === 'success') {
          setScores(json.data);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchScores();
  }, []);

  if (loading) {
    return (
      <p
        style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: '#4cee4c',
          fontWeight: 'bold',
          fontSize: '1.2rem',
        }}
      >
        Loading leaderboard...
      </p>
    );
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '2rem auto',
        padding: '2rem',
        backgroundColor: '#0a0a0a',
        borderRadius: '15px',
        
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: '#4cee4c',
        userSelect: 'none',
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#6dfc6d',
          fontWeight: '900',
          fontSize: '3rem',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
        }}
      >
        BIOSWARM TOP SCORES TODAY
      </h1>
      <ol style={{ paddingLeft: '1.5rem' }}>
        {scores.map((player, index) => (
          <li
            key={player.telegram_id}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1.3rem',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              background:
                index % 2 === 0
                  ? 'linear-gradient(90deg, #7a1fff 0%, #a24aff 100%)'
                  : 'linear-gradient(90deg, #4c0082 0%, #7a1fff 100%)',
              boxShadow: 'inset 0 0 15px #7200ff',
              color: '#c7ff6e',
              fontWeight: 'bold',
              fontSize: '1.25rem',
            }}
          >
            <span
              style={{
                width: '3rem',
                textAlign: 'center',
                marginRight: '1.5rem',
                fontWeight: '900',
                fontSize: '1.6rem',
                color: '#9aff72',
              }}
            >
              #{index + 1}
            </span>
            {/*
            <img
              src={player.profile_photo}
              alt={player.username}
              width={56}
              height={56}
              style={{
                borderRadius: '50%',
                marginRight: '1.8rem',
               
                border: '3px solid #6dfc6d',
              }}
            />
            */}

            <div style={{ flexGrow: 1, userSelect: 'text' }}>{player.username}</div>
            <div
              style={{
                minWidth: '5rem',
                textAlign: 'right',
                color: '#9aff72',
                fontSize: '1.5rem',
                fontWeight: '900',
                userSelect: 'text',
              }}
            >
              {player.score}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
