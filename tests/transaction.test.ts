import { atom } from 'jotai'
import { describe, expect, test } from 'vitest'
import {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} from '../src'

describe('jotai-transaction', () => {
  test('should create a transaction', () => {
    const transaction = beginTransaction()
    expect(transaction.id).toBeDefined()
    expect(transaction.status).toBe('pending')
  })

  test('should stage and commit changes', () => {
    const countAtom = atom(0)
    const transaction = beginTransaction()

    transaction.set(countAtom, 5)
    expect(transaction.get(countAtom)).toBe(5)
    commitTransaction(transaction)

    expect(transaction.status).toBe('committed')
  })

  test('should rollback changes', () => {
    const countAtom = atom(0)
    const transaction = beginTransaction()

    transaction.set(countAtom, 5)
    rollbackTransaction(transaction)

    expect(transaction.status).toBe('rolled-back')
  })
})
