import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { BestRoundCard, ProfileIdentity, ProfileStats } from '@entities/profiles'
import { EditProfileDialog } from '@features/edit-profile'
import { Button } from '@shared/ui'
import { ProfileHistory } from '@widgets/profile-history'
import { ProfileRhythm } from '@widgets/profile-rhythm'
import { ProfileShell } from '@widgets/profile-shell'
import { demoBattles, demoBestRound, demoProfile } from '../model/demo-profile'
import styles from './profile-page.module.scss'

export function ProfilePage() {
  const [profile, setProfile] = useState(demoProfile)
  const [tab, setTab] = useState<'overview' | 'history'>('overview')
  const [editing, setEditing] = useState(false)

  return <ProfileShell>
    <main className={styles.page}>
      <div className={styles.topline}><span>Личный кабинет</span><Link to="/rooms/create">Новый баттл <span aria-hidden="true">→</span></Link></div>
      <div className={styles.identityRow}>
        <ProfileIdentity profile={profile} />
        <Button className={styles.edit} variant="secondary" onClick={() => setEditing(true)}>Редактировать профиль</Button>
      </div>
      <div className={styles.tabs} role="tablist" aria-label="Разделы профиля">
        <button type="button" role="tab" aria-selected={tab === 'overview'} className={tab === 'overview' ? styles.selected : undefined} onClick={() => setTab('overview')}>Обзор</button>
        <button type="button" role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? styles.selected : undefined} onClick={() => setTab('history')}>История баттлов</button>
      </div>
      {tab === 'overview' ? <>
        <ProfileStats profile={profile} />
        <div className={styles.highlights}>
          <ProfileRhythm weeklyBattles={profile.weeklyBattles} totalBattles={profile.battles} />
          <BestRoundCard round={demoBestRound} />
        </div>
      </> : null}
      <ProfileHistory battles={demoBattles} expanded={tab === 'history'} onToggle={() => setTab(tab === 'overview' ? 'history' : 'overview')} />
    </main>
    {editing ? <EditProfileDialog name={profile.name} handle={profile.handle} onClose={() => setEditing(false)} onSave={(name, handle) => { setProfile({ ...profile, name, handle }); setEditing(false) }} /> : null}
  </ProfileShell>
}
