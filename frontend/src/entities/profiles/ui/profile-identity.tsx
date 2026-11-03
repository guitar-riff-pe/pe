import type { PlayerProfile } from '../model/profile'
import styles from './profile-identity.module.scss'

export function ProfileIdentity({ profile }: { profile: PlayerProfile }) {
  return <div className={styles.identity}>
    <div className={styles.avatar} aria-hidden="true">{profile.name.charAt(0).toUpperCase()}</div>
    <div className={styles.text}><h1>{profile.name}</h1><p>{profile.handle}<span className={styles.desktopJoined}> · в игре {profile.joined}</span></p></div>
    <p className={styles.mobileJoined}>В игре {profile.joined}</p>
  </div>
}
