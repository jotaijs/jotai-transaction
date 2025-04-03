import { act, cleanup, renderHook } from '@testing-library/react'
import { atom, useAtom } from 'jotai'
import { afterEach, describe, expect, it } from 'vitest'
import {
  beginTransaction,
  commitTransaction,
  useTransaction,
  useTransactionStatus,
} from '../src'

afterEach(() => {
  cleanup()
})

describe('React Hooks Integration', () => {
  it('should provide a transaction via useTransaction hook', () => {
    const { result } = renderHook(() => useTransaction())

    expect(result.current).toBeDefined()
    expect(result.current.id).toBeDefined()
    expect(result.current.status).toBe('pending')
    expect(typeof result.current.set).toBe('function')
    expect(typeof result.current.get).toBe('function')
  })

  it('should track transaction status via useTransactionStatus', () => {
    const { result } = renderHook(() => useTransactionStatus())

    expect(result.current.activeTransactions).toEqual([])
    expect(result.current.isTransactionActive).toBe(false)
    expect(typeof result.current.registerTransaction).toBe('function')
    expect(typeof result.current.unregisterTransaction).toBe('function')
  })

  it('should update transaction status when transactions are created and completed', () => {
    const { result } = renderHook(() => useTransactionStatus())

    expect(result.current.activeTransactions.length).toBe(0)

    act(() => {
      const transaction = beginTransaction()
      result.current.registerTransaction(transaction.id)
    })

    expect(result.current.activeTransactions.length).toBe(1)
    expect(result.current.isTransactionActive).toBe(true)

    act(() => {
      result.current.unregisterTransaction(
        result.current.activeTransactions[0]!,
      )
    })

    expect(result.current.activeTransactions.length).toBe(0)
    expect(result.current.isTransactionActive).toBe(false)
  })

  it('should integrate with component state updates', () => {
    const countAtom = atom(0)

    const atomHook = renderHook(() => useAtom(countAtom))
    expect(atomHook.result.current[0]).toBe(0)

    const transactionHook = renderHook(() => useTransaction())

    act(() => {
      transactionHook.result.current.set(countAtom, 10)

      commitTransaction(transactionHook.result.current)
    })

    atomHook.rerender()
    expect(atomHook.result.current[0]).toBe(10)
  })
})
