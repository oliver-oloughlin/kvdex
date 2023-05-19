# KVDB
Database wrapper for Deno's KV store.
Simple and type-safe storing/retrieving of data.

Support for indexing.

Zero third-party dependencies.

## Models
For collections of objects, models can be defined by extending the Model type.

```ts
import type { Model } from "https://deno.land/x/kvdb@v1.5.4/mod.ts"

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

## Database
The "kvdb" function is used for creating a new KVDB database instance. It takes a Deno KV instance and a schema builder function as arguments.

```ts
import { kvdb } from "https://deno.land/x/kvdb@v1.5.4/mod.ts"

const kv = await Deno.openKv()

const db = kvdb(kv, builder => ({
  users: builder.collection<User>(["users"]),
  indexableUsers: builder.indexableCollection<User>(["indexableUser"], { username: true }),
  primitives: {
    strings: builder.collection<string>(["primitives", "strings"]),
    bigints: builder.collection<bigint>(["primitives", "bigints"])
  }
}))
```

The schema builder function receives a builder object that is used to create collections. The output of this function should be a schema object containing collections (or sub-schema objects for nesting). When creating a collection, a collection key must be provided, as well as the type of data the collection will store. For indexable collections, an index record specifying which fields entries should be indexed by must also be provided. Standard collections can hold data of any type included in KvValue, this includes primitives like strings and numbers, while indexable collections can only hold data that extends the Model type (Objects). If any two collections have an identical key, the function will throw an error.

## Collection Methods

### Find
The "find" method is used to retrieve a single document with the given id from the KV store. The id must adhere to the type Deno.KvKeyPart. This method also takes an optional options parameter.

```ts
const userDoc1 = await db.users.find(123)

const userDoc2 = await db.users.find(123n)

const userDoc3 = await db.users.find("oliver", {
  consistency: "eventual" // "strong" by default
})
```

### Find Many
The "findMany" method is used to retrieve multiple documents with the given array of ids from the KV store. The ids must adhere to the type KvId. This method, like the "find" method, also takes an optional options parameter.

```ts
const userDocs1 = await db.users.findMany(["abc", 123, 123n])

const userDocs2 = await db.users.findMany(["abc", 123, 123n], {
  consistency: "eventual" // "strong" by default
})
```

### Add
The "add" method is used to add a new document to the KV store. An id of type string (uuid) will be generated for the document. Upon completion, a CommitResult object will be returned with the document id, versionstamp and ok flag.

```ts
const result = await db.users.add({
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

console.log(result.id) // f897e3cf-bd6d-44ac-8c36-d7ab97a82d77
```

### Set
The "set" method is very similar to the "add" method, and is used to add a new document to the KV store with a given id of type KvId. Upon completion, a CommitResult object will be returned with the document id, versionstamp and ok flag.

```ts
const result = await db.primitives.strings.set(2048, "Foo")

console.log(result.id) // 2048
```

### Delete
The "delete" method is used to delete a document with the given id from the KV store.

```ts
await db.users.delete("f897e3cf-bd6d-44ac-8c36-d7ab97a82d77")
```

### Delete Many
The "deleteMany" method is used for deleting multiple documents from the KV store. It takes an optional "options" parameter that can be used for filtering of documents to be deleted. If no options are given, "deleteMany" will delete all documents in the collection.

```ts
// Deletes all user documents
await db.users.deleteMany()

// Deletes all user documents where the user's age is above 20
await db.users.deleteMany({
  filter: doc => doc.value.age > 20
})

// Deletes the first 10 user documents in the KV store
await db.users.deleteMany({
  limit: 10
})

// Deletes the last 10 user documents in the KV store
await db.users.deleteMany({
  limit: 10,
  reverse: true
})
```

### Get Many
The "getMany" method is used for retrieving multiple documents from the KV store. It takes an optional "options" parameter that can be used for filtering of documents to be retrieved. If no options are given, "getMany" will retrieve all documents in the collection.

```ts
// Retrieves all user documents
const allUsers = await db.users.getMany()

// Retrieves all user documents where the user's age is above or equal to 18
const canBasciallyDrinkEverywhereExceptUSA = await db.users.getMany({
  filter: doc => doc.value.age >= 18
})

// Retrieves the first 10 user documents in the KV store
const first10 = await db.users.getMany({
  limit: 10
})

// Retrieves the last 10 user documents in the KV store
const last10 = await db.users.getMany({
  limit: 10,
  reverse: true
})
```

### For Each
The "forEach" method is used for executing a callback function for multiple documents in the KV store. It takes an optional "options" parameter that can be used for filtering of documents. If no options are given, "forEach" will execute the callback function for all documents in the collection.

```ts
// Log the username of every user document
await db.users.forEach(doc => console.log(doc.value.username))

// Log the username of every user that has "swimming" as an activity
await db.users.forEach(doc => console.log(doc.value.username), {
  filter: doc => doc.value.activities.includes("swimming")
})

// Log the usernames of the first 10 user documents in the KV store
await db.users.forEach(doc => console.log(doc.value.username), {
  limit: 10
})

// Log the usernames of the last 10 user documents in the KV store
await db.users.forEach(doc => console.log(doc.value.username), {
  limit: 10,
  reverse: true
})
```

## Indexable Collection Methods
Indexable collections extend the base Collection class and provide all the same methods. Note that add/set methods will always fail if an identical index entry already exists.

### Find By Index
The "findByIndex" method is exclusive to indexable collections and can be used to find a document from the given selection of index values. Note that if the index is not defined when creating the collection, finding by that index value will always return null. 
```ts
// Finds a user document with the username = "oliver"
const userDoc = await db.indexableUsers.findByIndex({
  username: "oliver"
})

// Can select by multiple indices
// It will try to find by each given index and return a single result
const userDoc = await db.indexableUsers.findByIndex({
  username: "oliver",
  age: 24
})

// Will return null as age is not defined as an index.
const notFound = await db.indexableUsers.findByIndex({
  age: 24
})
```

## Atomic Operations
Atomic operations allow for executing multiple mutations as a single atomic transaction. This means that documents can be checked for changes before committing the mutations, in which case the operation will fail. It also ensures that either all mutations succeed, or they all fail. 

To initiate an atomic operation, call "atomic" on the KVDB object. The method expects a selector for selecting the collection that the subsequent mutation actions will be performed on. Mutations can be performed on documents from multiple collections in a single atomic operation by calling "select" at any point in the building chain to switch the collection context. To execute the operation, call "commit" at the end of the chain. An atomic operation returns a Deno.KvCommitResult object if successful, and Deno.KvCommitError if not.

**NOTE:** For indexable collections, any operations performing deletes will not be truly atomic in the sense that it performs a single isolated operation. The reason for this being that the document data must be read before performing the initial delete operation, to then perform another delete operation for the index entries. If the initial operation fails, the index entries will not be deleted. To avoid collisions and errors related to indexing, an atomic operation will always fail if it is trying to delete and write to the same indexable collection. It will also fail if trying to set/add a document with existing index entries.

### Without checking
```ts
// Deletes and adds an entry to the bigints collection
const result1 = await db
  .atomic(schema => schema.primitives.bigints)
  .delete("id_1")
  .set("id_2", 100n)
  .commit()

// Adds 2 new entries to the strings collection and 1 new entry to the users collection
const result2 = await db
  .atomic(schema => schema.primitives.strings)
  .add("s1")
  .add("s2")
  .select(schema => schema.users)
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

// Will fail and return Deno.KvCommitError because it is trying 
// to both add and delete from the indexable collection "indexableUsers"
const result3 = await db
  .atomic(schema => schema.users)
  .delete("user_1")
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
// Only adds 10 to the value when it has not been changed after being read
let result = null
while (!result && !result.ok) {
  const { id, versionstamp, value } = await db.primitives.bigints.find("id")

  result = await db
    .atomic(schema => schema.primitives.bigints)
    .check({
      id,
      versionstamp
    })
    .set(id, value + 10n)
    .commit()
}
```

## Utils
Additional utility functions.

### Flatten
The "flatten" utility function can be used to flatten documents with a value of type Model.
It will only flatten the first layer of the document, meaning the result will be an object containing:
id, versionstamp and all the entries in the document value.

```ts
import { flatten } from "https://deno.land/x/kvdb@v1.5.4/mod.ts"

// We assume the document exists in the KV store
const doc = await db.users.find(123n)

const flattened = flatten(doc)

// Document:
// {
//   id,
//   versionstamp,
//   value
// }

// Flattened:
// {
//   id,
//   versionstamp,
//   ...userDocument.value
// }
```