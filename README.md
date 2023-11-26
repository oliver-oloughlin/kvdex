# kvdex

`kvdex` is a high-level abstraction layer for Deno KV with zero third-party
dependencies. It's purpose is to enhance the experience of using Deno's KV store
through additional features such as indexing, strongly typed collections and
serialization/compression, while maintaining as much of the native functionality
as possible, like atomic operations and queue listeners.

_Supported Deno verisons:_ **^1.37.0**

## Highlights

- CRUD operations for selected and ranged documents with strong typing.
- Primary (unique) and secondary (non-unique) indexing.
- Extensible model strategy (Zod supported).
- Serialized, compressed and segmented storage for large objects that exceed the
  native size limit.
- Support for pagination and filtering.
- Set intervals built on queues.
- Message queues at database and collection level with topics.
- Support for atomic operations.

## Table of Contents

- [kvdex](#kvdex)
  - [Highlights](#highlights)
  - [Table of Contents](#table-of-contents)
  - [Models](#models)
  - [Database](#database)
  - [Collection Methods](#collection-methods)
    - [find()](#find)
    - [findByPrimaryIndex()](#findbyprimaryindex)
    - [findBySecondaryIndex()](#findbysecondaryindex)
    - [findMany()](#findmany)
    - [findUndelivered()](#findundelivered)
    - [add()](#add)
    - [addMany()](#addmany)
    - [set()](#set)
    - [write()](#write)
    - [update()](#update)
    - [updateByPrimaryIndex()](#updatebyprimaryindex)
    - [updateBySecondaryIndex()](#updatebysecondaryindex)
    - [updateMany()](#updatemany)
    - [delete()](#delete)
    - [deleteByPrimaryIndex()](#deletebyprimaryindex)
    - [deleteBySecondaryIndex()](#deletebysecondaryindex)
    - [deleteMany()](#deletemany)
    - [deleteUndelivered()](#deleteundelivered)
    - [getMany()](#getmany)
    - [forEach()](#foreach)
    - [forEachBySecondaryIndex()](#foreachbysecondaryindex)
    - [map()](#map)
    - [mapBySecondaryIndex()](#mapbysecondaryindex)
    - [count()](#count)
    - [countBySecondaryIndex()](#countbysecondaryindex)
    - [enqueue()](#enqueue)
    - [listenQueue()](#listenqueue)
  - [Serialized Collections](#serialized-collections)
  - [Database Methods](#database-methods)
    - [countAll()](#countall)
    - [deleteAll()](#deleteall)
    - [deleteUndelivered()](#deleteundelivered-1)
    - [findUndelivered()](#findundelivered-1)
    - [enqueue()](#enqueue-1)
    - [listenQueue()](#listenqueue-1)
    - [setInterval()](#setinterval)
    - [loop()](#loop)
    - [atomic()](#atomic)
  - [Atomic Operations](#atomic-operations)
    - [Without checking](#without-checking)
    - [With checking](#with-checking)
  - [Document Methods](#document-methods)
    - [flat()](#flat)
  - [Extensions](#extensions)
    - [Zod](#zod)
      - [zodModel()](#zodmodel)
      - [Kv-Schemas](#kv-schemas)
  - [Development](#development)
  - [License](#license)

## Models

Collections are typed using models. Standard models can be defined using the
`model()` function. Alternatively, any object that implements the Model type can
be used as a model. Zod is therefore compatible, without being a dependency (see
[zodModel()](#zodmodel) for additional support). The standard model uses type
casting only, and does not validate any data when parsing. Asymmetric models can
be created by passing a transform function which maps from an input type to an
output type. Asymmetric models are useful for storing derived values or filling
default values. It is up to the developer to choose the strategy that fits their
use case the best.

**_NOTE_:** When using interfaces instead of types, they must extend the KvValue
type.

Using the standard model strategy:

```ts
import { model } from "https://deno.land/x/kvdex/mod.ts"

type User = {
  username: string
  age: number
  activities: string[]
  address?: {
    country: string
    city: string
    street: string
    houseNumber: number | null
  }
}

// Normal model (equal input and output)
const UserModel = model<User>()

// Asymmetric model (mapped output)
const AsyncUserModel = model((user: User) => ({
  upperCaseUsername: user.username.toUpperCase(),
  ageInDecades: user.age / 10,
  createdAt: new Date(),
}))
```

Using Zod instead:

```ts
import { z } from "https://deno.land/x/zod/mod.ts"

type User = z.infer<typeof UserModel>

const UserSchema = z.object({
  username: z.string(),
  age: z.number(),
  activities: z.array(z.string()),
  address: z.object({
    country: z.string(),
    city: z.string(),
    street: z.string(),
    houseNumber: z.number().nullable(),
  }).optional(),
})
```

## Database

`kvdex()` is used for creating a new database instance. It takes a Deno KV
instance and a schema definition as arguments.

```ts
import { kvdex, model, collection } from "https://deno.land/x/kvdex/mod.ts"

const kv = await Deno.openKv()

const db = kvdex(kv, {
  numbers: collection(model<number>()),
  serializedStrings: collection(model<string>(), {
    serialized: true
  }),
  users: collection(UserSchema, {
    indices: {
      username: "primary" // unique
      age: "secondary" // non-unique
    }
  }),
  // Nested collections
  nested: {
    strings: collection(model<string>()),
  }
})
```

The schema definition contains collection builders, or nested schema
definitions. Collections can hold any type adhering to KvValue. Indexing can be
specified for collections of objects, while a custom id generator and
serialization can be set for all collections.

## Collection Methods

### find()

Retrieve a single document with the given id from the KV store. The id must
adhere to the type KvId. This method takes an optional options argument that can
be used to set the consistency mode.

```ts
const userDoc1 = await db.users.find(123)

const userDoc2 = await db.users.find(123n)

const userDoc3 = await db.users.find("oliver", {
  consistency: "eventual", // "strong" by default
})
```

### findByPrimaryIndex()

Find a document by a primary index.

```ts
// Finds a user document with the username = "oliver"
const userByUsername = await db.users.findByPrimaryIndex("username", "oliver")
```

### findBySecondaryIndex()

Find documents by a secondary index. Secondary indices are not unique, and
therefore the result is an array of documents. The method takes an optional
options argument that can be used for filtering of documents, and pagination.

```ts
// Returns all users with age = 24
const { result } = await db.users.findBySecondaryIndex("age", 24)

// Returns all users with age = 24 AND username that starts with "o"
const { result } = await db.users.findBySecondaryIndex("age", 24, {
  filter: (doc) => doc.value.username.startsWith("o"),
})
```

### findMany()

Retrieve multiple documents with the given array of ids from the KV store. The
ids must adhere to the type KvId. This method takes an optional options argument
that can be used to set the consistency mode.

```ts
const userDocs1 = await db.users.findMany(["abc", 123, 123n])

const userDocs2 = await db.users.findMany(["abc", 123, 123n], {
  consistency: "eventual", // "strong" by default
})
```

### findUndelivered()

Retrieve a document entry that was not delivered during an enqueue() operation
in the collection queue. This method takes an optional options argument that can
be used to set the consistency mode.

```ts
const doc1 = await db.users.findUndelivered("undelivered_id")

const doc2 = await db.users.findUndelivered("undelivered_id", {
  consistency: "eventual", // "strong" by default
})
```

### add()

Add a new document to the KV store with an auto-generated id (uuid). Upon
completion, a CommitResult object will be returned with the document id,
versionstamp and ok flag.

```ts
const result = await db.users.add({
  username: "oliver",
  age: 24,
  activities: ["skiing", "running"],
  address: {
    country: "Norway",
    city: "Bergen",
    street: "Sesame",
    houseNumber: null,
  },
})

if (result.ok) {
  console.log(result.id) // f897e3cf-bd6d-44ac-8c36-d7ab97a82d77
}
```

### addMany()

Add multiple document entries to the KV store with auto-generated ids (uuid).
Upon completion, a list of CommitResult objects will be returned.

```ts
// Adds 5 new document entries to the KV store.
await result = await db.numbers.addMany([1, 2, 3, 4, 5])

// Only adds the first entry, as "username" is defined as a primary index and cannot have duplicates
await result = await db.users.addMany([
  {
    username: "oli",
    age: 24
  },
  {
    username: "oli",
    age: 56
  }
])
```

### set()

Add a new document to the KV store with a given id of type KvId. Upon
completion, a CommitResult object will be returned with the document id,
versionstamp and ok flag. If a document with a matching id already exists in the
collection, the operation will fail.

```ts
const result = await db.numbers.set("id_1", 2048)

if (result.ok) {
  console.log(result.id) // id_1
}
```

### write()

Write a document to the KV store with a given id of type KvId. Sets a new
document entry if no document already exists, overwrites an existing entry if it
does. Upon completion, a CommitResult object will be returned with the document
id, verisonstamp and ok flag. Contrary to update(), this method will only
perform full overwrites, no partial updates. This method will not fail whether
an existing id already exists or not.

```ts
const result1 = await db.numbers.write("id_1", 1024)
const result2 = await db.numbers.write("id_1", 2048)
const doc = await db.numbers.find("id_1")

console.log(doc?.value) // 2048
```

### update()

Update the value of an exisiting document in the KV store. For primitive values,
arrays and built-in objects (Date, RegExp, etc.), this method overwrites the
exisiting data with the new value. For custom objects (Models), this method
performs a partial update, merging the new value with the existing data using
shallow merge by default, or optionally using deep merge. Upon completion, a
CommitResult object will be returned with the document id, versionstamp and ok
flag. If no document with a matching id exists in the collection, the operation
will fail.

```ts
// Updates the document with a new value
const result = await db.numbers.update("num1", 42)

// Partial update using deep merge, only updates the age field
const result = await db.users.update("user1", {
  age: 67,
}, {
  mergeType: "deep",
})
```

### updateByPrimaryIndex()

Update a document by a primary index.

```ts
// Updates a user with username = "oliver" to have age = 56
const result = await db.users.updateByPrimaryIndex("username", "oliver", {
  age: 56,
})

// Updates a user document using deep merge
const result = await db.users.updateByPrimaryIndex("username", "anders", {
  age: 89,
}, {
  mergeType: "deep",
})
```

### updateBySecondaryIndex()

Update documents by a secondary index. It takes an optional options argument
that can be used for filtering of documents to be updated, and pagination. If no
options are given, all documents by the given index value will we updated.

```ts
// Updates all user documents with age = 24 and sets age = 67
const { result } = await db.users.updateBySecondaryIndex("age", 24, { age: 67 })

// Updates all user documents where the user's age is 24 and username starts with "o" using deep merge
const { result } = await db.users.updateBySecondaryIndex(
  "age",
  24,
  { age: 67 },
  {
    filter: (doc) => doc.value.username.startsWith("o"),
    mergeType: "deep",
  },
)
```

### updateMany()

Update the value of multiple existing documents in the KV store. It takes an
optional options argument that can be used for filtering of documents to be
updated, and pagination. If no options are given, "updateMany" will update all
documents in the collection.

```ts
// Updates all user documents and sets age = 67
const { result } = await db.users.updateMany({ age: 67 })

// Updates all user documents using deep merge where the user's age is above 20
const { result } = await db.users.updateMany({ age: 67 }, {
  filter: (doc) => doc.value.age > 20,
  mergeType: "deep",
})

// Only updates first user document, as username is a primary index
const { result } = await db.users.updateMany({ username: "XuserX" })
```

### delete()

Delete one or more documents with the given ids from the KV store.

```ts
await db.users.delete("f897e3cf-bd6d-44ac-8c36-d7ab97a82d77")

await db.users.delete("user1", "user2", "user3")
```

### deleteByPrimaryIndex()

Delete a document by a primary index.

```ts
// Deletes user with username = "oliver"
await db.users.deleteByPrimaryIndex("username", "oliver")
```

### deleteBySecondaryIndex()

Delete documents by a secondary index. The method takes an optional options
argument that can be used for filtering of documents, and pagination.

```ts
// Deletes all users with age = 24
await db.users.deleteBySecondaryIndex("age", 24)

// Deletes all users with age = 24 AND username that starts with "o"
await db.users.deleteBySecondaryIndex("age", 24, {
  filter: (doc) => doc.value.username.startsWith("o"),
})
```

### deleteMany()

Delete multiple documents from the KV store without specifying ids. It takes an
optional options argument that can be used for filtering of documents to be
deleted, and pagination. If no options are given, "deleteMany" will delete all
documents in the collection.

```ts
// Deletes all user documents
await db.users.deleteMany()

// Deletes all user documents where the user's age is above 20
await db.users.deleteMany({
  filter: (doc) => doc.value.age > 20,
})

// Deletes the first 10 user documents in the KV store
await db.users.deleteMany({
  limit: 10,
})

// Deletes the last 10 user documents in the KV store
await db.users.deleteMany({
  limit: 10,
  reverse: true,
})
```

### deleteUndelivered()

Delete an undelivered document entry by id from the collection queue.

```ts
await db.users.deleteUndelivered("id")
```

### getMany()

Retrieve multiple documents from the KV store. It takes an optional options
argument that can be used for filtering of documents to be retrieved, and
pagination. If no options are given, "getMany" will retrieve all documents in
the collection.

```ts
// Retrieves all user documents
const { result } = await db.users.getMany()

// Retrieves all user documents where the user's age is above or equal to 18
const { result } = await db.users.getMany({
  filter: (doc) => doc.value.age >= 18,
})

// Retrieves the first 10 user documents in the KV store
const { result } = await db.users.getMany({
  limit: 10,
})

// Retrieves the last 10 user documents in the KV store
const { result } = await db.users.getMany({
  limit: 10,
  reverse: true,
})
```

### forEach()

Execute a callback function for multiple documents in the KV store. Takes an
optional options argument that can be used for filtering of documents and
pagination. If no options are given, the callback function will be executed for
all documents in the collection.

```ts
// Log the username of every user document
await db.users.forEach((doc) => console.log(doc.value.username))

// Log the username of every user that has "swimming" as an activity
await db.users.forEach((doc) => console.log(doc.value.username), {
  filter: (doc) => doc.value.activities.includes("swimming"),
})

// Log the usernames of the first 10 user documents in the KV store
await db.users.forEach((doc) => console.log(doc.value.username), {
  limit: 10,
})

// Log the usernames of the last 10 user documents in the KV store
await db.users.forEach((doc) => console.log(doc.value.username), {
  limit: 10,
  reverse: true,
})
```

### forEachBySecondaryIndex()

Execute a callback function for documents by a secondary index. Takes an
optional options argument that can be used for filtering of documents and
pagination. If no options are given, the callback function will be executed for
all documents in the collection matching the index.

```ts
// Prints the username of all users where age = 20
await db.users.forEachBySecondaryIndex(
  "age",
  20,
  (doc) => console.log(doc.value.username),
)
```

### map()

Execute a callback function for multiple documents in the KV store and retrieve
the results. It takes an optional options argument that can be used for
filtering of documents and pagination. If no options are given, the callback
function will be executed for all documents in the collection.

```ts
// Get a list of all the ids of the user documents
const { result } = await db.users.map((doc) => doc.id)

// Get a list of all usernames of users with age > 20
const { result } = await db.users.map((doc) => doc.value.username, {
  filter: (doc) => doc.value.age > 20,
})

// Get a list of the usernames of the first 10 users in the KV store
const { result } = await db.users.forEach((doc) => doc.value.username, {
  limit: 10,
})

// Get a list of the usernames of the last 10 users in the KV store
const { result } = await db.users.forEach((doc) => doc.value.username, {
  limit: 10,
  reverse: true,
})
```

### mapBySecondaryIndex()

Executes a callback function for documents by a secondary index and retrieves
the results. It takes an optional options argument that can be used for
filtering of documents and pagination. If no options are given, the callback
function will be executed for all documents matching the index.

```ts
// Returns a list of usernames of all users where age = 20
const { result } = await db.users.mapBySecondaryIndex(
  "age",
  20,
  (doc) => doc.value.username,
)
```

### count()

Count the number of documents in a collection. Takes an optional options
argument that can be used for filtering of documents. If no options are given,
it will count all documents in the collection.

```ts
// Returns the total number of user documents in the KV store
const count = await db.users.count()

// Returns the number of users with age > 20
const count = await db.users.count({
  filter: (doc) => doc.value.age > 20,
})
```

### countBySecondaryIndex()

Counts the number of documents in the collection by a secondary index. Takes an
optional options argument that can be used for filtering of documents. If no
options are given, it will count all documents matching the index.

```ts
// Counts all users where age = 20
const count = await db.users.countBySecondaryIndex("age", 20)
```

### enqueue()

Add data to the collection queue to be delivered to the queue listener via
`db.collection.listenQueue()`. The data will only be received by queue listeners
on the specified collection and topic. The method takes an optional options
argument that can be used to set a delivery delay and topic.

```ts
// Immediate delivery
await db.users.enqueue("some data")

// Delay of 2 seconds before delivery
await db.users.enqueue("cake", {
  delay: 2_000,
  topic: "food",
})
```

### listenQueue()

Listen for data from the collection queue that was enqueued with
`db.collection.enqueue()`. Will only receive data that was enqueued to the
specific collection queue and topic. Expects a handler function as argument, as
well as optional options that can be used to set the topic.

```ts
// Prints the data to console when recevied
db.users.listenQueue((data) => console.log(data))

// Sends post request when data is received
db.users.listenQueue(async (data) => {
  const dataBody = JSON.stringify(data)

  const res = await fetch("...", {
    method: "POST",
    body: data,
  })

  console.log("POSTED:", dataBody, res.ok)
}, { topic: "posts" })
```

## Serialized Collections

Serialized collections can store much larger sized data by serializaing,
compresing and splitting the data across multiple KV entries. There is a
tradeoff between speed and storage efficiency. Custom serialize and compress
functions can be set through the collection options.

```ts
import { collection, kvdex, model } from "https://deno.land/x/kvdex/mod.ts"

type LargeData = {
  location: string
  timestamp: Date
  ...
}

const kv = await Deno.openKv()
const db = kvdex(kv, {
  users: collection(model<LargeData>(), {
    // For default serialization/compression
    serialized: true

    // Set custom serialize/compress functions
    serialized: {
      serialize: ...,
      deserialize: ...,
      compress: ...,
      decompress: ...,
    }
  })
})
```

## Database Methods

These are methods which can be found at the top level of your database object,
and perform operations across multiple collections or unrelated to collections.

### countAll()

Count the total number of documents across all collections. It takes an optional
options argument that can be used to set the consistency mode.

```ts
// Gets the total number of documents in the KV store across all collections
const count = await db.countAll()
```

### deleteAll()

Delete all documents across all collections. It takes an optional options
argument that can be used to set the consistency mode.

```ts
// Deletes all documents in the KV store across all collections
await db.deleteAll()
```

### deleteUndelivered()

Delete an undelivered document entry by id from the database queue.

```ts
await db.deleteUndelivered("id")
```

### findUndelivered()

Retrieve a document entry that was not delivered during an enqueue() operation
in the database queue. This method takes an optional options argument that can
be used to set the consistency mode.

```ts
const doc1 = await db.findUndelivered("undelivered_id")

const doc2 = await db.findUndelivered("undelivered_id", {
  consistency: "eventual", // "strong" by default
})
```

### enqueue()

Add data to the database queue to be delivered to the queue listener via
`db.listenQueue()`. The data will only be received by queue listeners on the
database queue and specified topic. The method takes an optional options
argument that can be used to set a delivery delay and topic.

```ts
// Immediate delivery
await db.enqueue("some data")

// Delay of 2 seconds before delivery
await db.enqueue("cake", {
  delay: 2_000,
  topic: "food",
})
```

### listenQueue()

Listen for data from the database queue that was enqueued with `db.enqueue()`.
Will only receive data that was enqueued to the database queue and specified
topic. Expects a handler function as argument, as well as optional options that
can be used to set the topic.

```ts
// Prints the data to console when recevied
db.listenQueue((data) => console.log(data))

// Sends post request when data is received in the "posts" topic
db.listenQueue(async (data) => {
  const dataBody = JSON.stringify(data)

  const res = await fetch("...", {
    method: "POST",
    body: data,
  })

  console.log("POSTED:", dataBody, res.ok)
}, { topic: "posts" })
```

### setInterval()

Create an interval built on queues that can run indefinitely or until an exit
condition is met. Interval defaults to 1 hour if not set.

```ts
// Will repeat indefinitely with 1 hour interval
db.setInterval(() => console.log("Hello World!"))

// First callback is invoked after a 10 second delay, after that there is a 5 second delay between callbacks
db.setInterval(() => console.log("I terminate after running 10 times"), {
  // Delay before the first callback is invoked
  startDelay: 10_000,

  // Fixed interval of 5 seconds
  interval: 5_000,

  // ...or set a dynamic interval
  interval: ({ count }) => count * 500

  // Count starts at 0, exitOn is run before the current callback
  exitOn: ({ count }) => count === 10,
})
```

### loop()

Create a loop built on queues that can run indefinitely or until an exit
condition is met. In contrast to `setInterval()`, the callback function in a
loop is run sequentially, meaning the next callback is not enqueued until the
previous task finishes.

```ts
// Prints "Hello World!" 10 times, with 1 second delay
db.loop(() => console.log("Hello World!"), {
  delay: 1_000,
  exitOn: ({ count }) => count === 10,
})
```

### atomic()

Initiate an atomic operation. The method takes a selector function as argument
for selecting the initial collection context.

```ts
db.atomic((schema) => schema.users)
```

## Atomic Operations

Atomic operations allow for executing multiple mutations as a single atomic
transaction. This means that documents can be checked for changes before
committing the mutations, in which case the operation will fail. It also ensures
that either all mutations succeed, or they all fail.

To initiate an atomic operation, call "atomic" on the database object. The
method expects a selector for selecting the collection that the subsequent
mutation actions will be performed on. Mutations can be performed on documents
from multiple collections in a single atomic operation by calling "select" at
any point in the building chain to switch the collection context. To execute the
operation, call "commit" at the end of the chain. An atomic operation returns a
Deno.KvCommitResult object if successful, and Deno.KvCommitError if not.

**_NOTE_:** Atomic operations are not available for serialized collections. For
indexable collections, any operations performing deletes will not be truly
atomic in the sense that it performs a single isolated operation. The reason for
this being that the document data must be read before performing the initial
delete operation, to then perform another delete operation for the index
entries. If the initial operation fails, the index entries will not be deleted.
To avoid collisions and errors related to indexing, an atomic operation will
always fail if it is trying to delete and write to the same indexable
collection. It will also fail if trying to set/add a document with colliding
index entries.

### Without checking

```ts
// Deletes and adds an entry to the numbers collection
const result1 = await db
  .atomic((schema) => schema.numbers)
  .delete("id_1")
  .set("id_2", 100)
  .commit()

// Adds 2 new entries to the numbers collection and 1 new entry to the users collection
const result2 = await db
  .atomic((schema) => schema.numbers)
  .add(1)
  .add(2)
  .select((schema) => schema.users)
  .set("user_1", {
    username: "oliver",
    age: 24,
    activities: ["skiing", "running"],
    address: {
      country: "Norway",
      city: "Bergen",
      street: "Sesame",
      houseNumber: 42,
    },
  })
  .commit()

// Will fail and return Deno.KvCommitError because it is trying
// to both add and delete from an indexable collection
const result3 = await db
  .atomic((schema) => schema.users)
  .delete("user_1")
  .set("user_1", {
    username: "oliver",
    age: 24,
    activities: ["skiing", "running"],
    address: {
      country: "Norway",
      city: "Bergen",
      street: "Sesame",
      houseNumber: 42,
    },
  })
  .commit()
```

### With checking

```ts
// Only adds 10 to the value when it has not been changed since being read
let result = null
while (!result || !result.ok) {
  const { id, versionstamp, value } = await db.numbers.find("id")

  result = await db
    .atomic((schema) => schema.numbers)
    .check({
      id,
      versionstamp,
    })
    .set(id, value + 10)
    .commit()
}
```

## Document Methods

These are methods on the Document object which perform actions/mutations on the
document contents.

### flat()

Flatten top layer of document data. Returns an object containing the id,
versionstamp and value entries for documents of type Model, else simply returns
the document data.

```ts
// We assume the document exists in the KV store
const doc = await db.users.find(123n)
const flattened = doc.flat()

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
//   ...value
// }
```

## Extensions

Additional features outside of the basic functionality provided by `kvdex`.
While the basic functions are dependency-free, extended features may rely on
some dependenices to enhance integration. All extensions are found in the
`kvdex/ext/` sub-path.

### Zod

#### zodModel()

Provides additional compatibility when using zod schemas as models. While zod
schemas can be used as models directly, `zodModel()` properly parses a model
from a zod schema, recognizing default fields as optional.

```ts
import { z } from "https://deno.land/x/zod/mod.ts"
import { zodModel } from "https://deno.land/x/kvdex/ext/zod.ts"
import { collection, kvdex } from "https://deno.land/x/kvdex/mod.ts"

const UserSchema = z.object({
  username: z.string(),
  gender: z.string().default("not given"),
})

const kv = await Deno.openKv()

const db = kvdex(kv, {
  users_basic: collection(UserSchema),
  users_zod: collection(zodModel(UserSchema)),
})

// Produces a type error for missing "gender" field.
const result = await db.users_basic.add({
  username: "oliver",
})

// No type error for missing "gender" field.
const result = await db.users_zod.add({
  username: "oliver",
})
```

#### Kv-Schemas

The zod extension provides schemas for some of the Kv-types, such as KvId,
KvValue, KvObject and Kvarray. This makes it easier to properly build your
schemas.

```ts
import { z } from "https://deno.land/x/zod/mod.ts"
import { KvIdSchema } from "https://deno.land/x/kvdex/ext/zod.ts"

const UserSchema = z.object({
  username: z.string(),
  postIds: z.array(KvIdSchema),
})

const PostSchema = z.object({
  text: z.string(),
  userId: KvIdSchema,
})
```

## Development

Any contributions are welcomed and appreciated. How to contribute:

- Clone this repository
- Add feature / Refactor
- Add or refactor tests as needed
- Ensure code quality (check + lint + format + test) using `deno task prep`
- Open Pull Request

This project aims at having as high test coverage as possible to improve code
quality and to avoid breaking features when refactoring. Therefore it is
encouraged that any feature contributions are also accompanied by relevant unit
tests to ensure those features remain stable.

The goal of kvdex is to provide a type safe, higher-level API to Deno KV, while
retaining as much of the native functionality as possible. Additionally, the
core functionality (excluding extensions) should not rely on any third-party
dependencies. Please kleep this in mind when making any contributions.

## License

Published under
[MIT License](https://github.com/oliver-oloughlin/kvdex/blob/main/LICENSE)
