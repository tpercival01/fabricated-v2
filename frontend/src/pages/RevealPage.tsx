interface RevealPageProps {
  reveal: any
  onPlayAgain: () => void
}

export default function RevealPage({ reveal, onPlayAgain }: RevealPageProps) {
  if (!reveal) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <p style={{ color: 'var(--text-muted)' }}>No reveal data available.</p>
      </div>
    )
  }

  const correct = reveal.scoreboard.filter((p: any) => p.correct)
  const wrong = reveal.scoreboard.filter((p: any) => !p.correct)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto px-8 py-16 space-y-12">

        {/* Killer reveal */}
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            The killer was
          </p>
          <h1 className="font-serif text-7xl font-black" style={{ color: 'var(--text)' }}>
            {reveal.killer.name}
          </h1>
          <p className="text-lg" style={{ color: 'var(--accent)' }}>
            {reveal.killer.role}
          </p>
          <div
            className="mx-auto h-px w-24"
            style={{ backgroundColor: 'var(--border-light)' }}
          />
        </div>

        {/* Motive / Means / Opportunity */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Motive', value: reveal.motive },
            { label: 'Means', value: reveal.means },
            { label: 'Opportunity', value: reveal.opportunity },
          ].map(item => (
            <div
              key={item.label}
              className="rounded-xl p-5"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
                {item.label}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Alibi flaw */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-light)',
          }}
        >
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            How the alibi unravelled
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            {reveal.alibi_flaw}
          </p>
        </div>

        {/* Scoreboard */}
        <div>
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            Scoreboard
          </p>
          <div className="space-y-2">
            {[...correct, ...wrong].map((player: any) => (
              <div
                key={player.player_id}
                className="flex items-center justify-between p-5 rounded-xl"
                style={{
                  backgroundColor: player.correct ? 'var(--surface-raised)' : 'var(--surface)',
                  border: `1px solid ${player.correct ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="text-xl font-bold"
                    style={{ color: player.correct ? 'var(--accent)' : 'var(--text-faint)' }}
                  >
                    {player.correct ? '✓' : '✗'}
                  </span>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>
                      {player.display_name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Playing as suspect {player.suspect_played} · Accused {player.accused_name || player.accused}
                    </p>
                  </div>
                </div>
                <p
                  className="font-bold text-sm"
                  style={{ color: player.correct ? 'var(--accent)' : 'var(--text-faint)' }}
                >
                  {player.correct ? 'Solved it' : 'Wrong'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Solution */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            The full solution
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {reveal.solution_explanation}
          </p>
        </div>

        {/* Play again */}
        <button
          onClick={onPlayAgain}
          className="w-full py-4 rounded-lg font-semibold text-sm tracking-wide transition-all"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--bg)',
          }}
        >
          Play Again
        </button>

      </div>
    </div>
  )
}