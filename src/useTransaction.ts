import { atom, useAtomValue, useSetAtom, useStore } from 'jotai'
import { beginTransaction } from './transaction'
import { Transaction, TransactionOptions } from './types'

export const activeTransactionsAtom = atom<string[]>([])

export function useTransaction(options: TransactionOptions = {}): Transaction {
  const store = useStore()
  const transaction = beginTransaction({ ...options, store })

  return transaction
}

export function useTransactionStatus() {
  const activeTransactions = useAtomValue(activeTransactionsAtom)
  const setActiveTransactions = useSetAtom(activeTransactionsAtom)

  return {
    activeTransactions,
    isTransactionActive: activeTransactions.length > 0,

    registerTransaction: (transactionId: string) => {
      setActiveTransactions((prev) => [...prev, transactionId])
    },

    unregisterTransaction: (transactionId: string) => {
      setActiveTransactions((prev) => prev.filter((id) => id !== transactionId))
    },
  }
}
