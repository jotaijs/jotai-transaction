import { Atom, WritableAtom, getDefaultStore } from 'jotai'
import { Transaction, TransactionOptions } from './types'
import { generateId } from './utils'

export function beginTransaction(
  options: TransactionOptions = {},
): Transaction {
  const store = options.store || getDefaultStore()
  const id = generateId()

  const transaction: Transaction = {
    id,
    status: 'pending',
    operations: new Map(),
    _store: store,

    set<Value, Args extends unknown[]>(
      targetAtom: WritableAtom<Value, Args, void>,
      value: Value,
    ): void {
      if (this.status !== 'pending') {
        throw new Error(`Cannot modify a transaction that is ${this.status}`)
      }

      const currentValue = store.get(targetAtom)

      this.operations.set(targetAtom, {
        atom: targetAtom,
        value,
        previousValue: currentValue,
      })
    },

    get<Value>(targetAtom: Atom<Value>): Value {
      if (this.operations.has(targetAtom as WritableAtom<Value, any, void>)) {
        const operation = this.operations.get(
          targetAtom as WritableAtom<Value, any, void>,
        )
        return operation!.value
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

  try {
    const store = transaction._store

    transaction.operations.forEach((operation) => {
      store.set(operation.atom, operation.value)
    })

    transaction.status = 'committed'
  } catch (error) {
    rollbackTransaction(transaction)
    throw error
  }
}

export function rollbackTransaction(transaction: Transaction): void {
  if (transaction.status !== 'pending') {
    throw new Error(
      `Cannot rollback a transaction that is ${transaction.status}`,
    )
  }

  transaction.status = 'rolled-back'
}
