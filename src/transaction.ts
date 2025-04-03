import { Atom, WritableAtom, getDefaultStore } from 'jotai/vanilla'
import {
  Store,
  Transaction,
  TransactionOperation,
  TransactionOptions,
} from './types'
import { generateId } from './utils'

export function beginTransaction(
  options: TransactionOptions = {},
): Transaction {
  const store = options.store || getDefaultStore()
  const id = generateId()

  const operations = new Map<
    WritableAtom<any, any, void>,
    TransactionOperation<any>
  >()
  const stagedValues = new Map<Atom<any>, any>()

  const transaction: Transaction = {
    id,
    status: 'pending',
    operations,
    _store: store,
    _options: options,

    set<Value, Args extends unknown[] = [Value]>(
      targetAtom: WritableAtom<Value, Args, void>,
      ...args: Args
    ): void {
      if (this.status !== 'pending') {
        throw new Error(`Cannot modify a transaction that is ${this.status}`)
      }

      const currentValue = store.get(targetAtom)
      const value = args[0] as Value

      const operation: TransactionOperation<Value, Args> = {
        atom: targetAtom,
        value,
        previousValue: currentValue,
      }

      operations.set(
        targetAtom as WritableAtom<unknown, unknown[], void>,
        operation as TransactionOperation<unknown, unknown[]>,
      )
      stagedValues.set(targetAtom, value)
    },

    get<Value>(targetAtom: Atom<Value>): Value {
      if (stagedValues.has(targetAtom)) {
        return stagedValues.get(targetAtom)
      }

      if (hasCustomRead(targetAtom)) {
        try {
          const transactionGet = createTransactionGetter(store, stagedValues)
          const options = {
            signal: new AbortController().signal,
            setSelf: undefined as never,
          }
          return targetAtom.read(transactionGet, options)
        } catch (e) {
          console.error(e)
          return store.get(targetAtom)
        }
      }

      return store.get(targetAtom)
    },
  }

  return transaction
}

export function commitTransaction(transaction: Transaction): void {
  if (transaction.status !== 'pending') {
    throw new Error(`Cannot commit a transaction that is ${transaction.status}`)
  }

  const store = transaction._store
  const onCommit = transaction._options.onCommit

  try {
    for (const operation of transaction.operations.values()) {
      if (operation) {
        store.set(operation.atom, operation.value)
      }
    }

    transaction.status = 'committed'
    if (typeof onCommit === 'function') {
      onCommit()
    }
  } catch (error) {
    const operationsArray = Array.from(transaction.operations.values())

    for (let i = operationsArray.length - 1; i >= 0; i--) {
      const operation = operationsArray[i]
      if (!operation) continue

      try {
        store.set(operation.atom, operation.previousValue)
      } catch (restoreError) {
        console.error('Error restoring value during rollback:', restoreError)
      }
    }

    transaction.status = 'rolled-back'
    const onRollback = transaction._options.onRollback
    if (typeof onRollback === 'function') {
      onRollback()
    }

    throw error
  }
}

export function rollbackTransaction(transaction: Transaction): void {
  if (transaction.status !== 'pending') {
    throw new Error(
      `Cannot rollback a transaction that is ${transaction.status}`,
    )
  }

  const onRollback = transaction._options.onRollback

  transaction.status = 'rolled-back'

  if (typeof onRollback === 'function') {
    onRollback()
  }
}

function hasCustomRead<Value>(atom: Atom<Value>): boolean {
  return typeof atom.read === 'function'
}

function createTransactionGetter(
  store: Store,
  stagedValues: Map<Atom<unknown>, unknown>,
): <Value>(atom: Atom<Value>) => Value {
  return function _transactionGet<Value>(atom: Atom<Value>): Value {
    if (stagedValues.has(atom)) {
      return stagedValues.get(atom) as Value
    }
    return store.get(atom)
  }
}
