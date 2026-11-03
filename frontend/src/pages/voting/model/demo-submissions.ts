import type { Submission } from '@entities/submissions'

export const demoSubmissions: Submission[] = [
  { id: 'a', title: 'Рифф A', seed: 1 },
  { id: 'b', title: 'Рифф B', seed: 2 },
  { id: 'c', title: 'Рифф C', seed: 3 },
  { id: 'own', title: 'Твой рифф', seed: 4, own: true },
]
