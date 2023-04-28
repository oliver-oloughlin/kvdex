# KVDB - Wrapper for Deno KV Store
Simple library for storing/retrieving documents in Deno's KV store.

Has no dependencies.

## Models
Models can be defined by extending the Model type.

```ts
import type { Model } from "https://deno.land/x/kvdb@v1.0.0/mod.ts"

interface User extends Model {
  username: string,
  age: number,
  activities: string[],
  address: {
    country: string,
    city: string,
    street: string,
    houseNumber: number
  }
}
```

## Collections
A Collection contains all database functions for dealing with a collection of documents. The Collection class should be initialized with a Model type parameter and the key for the specific collection. The key must be an array of strings.

```ts
import { Collection } from "https://deno.land/x/kvdb@v1.0.0/mod.ts"

const users = new Collection<User>(["users"])
```

### Find
The "find" method is used to retrieve a single document with the given id from the KV store. The id must be of type Deno.KvKeyPart.

```ts
const user1 = await users.find(123)
const user2 = await users.find(123n)
const oliver = await users.find("oliver")
```

### Add
The "add" method is used to add a new document to the KV store. An id of type string (uuid) will be generated for the document and returned upon completion.

```ts
const id = await users.add({
  username: "oliver",
  age: 24,
  activities: ["skiing", "running"],
  address: {
    country: "Norway",
    city: "Bergen",
    street: "Sesame",
    houseNumber: 42
  }
})

console.log(id) // f897e3cf-bd6d-44ac-8c36-d7ab97a82d77
```

### Set
The "set" method is very similar to the "add" method, and is used to add a new document to the KV store with a given id. The id is returned upon completion.

```ts
const id = await users.add({
  id: 95700400,
  username: "oliver",
  age: 24,
  activities: ["skiing", "running"],
  address: {
    country: "Norway",
    city: "Bergen",
    street: "Sesame",
    houseNumber: 42
  }
})

console.log(id) // 95700400
```

### Delete
The "delete" method is used to delete a document with the given id from the KV store.

```ts
await users.delete("oliver")
```

### Delete Many
The "deleteMany" method is used for deleting multiple documents from the KV store. It takes an optional "options" parameter that can be used for filtering of documents to be deleted. If no options are given, "deleteMany" will delete all documents in the collection.

```ts
// Deletes all users
await users.deleteMany()

// Deletes all users with age above 20
await users.deleteMany({
  filter: user => user.age > 20
})

// Deletes the first 10 users in the KV store
await users.deleteMany({
  limit: 10
})

// Deletes the last 10 users in the KV store
await users.deleteMany({
  limit: 10,
  reverse: true
})
```

### Get Many
The "getMany" method is used for retrieving multiple documents from the KV store. It takes an optional "options" parameter that can be used for filtering of documents to be retrieved. If no options are given, "getMany" will retrieve all documents in the collection.

```ts
// Retrieves all users
const allUsers = await users.getMany()

// Retrieves all users with age above or equal to 18
const canBasciallyDrinkEverywhereExceptUSA = await users.getMany({
  filter: user => user.age >= 18
})

// Retrieves the first 10 users in the KV store
const first10 = await users.getMany({
  limit: 10
})

// Retrieves the last 10 users in the KV store
const last10 = await users.getMany({
  limit: 10,
  reverse: true
})
```

### For Each
The "forEach" method is used for executing a callback function for multiple documents in the KV store. It takes an optional "options" parameter that can be used for filtering of documents. If no options are given, "forEach" will execute the callback function for all documents in the collection.

```ts
// Log the username of every user document
await users.forEach(user => console.log(user.username))

// Log the username of user that has "swimming" as an activity
await users.forEach(user => console.log(user.username), {
  filter: user => user.activities.includes("swimming")
})

// Log the usernames of the first 10 users in the KV store
await users.forEach(user => console.log(user.username), {
  limit: 10
})

// Log the usernames of the last 10 users in the KV store
await users.forEach(user => console.log(user.username), {
  limit: 10,
  reverse: true
})
```