import type { ProfileRecord } from './profile'

const battleDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const joinedDate = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' })

function dateLabel(value: string, formatter: Intl.DateTimeFormat) {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? formatter.format(date) : value
}

export function formatProfile(profile: ProfileRecord): ProfileRecord {
  const battle = (item: ProfileRecord['history'][number]) => ({ ...item, date: dateLabel(item.date, battleDate) })
  return { ...profile, joined: dateLabel(profile.joined, joinedDate),
    bestRound: profile.bestRound ? battle(profile.bestRound) : null, history: profile.history.map(battle),
  }
}
