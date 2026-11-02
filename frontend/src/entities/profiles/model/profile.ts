export type PlayerProfile = {
  name: string
  handle: string
  joined: string
  battles: number
  wins: number
  votes: number
  weeklyBattles: number[]
}

export type ProfileBattle = {
  id: string
  title: string
  date: string
  place: number
  votes: number
}

export type BestRound = { title: string; place: number; votes: number; date: string }
