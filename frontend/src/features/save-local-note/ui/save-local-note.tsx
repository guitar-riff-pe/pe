import { useState } from 'react'
import { getLocalDb } from '@shared/lib/db'

export function SaveLocalNote() {
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function save() {
    setPending(true)
    try {
      const db = getLocalDb()
      await db.notes.put({ id: 'welcome', text: 'Привет из Dexie!', updatedAt: Date.now() })
      const note = await db.notes.get('welcome')
      setMessage(`Сохранено в IndexedDB: ${note?.text}`)
    } catch {
      setMessage('Не удалось открыть IndexedDB в этом браузере.')
    } finally {
      setPending(false)
    }
  }

  return <div><button disabled={pending} onClick={() => void save()}>Сохранить локально</button><p role="status">{message}</p></div>
}
