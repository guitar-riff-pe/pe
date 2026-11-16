/** Coalesce edits; flush only the latest snapshot on navigation or page hide. */
export function createDraftPersistence(write: (value: string) => void, report: (error: string) => void, delay = 300) {
  let pending: string | undefined
  let saved: string | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  function flush(notify = true) {
    clearTimeout(timer)
    if (pending === undefined || pending === saved) return
    try {
      write(pending)
      saved = pending
      if (notify) report('')
    } catch {
      if (notify) report('Не удалось сохранить черновик на устройстве. Сохрани рифф перед выходом.')
    }
  }
  return {
    schedule(value: string) { pending = value; clearTimeout(timer); timer = setTimeout(flush, delay) },
    flush,
  }
}
