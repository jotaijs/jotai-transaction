import { act } from '@testing-library/react'
import { atom } from 'jotai'
import { createStore, getDefaultStore } from 'jotai/vanilla'
import { describe, expect, it } from 'vitest'
import { beginTransaction, commitTransaction } from '../src'

describe('Custom Store Support', () => {
  it('should work with a custom store', () => {
    const countAtom = atom(0)
    const customStore = createStore()

    const transaction = beginTransaction({ store: customStore })
    transaction.set(countAtom, 5)
    commitTransaction(transaction)

    expect(customStore.get(countAtom)).toBe(5)
  })

  it('should isolate transactions between different stores', () => {
    const countAtom = atom(0)
    const store1 = createStore()
    const store2 = createStore()

    const transaction1 = beginTransaction({ store: store1 })
    const transaction2 = beginTransaction({ store: store2 })

    transaction1.set(countAtom, 5)
    transaction2.set(countAtom, 10)

    commitTransaction(transaction1)
    commitTransaction(transaction2)

    expect(store1.get(countAtom)).toBe(5)
    expect(store2.get(countAtom)).toBe(10)
  })

  it('should handle multiple transactions on the same store', () => {
    const countAtom = atom(0)
    const messageAtom = atom('initial')
    const store = createStore()

    const transaction1 = beginTransaction({ store })
    transaction1.set(countAtom, 5)
    commitTransaction(transaction1)

    const transaction2 = beginTransaction({ store })
    transaction2.set(messageAtom, 'updated')
    commitTransaction(transaction2)

    expect(store.get(countAtom)).toBe(5)
    expect(store.get(messageAtom)).toBe('updated')
  })

  it('should use the default store when no store is provided', () => {
    const countAtom = atom(0)
    const defaultStore = getDefaultStore()
    const transaction = beginTransaction()

    act(() => {
      transaction.set(countAtom, 5)
      commitTransaction(transaction)
    })

    expect(defaultStore.get(countAtom)).toBe(5)
    act(() => {
      defaultStore.set(countAtom, 0)
    })
  })
})
