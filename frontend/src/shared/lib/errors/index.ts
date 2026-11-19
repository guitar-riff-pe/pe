export type ErrorKind = 'network' | 'timeout' | 'chunk' | 'unauthorized' | 'forbidden' | 'not-found' | 'rate-limit' | 'server' | 'unknown'
export type ErrorDetails = { kind: ErrorKind; title: string; message: string }

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}
}

export function getErrorDetails(error: unknown): ErrorDetails {
  const value = record(error)
  const cause = record(value.cause)
  const code = value.code ?? cause.code
  const message = typeof value.message === 'string' ? value.message : typeof error === 'string' ? error : ''
  const status = value.status ?? record(value.response).status

  if (value.name === 'ChunkLoadError' || /Failed to fetch dynamically imported module|Importing a module script failed|Loading (?:CSS )?chunk .+ failed|error loading dynamically imported module/i.test(message)) {
    return { kind: 'chunk', title: 'Не удалось загрузить страницу', message: 'Проверьте подключение к интернету и обновите страницу. Возможно, на сайте появилась новая версия.' }
  }
  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || value.name === 'TimeoutError') {
    return { kind: 'timeout', title: 'Сервер не успел ответить', message: 'Запрос занял слишком много времени. Попробуй ещё раз чуть позже.' }
  }
  if (status === 0 || ['ERR_NETWORK', 'ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET', 'EAI_AGAIN'].includes(String(code)) || /^(Network Error|Failed to fetch|fetch failed|Load failed|Network request failed)$/i.test(message)) {
    return { kind: 'network', title: 'Связь прервалась', message: 'Не удалось связаться с сервером. Проверьте подключение к интернету и попробуйте ещё раз.' }
  }
  const http: Partial<Record<number, ErrorDetails>> = {
    401: { kind: 'unauthorized', title: 'Нужно войти в аккаунт', message: 'Сессия завершилась. Войди снова, чтобы продолжить.' },
    403: { kind: 'forbidden', title: 'Нет доступа', message: 'У тебя нет доступа к этому действию.' },
    404: { kind: 'not-found', title: 'Ничего не найдено', message: 'Эта страница или запись больше недоступна.' },
    429: { kind: 'rate-limit', title: 'Слишком много запросов', message: 'Подожди немного и попробуй снова.' },
  }
  const details = typeof status === 'number' ? http[status] : undefined
  if (typeof status === 'number' && status >= 500) {
    return { kind: 'server', title: 'Сервер временно недоступен', message: 'На сервере произошла ошибка. Попробуй ещё раз чуть позже.' }
  }
  // Preserve actionable Russian API messages, but never expose runtime errors or server traces.
  const apiMessage = typeof status === 'number' && status >= 400 && status < 500 && /[а-яё]/i.test(message) ? message : undefined
  if (details) return { ...details, message: apiMessage ?? details.message }
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return { kind: 'unknown', title: 'Не удалось выполнить действие', message: apiMessage ?? 'Проверьте введённые данные и попробуйте снова.' }
  }
  return { kind: 'unknown', title: 'Что-то пошло не так', message: 'Не удалось показать этот раздел. Попробуй ещё раз или вернись на главную.' }
}

export function getErrorMessage(error: unknown): string {
  return getErrorDetails(error).message
}
