# jotai-transaction

Atomic transaction support for Jotai state updates.

[![NPM Version](https://img.shields.io/npm/v/jotai-transaction.svg?style=flat)](https://www.npmjs.com/package/jotai-transaction)
[![size](https://img.shields.io/bundlephobia/minzip/jotai-transaction)](https://bundlephobia.com/package/jotai-transaction)
[![License](https://img.shields.io/npm/l/jotai-transaction.svg?style=flat)](https://github.com/jotaijs/jotai-transaction/blob/main/LICENSE)

## Overview

`jotai-transaction` extends Jotai's capabilities to support transactional updates across multiple atoms. This allows you to:

- Group multiple atom updates into a single atomic operation
- Stage changes without affecting the UI until explicitly committed
- Roll back changes if an error occurs or conditions aren't met
- Handle complex state transitions where partial updates would leave an inconsistent state

## Installation

```bash
# npm
npm install jotai-transaction

# yarn
yarn add jotai-transaction
```

## Basic Usage

```jsx
import { atom, useAtom } from 'jotai';
import { beginTransaction, commitTransaction, rollbackTransaction } from 'jotai-transaction';

// Define your atoms
const countAtom = atom(0);
const messageAtom = atom('hello');

function MyComponent() {
  const [count, setCount] = useAtom(countAtom);
  const [message, setMessage] = useAtom(messageAtom);

  const handleSubmit = () => {
    // Start a transaction
    const transaction = beginTransaction();
    
    // Stage changes (these won't update the UI yet)
    transaction.set(countAtom, count + 1);
    transaction.set(messageAtom, `Updated ${count + 1} times`);
    
    // Commit the changes as a single atomic operation
    commitTransaction(transaction);
  };

  const handleOptimisticUpdate = async () => {
    // Start a transaction for an optimistic UI update
    const transaction = beginTransaction();
    
    // Stage optimistic changes
    transaction.set(countAtom, count + 1);
    transaction.set(messageAtom, `Optimistically updated!`);
    
    // Commit the changes (UI updates immediately)
    commitTransaction(transaction);
    
    try {
      // Attempt the actual API update
      await saveToApi(count + 1);
    } catch (error) {
      // If the API call fails, we can create a new transaction to revert
      const revertTransaction = beginTransaction();
      revertTransaction.set(countAtom, count);
      revertTransaction.set(messageAtom, message);
      commitTransaction(revertTransaction);
      
      // Show error to user
      alert('Failed to save. Changes reverted.');
    }
  };
  
  // ...
}
```

## React Hook Support

```jsx
import { atom, useAtom } from 'jotai';
import { useTransaction } from 'jotai-transaction';

// Define your atoms
const formAtom = atom({ name: '', email: '', age: 0 });
const formStatusAtom = atom('idle');

function FormComponent() {
  const [form, setForm] = useAtom(formAtom);
  const [status, setStatus] = useAtom(formStatusAtom);
  
  // Create a transaction with callbacks
  const transaction = useTransaction({
    onCommit: () => console.log('Transaction committed successfully'),
    onRollback: () => console.log('Transaction rolled back')
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Stage form submission state
    transaction.set(formStatusAtom, 'submitting');
    transaction.set(formAtom, { ...form, name: form.name.trim() });
    
    try {
      // Validate form
      if (!form.email.includes('@')) {
        throw new Error('Invalid email');
      }
      
      // Commit staged changes
      commitTransaction(transaction);
      
      // Proceed with API submission
      await submitToApi(transaction.get(formAtom));
      
      // Update status in a new transaction
      const successTransaction = beginTransaction();
      successTransaction.set(formStatusAtom, 'success');
      commitTransaction(successTransaction);
    } catch (error) {
      // Roll back on error
      rollbackTransaction(transaction);
      
      // Show error
      alert(error.message);
    }
  };
  
  // ...
}
```

## API Reference

### `beginTransaction(options?)`

Creates a new transaction for staging atom updates.

**Options:**
- `store?`: Custom Jotai store (uses default store if not provided)
- `onCommit?`: Callback function to run when transaction is committed
- `onRollback?`: Callback function to run when transaction is rolled back
- `label?`: Optional label for the transaction (useful for debugging)

**Returns:** A Transaction object with the following properties:
- `id`: Unique identifier for the transaction
- `status`: Current status ('pending', 'committed', or 'rolled-back')
- `set(atom, value)`: Method to stage an update to an atom
- `get(atom)`: Method to get the current or staged value of an atom

### `commitTransaction(transaction)`

Applies all staged changes in the transaction to the store.

### `rollbackTransaction(transaction)`

Discards all staged changes in the transaction.

### `useTransaction(options?)`

React hook for creating transactions. Takes the same options as `beginTransaction`.

### `useTransactionStatus()`

React hook for monitoring transaction status.

**Returns:**
- `activeTransactions`: Array of IDs for active transactions
- `isTransactionActive`: Boolean indicating if any transactions are active
- `registerTransaction(id)`: Method to register a transaction
- `unregisterTransaction(id)`: Method to unregister a transaction

## Advanced Usage

### Working with Derived Atoms

Transactions correctly handle derived atoms by recalculating their values based on staged primitive atom updates:

```jsx
import { atom } from 'jotai';
import { beginTransaction, commitTransaction } from 'jotai-transaction';

const countAtom = atom(0);
const doubleAtom = atom((get) => get(countAtom) * 2);

// Start a transaction
const transaction = beginTransaction();

// Stage update to count
transaction.set(countAtom, 5);

// The derived value is calculated correctly within the transaction
console.log(transaction.get(doubleAtom)); // Output: 10

// But the UI won't update until committed
commitTransaction(transaction);
```

### Custom Stores

Transactions work with custom Jotai stores:

```jsx
import { createStore } from 'jotai';
import { beginTransaction, commitTransaction } from 'jotai-transaction';

// Create a custom store
const myStore = createStore();

// Create a transaction for the custom store
const transaction = beginTransaction({ store: myStore });

// ... use the transaction with atoms from this store
```
