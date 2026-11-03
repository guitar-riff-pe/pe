import type { BestRound, PlayerProfile, ProfileBattle } from '@entities/profiles'

export const demoProfile: PlayerProfile = {
  name: 'NeonRiff', handle: '@neonriff', joined: 'с сентября 2026', battles: 48, wins: 12, votes: 184,
  weeklyBattles: [3, 5, 4, 8, 6, 7, 6, 9],
}

export const demoBattles: ProfileBattle[] = [
  { id: 'midnight-garage', title: 'Midnight Garage', date: '22 окт', place: 1, votes: 7 },
  { id: 'clean-and-simple', title: 'Clean & Simple', date: '20 окт', place: 3, votes: 2 },
  { id: 'electric-morning', title: 'Electric Morning', date: '18 окт', place: 2, votes: 5 },
  { id: 'after-hours', title: 'After Hours', date: '15 окт', place: 1, votes: 6 },
  { id: 'city-lights', title: 'City Lights', date: '12 окт', place: 2, votes: 4 },
]

export const demoBestRound: BestRound = { title: 'Midnight Garage', place: 1, votes: 7, date: '22 октября' }
