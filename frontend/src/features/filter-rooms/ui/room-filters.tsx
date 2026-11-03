import { SelectField, TextField } from '@shared/ui'
import type { RoomFiltersValue } from '../model/filter-rooms'
import styles from './room-filters.module.scss'

const styleOptions = [
  { value: 'all', label: 'Все стили' },
  { value: 'Rock', label: 'Rock' },
  { value: 'Metal', label: 'Metal' },
  { value: 'Indie', label: 'Indie' },
  { value: 'Любой стиль', label: 'Любой стиль' },
]

type RoomFiltersProps = {
  value: RoomFiltersValue
  onChange: (value: RoomFiltersValue) => void
}

export function RoomFilters({ value, onChange }: RoomFiltersProps) {
  return (
    <div className={styles.filters} role="search" aria-label="Поиск публичных комнат">
      <TextField
        label="Поиск по названию"
        type="search"
        placeholder="Найти комнату..."
        value={value.query}
        onChange={(event) => onChange({ ...value, query: event.target.value })}
      />
      <SelectField
        label="Музыкальный стиль"
        options={styleOptions}
        value={value.style}
        onValueChange={(style) => onChange({ ...value, style: style as RoomFiltersValue['style'] })}
      />
      <label className={styles.availability}>
        <input
          type="checkbox"
          checked={value.onlyAvailable}
          onChange={(event) => onChange({ ...value, onlyAvailable: event.target.checked })}
        />
        Есть места
      </label>
    </div>
  )
}
