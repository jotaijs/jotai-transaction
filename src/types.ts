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
  operations: Map<WritableAtom<any, any, void>, TransactionOperation<any>>

  get: <Value>(atom: Atom<Value>) => Value
  set: <Value>(atom: WritableAtom<Value, [Value], void>, value: Value) => void

  _store: Store
  _options: TransactionOptions
}

export interface TransactionOptions {
  store?: Store
  onCommit?: () => void
  onRollback?: () => void
  label?: string
}
