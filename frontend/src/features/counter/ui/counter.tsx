import { useCounterStore } from '../model/counter-store'

export function Counter() {
  const count = useCounterStore((state) => state.count)
  const increment = useCounterStore((state) => state.increment)
  return <button onClick={increment}>Счётчик: {count}</button>
}
