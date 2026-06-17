import { useState } from 'react'
import HostPage from './pages/HostPage'

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [roomCode, setRoomCode] = useState<string | null>(null)

  const handleSessionCreated = (session_id: string, room_code: string) => {
    setSessionId(session_id)
    setRoomCode(room_code)
  }

  if (!sessionId) {
    return <HostPage onSessionCreated={handleSessionCreated} />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400">Session created</p>
        <p className="text-4xl font-bold mt-2">{roomCode}</p>
        <p className="text-gray-500 text-sm mt-2">{sessionId}</p>
      </div>
    </div>
  )
}