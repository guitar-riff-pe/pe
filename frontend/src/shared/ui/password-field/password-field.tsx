import { useState } from 'react'
import { TextField, type TextFieldProps } from '../text-field/text-field'
import styles from './password-field.module.scss'

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing'>

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          className={styles.toggle}
          type="button"
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          aria-pressed={visible}
          disabled={props.disabled}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Скрыть' : 'Показать'}
        </button>
      }
    />
  )
}
