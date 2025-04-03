import { createStore } from 'jotai/vanilla'
import type { Atom, WritableAtom } from 'jotai/vanilla'

export type Store = ReturnType<typeof createStore>
export type TransactionStatus = 'pending' | 'committed' | 'rolled-back'

export interface TransactionOperation<Value, Args extends unknown[] = [Value]> {
  atom: WritableAtom<Value, Args, void>
  value: Value
  previousValue: Value
}

export interface Transaction {
  id: string
  status: TransactionStatus
  operations: Map<
    WritableAtom<unknown, unknown[], void>,
    TransactionOperation<unknown, unknown[]>
  >

  get: <Value>(atom: Atom<Value>) => Value
  set: <Value, Args extends unknown[] = [Value]>(
    atom: WritableAtom<Value, Args, void>,
    ...args: Args
  ) => void

  _store: Store
  _options: TransactionOptions
}

export interface TransactionOptions {
  store?: Store
  onCommit?: () => void
  onRollback?: () => void
  label?: string
}
