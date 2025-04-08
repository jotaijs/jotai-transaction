# jotai-transaction

Atomic transaction support for Jotai state updates.

## Overview

`jotai-transaction` extends [Jotai](https://github.com/pmndrs/jotai)'s capabilities to support transactional updates across multiple atoms. This allows you to:

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

const countAtom = atom(0);
const messageAtom = atom('hello');

function MyComponent() {
  const [count, setCount] = useAtom(countAtom);
  const [message, setMessage] = useAtom(messageAtom);

  const handleSubmit = () => {
    const transaction = beginTransaction();
    
    // Stage changes (these won't update the UI yet)
    transaction.set(countAtom, count + 1);
    transaction.set(messageAtom, `Updated ${count + 1} times`);
    
    commitTransaction(transaction);
  };
}
```

## React Hook Support

```jsx
import { atom, useAtom } from 'jotai';
import { useTransaction } from 'jotai-transaction';

const formAtom = atom({ name: '', email: '', age: 0 });
const formStatusAtom = atom('idle');

function FormComponent() {
  const [form, setForm] = useAtom(formAtom);
  const [status, setStatus] = useAtom(formStatusAtom);
  
  const transaction = useTransaction({
    onCommit: () => console.log('Transaction committed successfully'),
    onRollback: () => console.log('Transaction rolled back')
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    transaction.set(formStatusAtom, 'submitting');
    transaction.set(formAtom, { ...form, name: form.name.trim() });
    
    try {
      commitTransaction(transaction);
      
      await submitToApi(transaction.get(formAtom));
      
      const successTransaction = beginTransaction();
      successTransaction.set(formStatusAtom, 'success');
      commitTransaction(successTransaction);
    } catch (error) {
      rollbackTransaction(transaction);
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

const transaction = beginTransaction();
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

const myStore = createStore();
const transaction = beginTransaction({ store: myStore });
```
