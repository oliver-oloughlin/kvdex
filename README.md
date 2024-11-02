# kvdex

[![Release](https://img.shields.io/github/release/oliver-oloughlin/kvdex)](https://github.com/oliver-oloughlin/kvdex/releases)
[![Score](https://jsr.io/badges/@olli/kvdex/score)](https://jsr.io/@olli/kvdex/score)
[![Tests](https://img.shields.io/github/actions/workflow/status/oliver-oloughlin/kvdex/test.yml?label=tests)](https://github.com/oliver-oloughlin/kvdex/actions/workflows/test.yml)
[![License](https://img.shields.io/github/license/oliver-oloughlin/kvdex)](https://github.com/oliver-oloughlin/kvdex/blob/main/LICENSE)

`kvdex` is a high-level abstraction layer for Deno KV with zero third-party
dependencies by default. It's purpose is to enhance the experience of using
Deno's KV store through additional features such as indexing, strongly typed
collections and serialization/compression, while maintaining as much of the
native functionality as possible, like atomic operations, real-time data updates
and queue listeners. Also works with other runtimes such as Node.js and Bun.

_Supported Deno verisons:_ **^1.43.0**

## Highlights

- Strongly typed CRUD operations for selected and ranged documents.
- Primary (unique) and secondary (non-unique) indexing.
- Extensible model strategy (Zod supported).
- Serialized, compressed and segmented storage for large objects.
- Listen to real-time data updates.
- Support for pagination and filtering.
- Message queues at database and collection level with topics.
- Support for atomic operations.

## Table of Contents

- [kvdex](#kvdex)
  - [Highlights](#highlights)
  - [Table of Contents](#table-of-contents)
  - [Models](#models)
  - [Database](#database)
  - [Collection Options](#collection-options)
    - [`idGenerator`](#idgenerator)
    - [`indices`](#indices)
    - [`encoder`](#encoder)
    - [`history`](#history)
  - [Collection Methods](#collection-methods)
    - [find()](#find)
    - [findByPrimaryIndex()](#findbyprimaryindex)
    - [findBySecondaryIndex()](#findbysecondaryindex)
    - [findMany()](#findmany)
    - [findHistory()](#findhistory)
    - [findUndelivered()](#findundelivered)
    - [add()](#add)
    - [addMany()](#addmany)
    - [set()](#set)
    - [update()](#update)
    - [updateByPrimaryIndex()](#updatebyprimaryindex)
    - [updateBySecondaryIndex()](#updatebysecondaryindex)
    - [updateMany()](#updatemany)
    - [updateManyBySecondaryOrder()](#updatemanybysecondaryorder)
    - [updateOne()](#updateone)
    - [updateOneBySecondaryIndex()](#updateonebysecondaryindex)
    - [updateOneBySecondaryOrder()](#updateonebysecondaryorder)
    - [upsert()](#upsert)
    - [upsertByPrimaryIndex()](#upsertbyprimaryindex)
    - [delete()](#delete)
    - [deleteByPrimaryIndex()](#deletebyprimaryindex)
    - [deleteBySecondaryIndex()](#deletebysecondaryindex)
    - [deleteMany()](#deletemany)
    - [deleteManyBySecondaryOrder()](#deletemanybysecondaryorder)
    - [deleteHistory()](#deletehistory)
    - [deleteUndelivered()](#deleteundelivered)
    - [getMany()](#getmany)
    - [getManyBySecondaryOrder()](#getmanybysecondaryorder)
    - [getOne()](#getone)
    - [getOneBySecondaryIndex()](#getonebysecondaryindex)
    - [getOneBySecondaryOrder()](#getonebysecondaryorder)
    - [forEach()](#foreach)
    - [forEachBySecondaryIndex()](#foreachbysecondaryindex)
    - [forEachBySecondaryOrder()](#foreachbysecondaryorder)
    - [map()](#map)
    - [mapBySecondaryIndex()](#mapbysecondaryindex)
    - [mapBySecondaryOrder()](#mapbysecondaryorder)
    - [count()](#count)
    - [countBySecondaryIndex()](#countbysecondaryindex)
    - [countBySecondaryOrder()](#countbysecondaryorder)
    - [enqueue()](#enqueue)
    - [listenQueue()](#listenqueue)
    - [watch()](#watch)
    - [watchMany()](#watchmany)
  - [Database Methods](#database-methods)
    - [countAll()](#countall)
    - [deleteAll()](#deleteall)
    - [wipe()](#wipe)
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
    - [Encoding](#encoding)
      - [JSON](#json)
      - [V8](#v8)
      - [Brotli](#brotli)
    - [Zod](#zod)
      - [Schemas](#schemas)
    - [Migrate](#migrate)
      - [Script](#script)
      - [Function](#function)
    - [KV](#kv)
  - [Blob Storage](#blob-storage)
  - [Development](#development)
  - [License](#license)

## Models

Collections are typed using models. Standard models can be defined using the
`model()` function. Alternatively, any object that is compatible with the Model
type can be used as a model. Zod is therefore supported, without being a
dependency. The standard model uses type casting only, and does not validate any
data when parsing. Asymmetric models can be created by passing a transform
function which maps from an input type to an output type. Asymmetric models are
useful for storing derived values or filling default values. It is up to the
developer to choose the strategy that fits their use case the best.

**_NOTE_:** When using interfaces instead of types, they must extend the KvValue
type.

Using the standard model strategy:

```ts
import { model } from "jsr:@olli/kvdex";

type User = {
  username: string;
  age: number;
  activities: string[];
  address?: {
    country: string;
    city: string;
    street: string;
    houseNumber: number | null;
  };
};

// Normal model (equal input and output)
const UserModel = model<User>();

// Asymmetric model (mapped output)
const UserModel = model((user: User) => ({
  upperCaseUsername: user.username.toUpperCase(),
  ageInDecades: user.age / 10,
  createdAt: new Date(),
}));
```

Using Zod instead:

```ts
import { z } from "npm:zod";

type User = z.infer<typeof UserModel>;

const UserModel = z.object({
  username: z.string(),
  age: z.number(),
  activities: z.array(z.string()),
  address: z.object({
    country: z.string(),
    city: z.string(),
    street: z.string(),
    houseNumber: z.number().nullable(),
  }).optional(),
});
```

## Database

`kvdex()` is used for creating a new database instance. It takes a Deno KV
instance and a schema definition as arguments.

```ts
import { kvdex, model, collection } from "jsr:@olli/kvdex"
import { jsonEncoder } from "jsr:@olli/kvdex/encoding/json"

const kv = await Deno.openKv()

const db = kvdex(kv, {
  numbers: collection(model<number>()),
  serializedStrings: collection(model<string>(), {
    encoder: jsonEncoder()
  }),
  users: collection(UserModel, {
    history: true,
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
definitions. Collections can hold any type adhering to KvValue.

**Note:** Index values are always serialized, using the JSON-encoder by default,
or alternatively your provided encoder.

## Collection Options

These are all the options available for the `collection()` method, used when
defining collections of documents. All collection options are optional.

### `idGenerator`

Override the default id generator, which is used to automatically generate an id
when adding a new document. The id generatror gets called with the data being
added, which can be useful to create derived ids. The default id generator uses
[`ulid()`](https://deno.land/std/ulid/mod.ts) from Deno's
[standard library.](https://deno.land/std/ulid/mod.ts)

Id created from the data being added:

```ts
import { collection, kvdex, model } from "jsr:@olli/kvdex";

const kv = await Deno.openKv();

const db = kvdex(kv, {
  users: collection(model<User>(), {
    idGenerator: (user) => user.username,
  }),
});
```

Using randomely generated uuids:

```ts
import { collection, kvdex, model } from "jsr:@olli/kvdex";

const kv = await Deno.openKv();

const db = kvdex(kv, {
  users: collection(model<User>(), {
    idGenerator: () => crypto.randomUUID(),
  }),
});
```

### `indices`

Define indices for collections of objects. Used to optimize operations by
querying data based on index values.

**NOTE:** Index values are always serialized.

```ts
import { collection, kvdex, model } from "jsr:@olli/kvdex";

const kv = await Deno.openKv();

const db = kvdex(kv, {
  users: collection(model<User>(), {
    indices: {
      username: "primary", // unique
      age: "secondary", // non-unique
    },
  }),
});
```

### `encoder`

Specify serialization and compression for the collection. This lets large
objects that exceed the native size limit of 64kb to be stored, by serializing,
compressing and dividing the value across multiple key/value entries. When an
encoder is specified, there is a tradeoff between speed and storage efficiency.
For storing objects larger than the atomic operation size limit, see
[Blob Storage](#blob-storage).

```ts
import { kvdex, collection, model } from "jsr:@olli/kvdex"
import { jsonEncoder } from "jsr:@olli/kvdex/encoding/json"
import { v8Encoder } from "jsr:@olli/kvdex/encoding/v8"
import { brotliCompression } from "jsr:@olli/kvdex/encoding/brotli"

const kv = await Deno.openKv()

const db = kvdex(kv, {
  users: collection(model<User>(), {
    // JSON-encoder without compression (best runtime compatibility)
    encoder: jsonEncoder(),

    // JSON-encoder + Brotli compression (requires node:zlib built-in)
    encoder: jsonEncoder({ compression: brotliCompression() }),

    // V8-encoder without brotli compression (requires node:v8 built-in)
    encoder: v8Encoder()

    // V8-encoder + brotli compression (requires node:v8 and node:zlib built-in)
    encoder: v8Encoder({ compression: brotliCompression() })

    // Set custom serialize, deserialize, compress and decompress functions
    encoder: {
      serializer: {
        serialize: ...,
        deserialize: ...,
      },
      // optional
      compressor: {
        compress: ...,
        decompress: ...,
      }
    }
  }),
})
```

### `history`

Set to `true` to enable version history. Default is `false`.

```ts
import { collection, kvdex, model } from "jsr:@olli/kvdex";

const kv = await Deno.openKv();

const db = kvdex(kv, {
  users: collection(model<User>(), {
    history: true,
  }),
});
```

## Collection Methods

### find()

Retrieve a single document with the given id from the KV store. The id must
adhere to the type KvId. This method takes an optional options argument that can
be used to set the consistency mode.

```ts
const userDoc1 = await db.users.find(123);

const userDoc2 = await db.users.find(123n);

const userDoc3 = await db.users.find("oliver", {
  consistency: "eventual", // "strong" by default
});
```

### findByPrimaryIndex()

Find a document by a primary index.

```ts
// Finds a user document with the username = "oliver"
const userByUsername = await db.users.findByPrimaryIndex("username", "oliver");
```

### findBySecondaryIndex()

Find documents by a secondary index. Secondary indices are not unique, and
therefore the result is an array of documents. The method takes an optional
options argument that can be used for filtering of documents, and pagination.

```ts
// Returns all users with age = 24
const { result } = await db.users.findBySecondaryIndex("age", 24);

// Returns all users with age = 24 AND username that starts with "o"
const { result } = await db.users.findBySecondaryIndex("age", 24, {
  filter: (doc) => doc.value.username.startsWith("o"),
});
```

### findMany()

Retrieve multiple documents with the given array of ids from the KV store. The
ids must adhere to the type KvId. This method takes an optional options argument
that can be used to set the consistency mode.

```ts
const userDocs1 = await db.users.findMany(["abc", 123, 123n]);

const userDocs2 = await db.users.findMany(["abc", 123, 123n], {
  consistency: "eventual", // "strong" by default
});
```

### findHistory()

Retrieve the version history of a document by id. A history entry contains a
timestamp, type of either "write" or "delete", and a copy of the document value
if the type is "write".

```ts
const { result } = await db.users.findHistory("user_id");
```

```ts
const { result } = await db.users.findHistory("user_id", {
  filter: (entry) => entry.type === "write",
});
```

### findUndelivered()

Retrieve a document entry that was not delivered during an enqueue() operation
in the collection queue. This method takes an optional options argument that can
be used to set the consistency mode.

```ts
const doc1 = await db.users.findUndelivered("undelivered_id");

const doc2 = await db.users.findUndelivered("undelivered_id", {
  consistency: "eventual", // "strong" by default
});
```

### add()

Add a new document to the KV store with an auto-generated id (ulid by default).
Upon completion, a CommitResult object will be returned with the document id,
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
});
```

### addMany()

Add multiple document entries to the KV store with auto-generated ids (ulid by
default). Upon completion, a list of CommitResult objects will be returned.

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

Set a document entry in the KV store with a given id of type KvId. Upon
completion, a CommitResult object will be returned with the document id,
versionstamp and ok flag.

```ts
// Add a new document if the id is not already in use
const result1 = await db.numbers.set("id", 1024);

// Overwrite any existing document with the same id
const result2 = await db.numbers.set("id", 2048, { overwrite: true });

if (result1.ok) {
  console.log(result.id); // id
}
```

### update()

Updates the value of an exisiting document in the KV store by id. By default,
the `merge` strategy is used when available, falling back to `replace` for
primitive types and built-in objects (Date, RegExp, etc.). For plain objects,
the `merge-shallow` strategy is also supported.

```ts
// Updates the document with a new value
const result = await db.numbers.update("num1", 42);

// Partial update using merge, only updates the age field
const result = await db.users.update(
  "oliver",
  { age: 30 },
  { strategy: "merge" },
);
```

### updateByPrimaryIndex()

Update a document by a primary index.

```ts
// Updates a user with username = "oliver" to have age = 56
const result = await db.users.updateByPrimaryIndex(
  "username",
  "oliver",
  { age: 56 },
);

// Updates a user document using shallow merge
const result = await db.users.updateByPrimaryIndex(
  "username",
  "anders",
  { age: 89 },
  { strategy: "merge-shallow" },
);
```

### updateBySecondaryIndex()

Update documents by a secondary index. Takes an optional options argument that
can be used for filtering of documents to be updated, and pagination. If no
options are given, all documents by the given index value will we updated.

```ts
// Updates all user documents with age = 24 and sets age = 67
const { result } = await db.users.updateBySecondaryIndex("age", 24, {
  age: 67,
});

// Updates all users where age = 24 and username starts with "o", using shallow merge
const { result } = await db.users.updateBySecondaryIndex(
  "age",
  24,
  { age: 67 },
  {
    filter: (doc) => doc.value.username.startsWith("o"),
    strategy: "merge-shallow",
  },
);
```

### updateMany()

Update the value of multiple existing documents in the KV store. It takes an
optional options argument that can be used for filtering of documents to be
updated, and pagination. If no options are given, "updateMany" will update all
documents in the collection.

```ts
// Updates all user documents and sets age = 67
const { result } = await db.users.updateMany({ age: 67 });

// Updates all users where age > 20, using shallow merge
const { result } = await db.users.updateMany({ age: 67 }, {
  filter: (doc) => doc.value.age > 20,
  strategy: "merge-shallow",
});

// Only updates first user document and fails the rest when username is a primary index
const { result } = await db.users.updateMany({ username: "oliver" });
```

### updateManyBySecondaryOrder()

Update the value of multiple existing documents in the collection by a secondary
order.

```ts
// Updates the first 10 users ordered by age and sets username = "anon"
await db.users.updateManyBySecondaryOrder("age", { username: "anon" });
```

### updateOne()

Update the first matching document from the KV store. It optionally takes the
same `options` argument as `updateMany()`. If no options are given,
`updateOne()` will update the first document in the collection.

```ts
// Updates the first user document and sets age = 67
const result = await db.users.updateOne({ age: 67 });
```

```ts
// Updates the first user where age > 20, using shallow merge
const result = await db.users.updateOne({ age: 67 }, {
  filter: (doc) => doc.value.age > 20,
  strategy: "merge-shallow",
});
```

### updateOneBySecondaryIndex()

Update the first matching document from the KV store by a secondary index. It
optionally takes the same `options` argument as `updateMany()`. If no options
are given, `updateOneBySecondaryIndex()` will update the first document in the
collection by the given index value.

```ts
// Updates the first user document where age = 20 and sets age = 67
const result = await db.users.updateOneBySecondaryIndex("age", 20, { age: 67 });
```

```ts
// Updates the first user where age = 20 and username starts with "a", using shallow merge
const result = await db.users.updateOneBySecondaryIndex(
  "age",
  20,
  { age: 67 },
  {
    filter: (doc) => doc.value.username.startsWith("a"),
    strategy: "merge-shallow",
  },
);
```

### updateOneBySecondaryOrder()

Update the value of one existing document in the collection by a secondary
order.

```ts
// Updates the first user ordered by age and sets username = "anon"
const result = await db.users.updateOneBySecondaryOrder("age", {
  username: "anon",
});
```

### upsert()

Update an existing document by id, or set a new document entry if no matching
document exists.

```ts
const result = await db.users.upsert({
  id: "user_id",
  update: { username: "Chris" },
  set: {
    username: "Chris",
    age: 54,
    activities: ["bowling"],
    address: {
      country: "USA",
      city: "Las Vegas"
      street: "St. Boulevard"
      houseNumber: 23
    }
  }
})
```

### upsertByPrimaryIndex()

Update an existing document by a primary index, or set a new entry if no
matching document exists. An id can be optionally specified which will be used
when creating a new document entry.

```ts
const result = await db.users.upsertByPrimaryIndex({
  index: ["username", "Jack"],
  update: { username: "Chris" },
  set: {
    username: "Chris",
    age: 54,
    activities: ["bowling"],
    address: {
      country: "USA",
      city: "Las Vegas"
      street: "St. Boulevard"
      houseNumber: 23
    }
  }
})
```

### delete()

Delete one or more documents with the given ids from the KV store.

```ts
await db.users.delete("f897e3cf-bd6d-44ac-8c36-d7ab97a82d77");

await db.users.delete("user1", "user2", "user3");
```

### deleteByPrimaryIndex()

Delete a document by a primary index.

```ts
// Deletes user with username = "oliver"
await db.users.deleteByPrimaryIndex("username", "oliver");
```

### deleteBySecondaryIndex()

Delete documents by a secondary index. The method takes an optional options
argument that can be used for filtering of documents, and pagination.

```ts
// Deletes all users with age = 24
await db.users.deleteBySecondaryIndex("age", 24);

// Deletes all users with age = 24 AND username that starts with "o"
await db.users.deleteBySecondaryIndex("age", 24, {
  filter: (doc) => doc.value.username.startsWith("o"),
});
```

### deleteMany()

Delete multiple documents from the KV store without specifying ids. It takes an
optional options argument that can be used for filtering of documents to be
deleted, and pagination. If no options are given, "deleteMany" will delete all
documents in the collection.

```ts
// Deletes all user documents
await db.users.deleteMany();

// Deletes all user documents where the user's age is above 20
await db.users.deleteMany({
  filter: (doc) => doc.value.age > 20,
});

// Deletes the first 10 user documents in the KV store
await db.users.deleteMany({
  limit: 10,
});

// Deletes the last 10 user documents in the KV store
await db.users.deleteMany({
  limit: 10,
  reverse: true,
});
```

### deleteManyBySecondaryOrder()

Delete multiple documents from the KV store by a secondary order. The method
takes an optional options argument that can be used for filtering of documents,
and pagination. If no options are provided, all documents in the collection are
deleted.

```ts
// Deletes the first 10 users ordered by age
await db.users.deleteManyBySecondaryOrder("age", { limit: 10 });
```

### deleteHistory()

Delete the version history of a document by id.

```ts
await db.users.deleteHistory("user_id");
```

### deleteUndelivered()

Delete an undelivered document entry by id from the collection queue.

```ts
await db.users.deleteUndelivered("id");
```

### getMany()

Retrieve multiple documents from the KV store. It takes an optional `options`
argument that can be used for filtering of documents to be retrieved, and
pagination. If no options are given, `getMany()` will retrieve all documents in
the collection.

```ts
// Retrieves all user documents
const { result } = await db.users.getMany();

// Retrieves all user documents where the user's age is above or equal to 18
const { result } = await db.users.getMany({
  filter: (doc) => doc.value.age >= 18,
});

// Retrieves the first 10 user documents in the KV store
const { result } = await db.users.getMany({
  limit: 10,
});

// Retrieves the last 10 user documents in the KV store
const { result } = await db.users.getMany({
  limit: 10,
  reverse: true,
});
```

### getManyBySecondaryOrder()

Retrieves multiple documents from the KV store in the specified secondary order
and according to the given options. If no options are provided, all documents
are retrieved.

```ts
// Get all users ordered by age
const { result } = await db.users.getManyBySecondaryOrder("age");

// Only get users with username that starts with "a", ordered by age
const { result } = await db.users.getManyBySecondaryOrder("age", {
  filter: (doc) => doc.value.username.startsWith("a"),
});
```

### getOne()

Retrieve the first matching document from the KV store. It optionally takes the
same `options` argument as `getMany()`. If no options are given, `getOne()` will
retrieve the first document in the collection.

```ts
// Retrieves the first user document
const user = await db.users.getOne();

// Retrieves the first user where the user's age is above or equal to 18
const user = await db.users.getOne({
  filter: (doc) => doc.value.age > 18,
});
```

### getOneBySecondaryIndex()

Retrieve the first matching document from the KV store by a secondary index. It
optionally takes the same `options` argument as `getMany()`. If no options are
given, `getOneBySecondaryIndex()` will retrieve the first document in the
collection by the given index value.

```ts
// Retrieves the first user document where age = 20
const user = await db.users.getOneBySecondaryIndex("age", 20);

// Retrieves the first user where age = 20 and username starts with "a"
const user = await db.users.getOneBySecondaryIndex("age", 20, {
  filter: (doc) => doc.value.username.startsWith("a"),
});
```

### getOneBySecondaryOrder()

Retrieves one document from the KV store by a secondary order and according to
the given options. If no options are provided, the first document in the
collection by the given order is retrieved.

```ts
// Get the first user ordered by age
const user = await db.users.getOneBySecondaryOrder("age");
```

### forEach()

Execute a callback function for multiple documents in the KV store. Takes an
optional options argument that can be used for filtering of documents and
pagination. If no options are given, the callback function will be executed for
all documents in the collection.

```ts
// Log the username of every user document
await db.users.forEach((doc) => console.log(doc.value.username));

// Log the username of every user that has "swimming" as an activity
await db.users.forEach((doc) => console.log(doc.value.username), {
  filter: (doc) => doc.value.activities.includes("swimming"),
});

// Log the usernames of the first 10 user documents in the KV store
await db.users.forEach((doc) => console.log(doc.value.username), {
  limit: 10,
});

// Log the usernames of the last 10 user documents in the KV store
await db.users.forEach((doc) => console.log(doc.value.username), {
  limit: 10,
  reverse: true,
});
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
);
```

### forEachBySecondaryOrder()

Executes a callback function for every document by a secondary order and
according to the given options. If no options are provided, the callback
function is executed for all documents.

```ts
// Prints the username of all users ordered by age
await db.users.forEachBySecondaryOrder(
  "age",
  (doc) => console.log(doc.value.username),
);
```

### map()

Execute a callback function for multiple documents in the KV store and retrieve
the results. It takes an optional options argument that can be used for
filtering of documents and pagination. If no options are given, the callback
function will be executed for all documents in the collection.

```ts
// Get a list of all the ids of the user documents
const { result } = await db.users.map((doc) => doc.id);

// Get a list of all usernames of users with age > 20
const { result } = await db.users.map((doc) => doc.value.username, {
  filter: (doc) => doc.value.age > 20,
});

// Get a list of the usernames of the first 10 users in the KV store
const { result } = await db.users.map((doc) => doc.value.username, {
  limit: 10,
});

// Get a list of the usernames of the last 10 users in the KV store
const { result } = await db.users.map((doc) => doc.value.username, {
  limit: 10,
  reverse: true,
});
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
);
```

### mapBySecondaryOrder()

Executes a callback function for every document by a secondary order and
according to the given options. If no options are provided, the callback
function is executed for all documents. The results from the callback function
are returned as a list.

```ts
// Returns a list of usernames of all users ordered by age
const { result } = await db.users.mapBySecondaryOrder(
  "age",
  (doc) => doc.value.username,
);
```

### count()

Count the number of documents in a collection. Takes an optional options
argument that can be used for filtering of documents. If no options are given,
it will count all documents in the collection.

```ts
// Returns the total number of user documents in the KV store
const count = await db.users.count();

// Returns the number of users with age > 20
const count = await db.users.count({
  filter: (doc) => doc.value.age > 20,
});
```

### countBySecondaryIndex()

Counts the number of documents in the collection by a secondary index. Takes an
optional options argument that can be used for filtering of documents. If no
options are given, it will count all documents matching the index.

```ts
// Counts all users where age = 20
const count = await db.users.countBySecondaryIndex("age", 20);
```

### countBySecondaryOrder()

Counts the number of documents in the collection by a secondary order.

```ts
// Counts how many of the first 10 users ordered by age that are under the age of 18
const count = await db.users.countBySecondaryOrder("age", {
  limit: 10,
  filter: (doc) => doc.value.age < 18,
});
```

### enqueue()

Add data to the collection queue to be delivered to the queue listener via
`db.collection.listenQueue()`. The data will only be received by queue listeners
on the specified collection and topic. The method takes an optional options
argument that can be used to set a delivery delay and topic.

```ts
// Immediate delivery
await db.users.enqueue("some data");

// Delay of 2 seconds before delivery
await db.users.enqueue("cake", {
  delay: 2_000,
  topic: "food",
});
```

### listenQueue()

Listen for data from the collection queue that was enqueued with
`db.collection.enqueue()`. Will only receive data that was enqueued to the
specific collection queue and topic. Expects a handler function as argument, as
well as optional options that can be used to set the topic.

```ts
// Prints the data to console when recevied
db.users.listenQueue((data) => console.log(data));

// Sends post request when data is received
db.users.listenQueue(async (data) => {
  const dataBody = JSON.stringify(data);

  const res = await fetch("...", {
    method: "POST",
    body: data,
  });

  console.log("POSTED:", dataBody, res.ok);
}, { topic: "posts" });
```

### watch()

Listen for live changes to a single document by id.

```ts
// Updates the document value every second
setInterval(() => db.numbers.set("id", Math.random()), 1_000);

// Listen for any updates to the document value
db.numbers.watch("id", (doc) => {
  // Document will be null if the latest update was a delete operation
  console.log(doc?.value);
});
```

Watchers can also be stopped.

```ts
const { promise, cancel } = db.numbers.watch("id", (doc) => {
  // ...
});

await cancel();
await promise;
```

### watchMany()

Listen for live changes to an array of specified documents by id.

```ts
// Delayed setting of document values
setTimeout(() => db.numbers.set("id1", 10), 1_000);
setTimeout(() => db.numbers.set("id2", 20), 2_000);
setTimeout(() => db.numbers.set("id3", 30), 3_000);

// Listen for any updates to the document values
db.numbers.watchMany(["id1", "id2", "id3"], (docs) => {
  // Prints for each update to any of the documents
  console.log(docs[0]?.value); // 10, 10, 10
  console.log(docs[1]?.value); // null, 20, 20
  console.log(docs[2]?.value); // null, null, 30
});
```

Watchers can also be stopped.

```ts
const { promise, cancel } = db.numbers.watchMany(
  ["id1", "id2", "id3"],
  (docs) => {
    // ...
  },
);

await cancel();
await promise;
```

## Database Methods

These are methods which can be found at the top level of your database object,
and perform operations across multiple collections or unrelated to collections.

### countAll()

Count the total number of documents across all collections. It takes an optional
options argument that can be used to set the consistency mode.

```ts
// Gets the total number of documents in the KV store across all collections
const count = await db.countAll();
```

### deleteAll()

Delete all documents across all collections.

```ts
await db.deleteAll();
```

### wipe()

Delete all kvdex entries, including undelivered and history entries.

```ts
await db.wipe();
```

### deleteUndelivered()

Delete an undelivered document entry by id from the database queue.

```ts
await db.deleteUndelivered("id");
```

### findUndelivered()

Retrieve a document entry that was not delivered during an enqueue() operation
in the database queue. This method takes an optional options argument that can
be used to set the consistency mode.

```ts
const doc1 = await db.findUndelivered("undelivered_id");

const doc2 = await db.findUndelivered("undelivered_id", {
  consistency: "eventual", // "strong" by default
});
```

### enqueue()

Add data to the database queue to be delivered to the queue listener via
`db.listenQueue()`. The data will only be received by queue listeners on the
database queue and specified topic. The method takes an optional options
argument that can be used to set a delivery delay and topic.

```ts
// Immediate delivery
await db.enqueue("some data");

// Delay of 2 seconds before delivery
await db.enqueue("cake", {
  delay: 2_000,
  topic: "food",
});
```

### listenQueue()

Listen for data from the database queue that was enqueued with `db.enqueue()`.
Will only receive data that was enqueued to the database queue and specified
topic. Expects a handler function as argument, as well as optional options that
can be used to set the topic.

```ts
// Prints the data to console when recevied
db.listenQueue((data) => console.log(data));

// Sends post request when data is received in the "posts" topic
db.listenQueue(async (data) => {
  const dataBody = JSON.stringify(data);

  const res = await fetch("...", {
    method: "POST",
    body: data,
  });

  console.log("POSTED:", dataBody, res.ok);
}, { topic: "posts" });
```

### setInterval()

Create an interval built on queues that can run indefinitely or as long as a
while condition is met. Interval time is given in milliseconds, and can be set
by either a static number or dynamically by a function. There is an enforced
minimum start delay of 1 second to ensure the queue listener is registered
before the first delivery.

```ts
// Will repeat indefinitely with 1 second interval
db.setInterval(() => console.log("Hello World!"), 1_000);

// First callback starts after a 10 second delay, after that there is a random interval between 0 and 5 seconds
db.setInterval(
  () => console.log("I terminate after running 10 times"),
  () => Math.random() * 5_000,
  {
    // Delay before the first callback is invoked
    startDelay: 10_000,

    // Count starts at 0 and is given before the current callback is run
    while: ({ count }) => count < 10,
  },
);
```

### loop()

Create a loop built on queues that can run indefinitely or as long as a while
condition is met. In contrast to `setInterval()`, the callback function in a
loop is run sequentially, meaning the next callback is not enqueued until the
previous task finishes. There is an enforced minimum start delay of 1 second to
ensure the queue listener is registered before the first delivery.

```ts
// Sequentially prints "Hello World!" indefinitely with no delay between each iteration
db.loop(() => console.log("Hello World!"));

// Sequentially prints "Hello World!" 10 times, with a 3 second delay between each iteration
db.loop(() => console.log("Hello World!"), {
  delay: 3_000,
  while: ({ count }) => count < 10,
});
```

### atomic()

Initiate an atomic operation. The method takes a selector function as argument
for selecting the initial collection context.

```ts
db.atomic((schema) => schema.users);
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
atomic in the sense that it performs a single isolated operation. This is
because the document data must be read before performing the initial delete
operation, to then perform another delete operation for the index entries. If
the initial operation fails, the index entries will not be deleted. To avoid
collisions and errors related to indexing, an atomic operation will always fail
if it is trying to delete and write to the same indexable collection. It will
also fail if trying to set/add a document with colliding index entries.

### Without checking

```ts
// Deletes and adds an entry to the numbers collection
const result1 = await db
  .atomic((schema) => schema.numbers)
  .delete("id_1")
  .set("id_2", 100)
  .commit();

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
  .commit();

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
  .commit();
```

### With checking

```ts
// Only adds 10 to the value when it has not been changed since being read
let result = null;
while (!result || !result.ok) {
  const { id, versionstamp, value } = await db.numbers.find("id");

  result = await db
    .atomic((schema) => schema.numbers)
    .check({
      id,
      versionstamp,
    })
    .set(id, value + 10)
    .commit();
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
const doc = await db.users.find(123n);
const flattened = doc.flat();

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
While the core functionalities are free of third-party dependencies, extended
features may rely on third-party dependenices or runtime-specific APIs to
enhance integration.

### Encoding

Utilities for encoding data.

#### JSON

JSON-encoder and utilities for stringifying and serializing data.

```ts
import { jsonEncoder } from "jsr:@olli/kvdex/encoding/json";

// With default options (no compression)
const encoder = jsonEncoder();
```

```ts
import { jsonEncoder } from "jsr:@olli/kvdex/encoding/json";
import { brotliCompressor } from "jsr:@olli/kvdex/encoding/brotli";

// With brotli compression
const encoder = jsonEncoder({ compressor: brotliCompressor() });
```

```ts
import { jsonParse, jsonStringify } from "jsr:@olli/kvdex/encoding/json";

// Stringify value
const json = jsonStringify({
  foo: "bar",
  big: 100n,
});

// Parse value
const value = jsonParse(json);
```

```ts
import { jsonDeserialize, jsonSerialize } from "jsr:@olli/kvdex/encoding/json";

// Serialize value as Uint8Array
const serialized = jsonSerialize({
  foo: "bar",
  big: 100n,
});

// Deserialize value from Uint8Array
const value = jsonDeserialize(serialized);
```

#### V8

V8-encoder and serialization utilities. Relies on the `node:v8` built-in.

```ts
import { v8Encoder } from "jsr:@olli/kvdex/encoding/v8";
import { brotliCompressor } from "jsr:@olli/kvdex/encoding/brotli";

// V8-encoder without compression
const encoder = v8Encoder();

// V8-encoder with brotli compression
const encoder = v8Encoder({ compressor: brotliCompressor() });
```

```ts
import { v8Deserialize, v8Serialize } from "jsr:@olli/kvdex/encoding/v8";

// Serialize value as Uint8Array
const serialized = v8Serialize({
  foo: "bar",
  big: 100n,
});

// Deserialize value from Uint8Array
const value = v8Deserialize(serialized);
```

#### Brotli

Easy to configure brotli compression for use with the `encoder` option for
collections. Relies on the `node:zlib` built-in.

```ts
import { brotliCompressor } from "jsr:@olli/kvdex/encoding/brotli";

// With default options
const compressor = brotliCompressor();

// Explicitly set quality level (default is 1)
const compressor = brotliCompressor({ quality: 2 });
```

### Zod

Extended support for Zod. Includes schemas for some of the KV-types.

#### Schemas

The zod extension provides schemas for some of the KV-types, such as KvId,
KvValue, KvObject and KvArray. This makes it easier to properly build your
schemas.

```ts
import { z } from "npm:zod";
import { KvIdSchema } from "jsr:@olli/kvdex/zod";

const UserSchema = z.object({
  username: z.string(),
  postIds: z.array(KvIdSchema),
});

const PostSchema = z.object({
  text: z.string(),
  userId: KvIdSchema,
});
```

### Migrate

A helper script and function for migrating entries from a source KV instance to
a target KV instance. Only migrates `kvdex` entries by default, but optionally
allows for migrating all entries.

#### Script

Run the migrate script and provide --source and --target arguments. Optionally
pass --all to migrate all entries.

```console
deno run -A --unstable-kv jsr:@olli/kvdex/migrate --source=./source.sqlite3 --target=./target.sqlite3
```

#### Function

Use the migrate function and pass a source KV instance and a target KV instance.
Optionally pass `all: true` to migrate all entries.

```ts
import { migrate } from "jsr:@olli/kvdex/migrate";

const source = await Deno.openKv("./source.sqlite3");
const target = await Deno.openKv("./target.sqlite3");

await migrate({
  source,
  target,
});
```

### KV

Support for alternative KV backends, such as `Map` and `localStorage`. Can be
used to employ `kvdex` in the browser or other environments where Deno's KV
store is not available, or to adapt to other database backends.

```ts
import { kvdex } from "@olli/kvdex";
import { MapKv } from "@olli/kvdex/kv";

// Create a database from a `MapKv` instance, using `Map` as it's backend by default.
const kv = new MapKv(); // Equivalent to `new MapKv({ map: new Map() })`
const db = kvdex(kv, {});
```

```ts
import { kvdex } from "@olli/kvdex";
import { MapKv, StorageAdapter } from "@olli/kvdex/kv";

// Create an ephimeral database from a `MapKv` instance,
// explicitly using `localStorage` as it's backend.
const map = new StorageAdapter(localStorage);
const kv = new MapKv({ map, clearOnClose: true });
const db = kvdex(kv, {});
```

## Blob Storage

To store large blob sizes, and bypass the data limit of a single atomic
operation, a combination of serialized collections and batched atomic operations
can be used. By default, batching is disabled to ensure consistency and improve
performance.

```ts
import { collection, kvdex, model } from "jsr:@olli/kvdex"
import { jsonEncoder } from "jsr:@olli/kvdex/encoding/json"

const kv = await Deno.openKv()
const db = kvdex(kv, {
  blobs: collection(model<Uint8Array>(), { encoder: jsonEncoder() }),
})

const blob = // read from disk, etc.

const result = await db.blobs.add(blob, { batched: true })
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
