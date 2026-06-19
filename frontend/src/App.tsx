import { useState } from 'react'
import HostPage from './pages/HostPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import RevealPage from './pages/RevealPage'
import { GameState } from './types'
import { debugSession } from './api'
import AccusePage from './pages/AccusePage'

type Screen = 'host' | 'lobby' | 'game' | 'accuse' | 'reveal'

export default function App() {
  const [screen, setScreen] = useState<Screen>('host')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [playerCount, setPlayerCount] = useState<number>(4)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [reveal, setReveal] = useState<any | null>(null)

  const handleSessionCreated = async (session_id: string, room_code: string, count: number, players?: any[], gameState?: any) => {
    setSessionId(session_id)
    setRoomCode(room_code)
    setPlayerCount(count)
  
    if (players && gameState) {
      setPlayers(players)
      setGameState(gameState)
      setScreen('game')
    } else {
      setScreen('lobby')
      try {
        const debug = await debugSession(session_id)
        setPlayers(debug.players)
      } catch (e) {}
    }
  }

  const handleGameStarted = (state: GameState, joinedPlayers: any[]) => {
    setGameState(state)
    setPlayers(joinedPlayers)
    setScreen('game')
  }

  const handleGameComplete = (revealData: any) => {
    if (revealData) {
      setReveal(revealData)
      setScreen('reveal')
    } else {
      setScreen('accuse')
    }
  }

  const handleReveal = (revealData: any) => {
    setReveal(revealData)
    setScreen('reveal')
  }

  const handlePlayAgain = () => {
    setScreen('host')
    setSessionId(null)
    setRoomCode(null)
    setGameState(null)
    setPlayers([])
    setReveal(null)
  }

  if (screen === 'host') {
    return <HostPage onSessionCreated={handleSessionCreated} />
  }

  if (screen === 'lobby') {
    return (
      <LobbyPage
        sessionId={sessionId!}
        roomCode={roomCode!}
        playerCount={playerCount}
        onGameStarted={handleGameStarted}
      />
    )
  }

  if (screen === 'game') {
    return (
      <GamePage
        gameState={gameState!}
        sessionId={sessionId!}
        players={players}
        onGameComplete={handleGameComplete}
      />
    )
  }

  if (screen === 'accuse') {
    return (
      <AccusePage
        sessionId={sessionId!}
        players={players}
        suspects={gameState!.suspects}
        onReveal={handleReveal}
        onBack={() => setScreen('game')}
      />
    )
  }

  return (
    <RevealPage
      reveal={reveal}
      onPlayAgain={handlePlayAgain}
    />
  )
}