import { act, renderHook } from '@testing-library/react'
import { atom, createStore, useAtom } from 'jotai'
import { describe, expect, it } from 'vitest'
import {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} from '../src'

describe('Transaction Core Functionality', () => {
  it('should create a transaction with unique ID', () => {
    const transaction1 = beginTransaction()
    const transaction2 = beginTransaction()

    expect(transaction1.id).toBeDefined()
    expect(transaction2.id).toBeDefined()
    expect(transaction1.id).not.toBe(transaction2.id)
    expect(transaction1.status).toBe('pending')
    expect(transaction2.status).toBe('pending')
  })

  it('should stage updates without modifying the store', () => {
    const countAtom = atom(0)
    const transaction = beginTransaction()

    transaction.set(countAtom, 5)

    expect(transaction.get(countAtom)).toBe(5)
    const { result } = renderHook(() => useAtom(countAtom))
    expect(result.current[0]).toBe(0)
    expect(transaction.status).toBe('pending')
  })

  it('should commit transaction updates to the store', () => {
    const countAtom = atom(0)
    const transaction = beginTransaction()

    transaction.set(countAtom, 5)

    commitTransaction(transaction)

    const { result } = renderHook(() => useAtom(countAtom))
    expect(result.current[0]).toBe(5)

    expect(transaction.status).toBe('committed')
  })

  it('should not alter the store when rolling back a transaction', () => {
    const countAtom = atom(0)
    const transaction = beginTransaction()

    transaction.set(countAtom, 5)

    rollbackTransaction(transaction)

    const { result } = renderHook(() => useAtom(countAtom))
    expect(result.current[0]).toBe(0)

    expect(transaction.status).toBe('rolled-back')
  })

  it('should throw when attempting to modify a committed transaction', () => {
    const countAtom = atom(0)
    const transaction = beginTransaction()

    commitTransaction(transaction)

    expect(() => {
      transaction.set(countAtom, 5)
    }).toThrow('Cannot modify a transaction that is committed')
  })

  it('should throw when attempting to modify a rolled-back transaction', () => {
    const countAtom = atom(0)
    const transaction = beginTransaction()

    rollbackTransaction(transaction)

    expect(() => {
      transaction.set(countAtom, 5)
    }).toThrow('Cannot modify a transaction that is rolled-back')
  })

  it('should call onCommit callback when transaction is committed', () => {
    const countAtom = atom(0)
    const onCommitMock = vi.fn()

    const transaction = beginTransaction({
      onCommit: onCommitMock,
    })

    act(() => {
      transaction.set(countAtom, 5)
      commitTransaction(transaction)
    })

    expect(onCommitMock).toHaveBeenCalledTimes(1)
    expect(transaction.status).toBe('committed')

    const { result } = renderHook(() => useAtom(countAtom))
    expect(result.current[0]).toBe(5)
  })

  it('should call onRollback callback when transaction is rolled back explicitly', () => {
    const countAtom = atom(0)
    const onRollbackMock = vi.fn()

    const transaction = beginTransaction({
      onRollback: onRollbackMock,
    })

    act(() => {
      transaction.set(countAtom, 5)
      rollbackTransaction(transaction)
    })

    expect(onRollbackMock).toHaveBeenCalledTimes(1)
    expect(transaction.status).toBe('rolled-back')

    const { result } = renderHook(() => useAtom(countAtom))
    expect(result.current[0]).toBe(0)
  })

  it('should call onRollback callback when transaction fails and rolls back automatically', () => {
    const countAtom = atom(0)
    const onCommitMock = vi.fn()
    const onRollbackMock = vi.fn()

    const store = createStore()
    const transaction = beginTransaction({
      store,
      onCommit: onCommitMock,
      onRollback: onRollbackMock,
    })

    act(() => {
      transaction.set(countAtom, 5)
    })

    const originalSet = store.set
    store.set = vi.fn().mockImplementation(() => {
      throw new Error('Test error')
    })

    try {
      expect(() => {
        act(() => {
          commitTransaction(transaction)
        })
      }).toThrow('Test error')

      expect(onCommitMock).not.toHaveBeenCalled()
      expect(onRollbackMock).toHaveBeenCalledTimes(1)
      expect(transaction.status).toBe('rolled-back')
    } finally {
      store.set = originalSet
    }
  })

  it('should not call callbacks for transactions without callbacks defined', () => {
    const countAtom = atom(0)

    const transaction = beginTransaction()
    act(() => {
      transaction.set(countAtom, 5)
      commitTransaction(transaction)
    })
    expect(transaction.status).toBe('committed')

    const transaction2 = beginTransaction()
    act(() => {
      transaction2.set(countAtom, 10)
      rollbackTransaction(transaction2)
    })
    expect(transaction2.status).toBe('rolled-back')
  })
})

describe('Multiple Atoms in a Transaction', () => {
  it('should update multiple atoms atomically', () => {
    const countAtom = atom(0)
    const messageAtom = atom('initial')
    const transaction = beginTransaction()

    transaction.set(countAtom, 5)
    transaction.set(messageAtom, 'updated')

    commitTransaction(transaction)

    const countHook = renderHook(() => useAtom(countAtom))
    const messageHook = renderHook(() => useAtom(messageAtom))

    expect(countHook.result.current[0]).toBe(5)
    expect(messageHook.result.current[0]).toBe('updated')
  })

  it('should maintain the original values of all atoms when rolled back', () => {
    const countAtom = atom(0)
    const messageAtom = atom('initial')
    const transaction = beginTransaction()

    transaction.set(countAtom, 5)
    transaction.set(messageAtom, 'updated')

    rollbackTransaction(transaction)

    const countHook = renderHook(() => useAtom(countAtom))
    const messageHook = renderHook(() => useAtom(messageAtom))

    expect(countHook.result.current[0]).toBe(0)
    expect(messageHook.result.current[0]).toBe('initial')
  })
})

describe('Derived Atoms', () => {
  it('should correctly handle derived atoms in transactions', () => {
    const baseAtom = atom(10)
    const derivedAtom = atom((get) => get(baseAtom) * 2)

    const transaction = beginTransaction()
    expect(transaction.get(derivedAtom)).toBe(20)
    transaction.set(baseAtom, 20)

    commitTransaction(transaction)

    const { result } = renderHook(() => useAtom(derivedAtom))
    expect(result.current[0]).toBe(40)
  })

  it('should handle complex dependency chains', () => {
    const aAtom = atom(5)
    const bAtom = atom(10)
    const cAtom = atom((get) => get(aAtom) + get(bAtom))
    const dAtom = atom((get) => get(cAtom) * 2)

    const transaction = beginTransaction()
    transaction.set(aAtom, 15)
    transaction.set(bAtom, 20)

    commitTransaction(transaction)

    const cHook = renderHook(() => useAtom(cAtom))
    const dHook = renderHook(() => useAtom(dAtom))

    expect(cHook.result.current[0]).toBe(35)
    expect(dHook.result.current[0]).toBe(70)
  })
})

describe('Edge Cases', () => {
  it('should handle undefined and null values correctly', () => {
    const nullAtom = atom<string | null>(null)
    const undefinedAtom = atom<string | undefined>(undefined)

    const transaction = beginTransaction()

    expect(transaction.get(nullAtom)).toBe(null)
    expect(transaction.get(undefinedAtom)).toBe(undefined)

    act(() => {
      transaction.set(nullAtom, 'not null')
      transaction.set(undefinedAtom, 'defined now')
    })

    expect(transaction.get(nullAtom)).toBe('not null')
    expect(transaction.get(undefinedAtom)).toBe('defined now')

    const nullHookBefore = renderHook(() => useAtom(nullAtom))
    const undefinedHookBefore = renderHook(() => useAtom(undefinedAtom))
    expect(nullHookBefore.result.current[0]).toBe(null)
    expect(undefinedHookBefore.result.current[0]).toBe(undefined)

    act(() => {
      commitTransaction(transaction)
    })

    const nullHookAfter = renderHook(() => useAtom(nullAtom))
    const undefinedHookAfter = renderHook(() => useAtom(undefinedAtom))
    expect(nullHookAfter.result.current[0]).toBe('not null')
    expect(undefinedHookAfter.result.current[0]).toBe('defined now')
  })

  it('should handle re-staged values correctly', () => {
    const countAtom = atom(0)
    const transaction = beginTransaction()

    transaction.set(countAtom, 5)
    expect(transaction.get(countAtom)).toBe(5)

    transaction.set(countAtom, 10)
    expect(transaction.get(countAtom)).toBe(10)

    commitTransaction(transaction)

    const { result } = renderHook(() => useAtom(countAtom))
    expect(result.current[0]).toBe(10)
  })
})
