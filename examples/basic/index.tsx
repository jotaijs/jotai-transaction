import React from 'react'
import { atom, useAtom } from 'jotai'
import {
  commitTransaction,
  rollbackTransaction,
  useTransaction,
} from '../../src'

const countAtom = atom(0)
const messageAtom = atom('Hello')

export function TransactionExample() {
  const [count, _setCount] = useAtom(countAtom)
  const [message, _setMessage] = useAtom(messageAtom)
  const transaction = useTransaction()

  const handleApplyChanges = () => {
    transaction.set(countAtom, count + 1)
    transaction.set(messageAtom, `Hello ${count + 1}`)

    commitTransaction(transaction)
  }

  const handleDiscardChanges = () => {
    transaction.set(countAtom, count + 1)
    transaction.set(messageAtom, `Hello ${count + 1}`)

    rollbackTransaction(transaction)
  }

  return (
    <div>
      <div>Count: {count}</div>
      <div>Message: {message}</div>

      <button onClick={handleApplyChanges}>Apply Transaction</button>
      <button onClick={handleDiscardChanges}>Stage & Discard</button>
    </div>
  )
}
