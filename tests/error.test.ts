import { act, renderHook } from '@testing-library/react'
import { atom, useAtom } from 'jotai'
import { describe, expect, it, vi } from 'vitest'
import {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} from '../src'

describe('Error Handling', () => {
  it('should automatically rollback on commit error', () => {
    const countAtom = atom(0)
    const messageAtom = atom('initial')

    const transaction = beginTransaction()

    act(() => {
      transaction.set(countAtom, 5)
      transaction.set(messageAtom, 'updated')
    })

    const originalSet = transaction._store.set
    transaction._store.set = vi.fn().mockImplementation((atom, value) => {
      if (atom === messageAtom) {
        throw new Error('Test error')
      }
      return originalSet.call(transaction._store, atom, value)
    })

    expect(() => {
      act(() => {
        commitTransaction(transaction)
      })
    }).toThrow('Test error')

    transaction._store.set = originalSet
    expect(transaction.status).toBe('rolled-back')

    const { result } = renderHook(() => useAtom(countAtom))
    expect(result.current[0]).toBe(0)
  })

  it('should support custom commit error handlers', () => {
    const errorHandler = vi.fn()
    const countAtom = atom(0)

    const transaction = beginTransaction({
      onCommit: () => errorHandler('Commit successful'),
      onRollback: () => errorHandler('Rolled back'),
    })

    transaction.set(countAtom, 5)
    commitTransaction(transaction)

    expect(errorHandler).toHaveBeenCalledWith('Commit successful')
    expect(errorHandler).not.toHaveBeenCalledWith('Rolled back')
  })

  it('should throw when trying to commit already finished transaction', () => {
    const countAtom = atom(0)
    const transaction = beginTransaction()

    transaction.set(countAtom, 5)
    commitTransaction(transaction)

    expect(() => {
      commitTransaction(transaction)
    }).toThrow(/committed/)
  })

  it('should throw when trying to rollback already finished transaction', () => {
    const countAtom = atom(0)
    const transaction = beginTransaction()

    transaction.set(countAtom, 5)
    commitTransaction(transaction)

    expect(() => {
      rollbackTransaction(transaction)
    }).toThrow(/committed/)
  })
})
