import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { BestRoundCard, ProfileIdentity, ProfileStats, profileKey, profileOptions, updateProfile, type PlayerProfile, type ProfileBattle, type BestRound } from '@entities/profiles'
import { EditProfileDialog } from '@features/edit-profile'
import { roomsKey } from '@entities/rooms'
import { sessionQueryKey, useSession, type SessionPlayer } from '@entities/sessions'
import { Button, Surface } from '@shared/ui'
import { ProfileHistory } from '@widgets/profile-history'
import { ProfileRhythm } from '@widgets/profile-rhythm'
import { ProfileShell } from '@widgets/profile-shell'
import styles from './profile-page.module.scss'

export function ProfilePage() {
  const session = useSession()
  const queries = useQueryClient()
  const profile = useQuery({ ...profileOptions, enabled: session.data?.kind === 'account' })
  const save = useMutation({
    mutationFn: ({ name, handle }: { name: string; handle: string }) => updateProfile(name, handle),
    onSuccess: async record => {
      await queries.cancelQueries({ queryKey: profileKey })
      queries.setQueryData(profileKey, record)
      queries.setQueryData<SessionPlayer | null>(sessionQueryKey, previous => previous ? { ...previous, nickname: record.name } : previous)
      void queries.invalidateQueries({ queryKey: roomsKey })
    },
  })
  if (session.data?.kind === 'account' && profile.data) return <ProfilePageView profile={profile.data}
    battles={profile.data.history} bestRound={profile.data.bestRound} weekStarts={profile.data.weekStarts}
    onSave={(name, handle) => save.mutateAsync({ name, handle }).then(() => {})} pending={save.isPending}
    error={save.error?.message} resetError={save.reset} />
  const loading = session.isPending || (session.data?.kind === 'account' && profile.isPending)
  const error = session.error ?? (session.data?.kind === 'account' ? profile.error : null)
  return <ProfileShell><main className={styles.page}><h1>Личный кабинет</h1><Surface>
    {loading ? <p role="status">Загружаем профиль…</p> : error ? <><p role="alert">{error.message}</p>
      <Button variant="secondary" onClick={() => { void session.refetch(); void profile.refetch() }}>Попробовать снова</Button></> :
      session.data?.kind === 'guest' ? <><p>Статистика и история доступны зарегистрированным игрокам.</p><Link to="/register" search={{ redirect: '/profile' }}>Создать аккаунт →</Link></> :
      <><p>Войди, чтобы открыть свой профиль.</p><Link to="/login" search={{ redirect: '/profile' }}>Перейти ко входу →</Link></>}
  </Surface></main></ProfileShell>
}

type ProfilePageViewProps = {
  profile: PlayerProfile; battles: ProfileBattle[]; bestRound: BestRound | null; weekStarts?: string[]
  onSave: (name: string, handle: string) => Promise<void>; pending?: boolean; error?: string; resetError?: () => void
}
export function ProfilePageView({ profile, battles, bestRound, weekStarts, onSave, pending, error, resetError }: ProfilePageViewProps) {
  const [tab, setTab] = useState<'overview' | 'history'>('overview')
  const [editing, setEditing] = useState(false)

  return <ProfileShell>
    <main className={styles.page}>
      <div className={styles.topline}><span>Личный кабинет</span><Link to="/rooms/create">Новый баттл <span aria-hidden="true">→</span></Link></div>
      <div className={styles.identityRow}>
        <ProfileIdentity profile={profile} />
        <Button className={styles.edit} variant="secondary" onClick={() => { resetError?.(); setEditing(true) }}>Редактировать профиль</Button>
      </div>
      <div className={styles.tabs} role="tablist" aria-label="Разделы профиля">
        <button type="button" role="tab" aria-selected={tab === 'overview'} className={tab === 'overview' ? styles.selected : undefined} onClick={() => setTab('overview')}>Обзор</button>
        <button type="button" role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? styles.selected : undefined} onClick={() => setTab('history')}>История баттлов</button>
      </div>
      {tab === 'overview' ? <>
        <ProfileStats profile={profile} />
        <div className={styles.highlights}>
          <ProfileRhythm weeklyBattles={profile.weeklyBattles} totalBattles={profile.battles} weekStarts={weekStarts} />
          <BestRoundCard round={bestRound} />
        </div>
      </> : null}
      <ProfileHistory battles={battles} expanded={tab === 'history'} onToggle={() => setTab(tab === 'overview' ? 'history' : 'overview')} />
    </main>
    {editing ? <EditProfileDialog name={profile.name} handle={profile.handle} onClose={() => setEditing(false)} pending={pending} error={error} onSave={(name, handle) => { void onSave(name, handle).then(() => setEditing(false)).catch(() => {}) }} /> : null}
  </ProfileShell>
}
