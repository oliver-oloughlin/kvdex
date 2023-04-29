# KVDB
Simple library for storing/retrieving documents in Deno's KV store.

Has no dependencies.

## Models
For collections of objects, models can be defined by extending the KvObject type. Collections can contain any type adhering to the type KvValue, this includes objects, arrays and primitive values.

```ts
import type { KvObject } from "https://deno.land/x/kvdb@v1.3.0/mod.ts"

interface User extends KvObject {
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
A Collection contains all methods for dealing with a collection of documents. A new collection is created using the "collection" method with a type parameter adhering KvValue and the key for the specific collection. The key must be of type Deno.KvKey.

```ts
import { collection } from "https://deno.land/x/kvdb@v1.3.0/mod.ts"

const users = collection<User>(["users"])
const strings = collection<string>(["strings"])
const bigints = collection<bigint>(["bigints"])
```

## Database
The "kvdb" method is used for creating a new KVDB database object. It expects a Schema object containing keys to collections (or other Schema objects for nesting). Wrapping collections inside this object is optional, but is the only way of accessing atomic operations. The collection keys are not constrained to match the object hierachy, but for safety and consistency it is advised to keep them matched.

```ts
import { kvdb } from "https://deno.land/x/kvdb@v1.3.0/mod.ts"

const kvdb = kvdb({
  users: collection<User>(["users"]),
  primitives: {
    strings: collection<string>(["primitives", "strings"]),
    bigints: collection<bigint>(["bigints", "bigints"])
  }
})
```

## Collection Methods

### Find
The "find" method is used to retrieve a single document with the given id from the KV store. The id must adhere to the type Deno.KvKeyPart. This method also takes an optional options argument to control the consistency level.

```ts
const user1 = await kvdb.users.find(123)

const user2 = await kvdb.users.find(123n)

const oliver = await kvdb.users.find("oliver", {
  consistency: "eventual" // "strong" by default
})
```

### Add
The "add" method is used to add a new document to the KV store. An id of type string (uuid) will be generated for the document. Upon completion a CommitResult object will be returned with the document id and versionstamp.

```ts
const { id, versionstamp } = await kvdb.users.add({
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
The "set" method is very similar to the "add" method, and is used to add a new document to the KV store with a given id of type Deno.KvKeyPart. Upon completion a CommitResult object will be returned with the document id and versionstamp.

```ts
const { id, versionstamp } = await kvdb.primitives.strings.set(2048, "Foo")

console.log(id) // 2048
```

### Delete
The "delete" method is used to delete a document with the given id from the KV store.

```ts
await kvdb.users.delete("f897e3cf-bd6d-44ac-8c36-d7ab97a82d77")
```

### Delete Many
The "deleteMany" method is used for deleting multiple documents from the KV store. It takes an optional "options" parameter that can be used for filtering of documents to be deleted. If no options are given, "deleteMany" will delete all documents in the collection.

```ts
// Deletes all users
await kvdb.users.deleteMany()

// Deletes all users with age above 20
await kvdb.users.deleteMany({
  filter: user => user.age > 20
})

// Deletes the first 10 users in the KV store
await kvdb.users.deleteMany({
  limit: 10
})

// Deletes the last 10 users in the KV store
await kvdb.users.deleteMany({
  limit: 10,
  reverse: true
})
```

### Get Many
The "getMany" method is used for retrieving multiple documents from the KV store. It takes an optional "options" parameter that can be used for filtering of documents to be retrieved. If no options are given, "getMany" will retrieve all documents in the collection.

```ts
// Retrieves all users
const allUsers = await kvdb.users.getMany()

// Retrieves all users with age above or equal to 18
const canBasciallyDrinkEverywhereExceptUSA = await kvdb.users.getMany({
  filter: user => user.age >= 18
})

// Retrieves the first 10 users in the KV store
const first10 = await kvdb.users.getMany({
  limit: 10
})

// Retrieves the last 10 users in the KV store
const last10 = await kvdb.users.getMany({
  limit: 10,
  reverse: true
})
```

### For Each
The "forEach" method is used for executing a callback function for multiple documents in the KV store. It takes an optional "options" parameter that can be used for filtering of documents. If no options are given, "forEach" will execute the callback function for all documents in the collection.

```ts
// Log the username of every user document
await kvdb.users.forEach(user => console.log(user.username))

// Log the username of user that has "swimming" as an activity
await kvdb.users.forEach(user => console.log(user.username), {
  filter: user => user.activities.includes("swimming")
})

// Log the usernames of the first 10 users in the KV store
await kvdb.users.forEach(user => console.log(user.username), {
  limit: 10
})

// Log the usernames of the last 10 users in the KV store
await kvdb.users.forEach(user => console.log(user.username), {
  limit: 10,
  reverse: true
})
```

## Atomic Operations
Atomic operations allow for executing multiple mutations as a single atomic transaction. This means that documents can be checked for changes before committing the mutations, in which case the operation will fail. It also ensures that either all mutations succeed, or they all fail. 

To initiate an atomic operation, call "atomic" on the KVDB object. The method expects a selector for selecting the collection that the subsequent mutation actions will be performed on. Mutations can be performed on documents from multiple collections in a single atomic operation by calling "select" at any point in the building chain to switch the collection context. To execute the operation, call "commit" at the end of the chain. An atomic operation returns a AtomicCommitResult object containing a versionstamp.

### Without checking
```ts
// Deletes and adds an entry to the bigints collection
const { versionstamp } = await kvdb
  .atomic(collections => collections.primitives.bigints)
  .delete("id_1")
  .set("id_2", 100n)
  .commit()

// Adds 2 new entries to the strings collection and 1 new entry to the users collection
const { versionstamp } = await kvdb
  .atomic(collections => collections.primitives.strings)
  .add("s1")
  .add("s2")
  .select(collections => collections.users)
  .set("user_1", {
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
  .commit()
```

### With checking
```ts
// Only adds 10 to the entry value when it has not been changed since it was read
let result = null
while (!result) {
  const { id, versionstamp, value } = await kvdb.primitives.bigints.find("id")

  result = await kvdb
    .atomic(collections => collections.primitives.bigints)
    .check({
      id,
      versionstamp
    })
    .set(id, value + 10n)
    .commit()
}
```