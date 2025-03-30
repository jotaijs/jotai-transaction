import { createStore } from 'jotai'
import type { Atom, WritableAtom } from 'jotai'

type Store = ReturnType<typeof createStore>
export type TransactionStatus = 'pending' | 'committed' | 'rolled-back'

export interface TransactionOperation<Value = any> {
  atom: WritableAtom<Value, any, void>
  value: Value
  previousValue: Value
}

export interface Transaction {
  id: string
  status: TransactionStatus
  operations: Map<WritableAtom<any, any, void>, TransactionOperation>

  set: <Value, Args extends unknown[]>(
    atom: WritableAtom<Value, Args, void>,
    value: Value,
  ) => void

  get: <Value>(atom: Atom<Value>) => Value

  _store: Store
}

export interface TransactionOptions {
  store?: Store
  onCommit?: () => void
  onRollback?: () => void
  label?: string
}
