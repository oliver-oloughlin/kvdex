import { kvdb, collection, type KvObject, type Document } from "./mod.ts"
import { assert } from "https://deno.land/std@0.184.0/testing/asserts.ts"

interface Person extends KvObject {
  name: string,
  age: number,
  friends: string[],
  address: {
    country: string,
    city: string,
    postcode: number
  }
}

const testPerson: Person = {
  name: "Oliver",
  age: 24,
  friends: ["Elias", "Anders"],
  address: {
    country: "Norway",
    city: "Bergen",
    postcode: 420
  }
}

const db = kvdb({
  people: collection<Person>(["people"]),
  values: {
    numbers: collection<number>(["values", "numbers"]),
    strings: collection<string>(["values", "strings"]),
    u64s: collection<Deno.KvU64>(["values", "u64s"])
  }
})

async function reset() {
  await db.people.deleteMany()
  await db.values.numbers.deleteMany()
  await db.values.strings.deleteMany()
  await db.values.u64s.deleteMany()
}

// Test "add" method
Deno.test({
  name: "add",
  fn: async t => {
    await reset()

    await t.step({
      name: "Should add record and return commit result with random id of type string and versionstamp of type string",
      fn: async () => {
        await reset()

        const { id, versionstamp } = await db.people.add(testPerson)

        const person = await db.people.find(id)

        assert(typeof id === "string")
        assert(typeof versionstamp === "string")
        assert(typeof person === "object" && person?.id === id)
      }
    })
  }
})

// Test "set" method
Deno.test({
  name: "set",
  fn: async t => {
    await t.step({
      name: "Should set record and return commit result with id of type string and versionstamp of type string",
      fn: async () => {
        await reset()

        const { id, versionstamp } = await db.people.set("test_id", testPerson)

        const person = await db.people.find(id)

        assert(typeof id === "string")
        assert(typeof versionstamp === "string")
        assert(typeof person === "object" && person?.id === id)
      }
    })

    await t.step({
      name: "Should set record and return commit result with id of type number and versionstamp of type string",
      fn: async () => {
        await reset()

        const { id, versionstamp } = await db.people.set(123, testPerson)

        const person = await db.people.find(id)

        assert(typeof id === "number")
        assert(typeof versionstamp === "string")
        assert(typeof person === "object" && person?.id === id)
      }
    })

    await t.step({
      name: "Should set record and return commit result with id of type bigint and versionstamp of type string",
      fn: async () => {
        await reset()

        const { id, versionstamp } = await db.people.set(123n, testPerson)

        const person = await db.people.find(id)

        assert(typeof id === "bigint")
        assert(typeof versionstamp === "string")
        assert(typeof person === "object" && person?.id === id)
      }
    })
  }
})

// Test "find" method
Deno.test({
  name: "find",
  fn: async t => {
    await t.step({
      name: "Should return null",
      fn: async () => {
        await reset()
        const doc = await db.people.find("non_existing_id")
        assert(doc === null)
      }
    })

    await t.step({
      name: "Should return null",
      fn: async () => {
        await reset()

        const doc = await db.people.find(111, {
          consistency: "eventual"
        })

        assert(doc === null)
      }
    })

    await t.step({
      name: "Should find document by id and not return null",
      fn: async () => {
        await reset()

        const { id } = await db.people.add(testPerson)
        const doc = await db.people.find(id)
        assert(typeof doc === "object")
        assert(typeof doc?.value === "object")
        assert(doc?.value.name === testPerson.name)
      }
    })

    await t.step({
      name: "Should find document by id and not return null",
      fn: async () => {
        await reset()

        const { id } = await db.people.add(testPerson)

        const doc = await db.people.find(id, {
          consistency: "eventual"
        })
        
        assert(typeof doc === "object")
        assert(typeof doc?.value === "object")
        assert(doc?.value.name === testPerson.name)
      }
    })
  }
})

// Test "delete" method
Deno.test({
  name: "delete",
  fn: async t => {
    await t.step({
      name: "Should delete record by id",
      fn: async () => {
        await reset()

        const { id } = await db.people.add(testPerson)
        const p1 = await db.people.find(id)

        assert(p1 !== null)

        await db.people.delete(id)
        const p2 = await db.people.find(id)

        assert(p2 === null)
      }
    })
  }
})

// Test "deleteMany" method
Deno.test({
  name: "deleteMany",
  fn: async t => {
    await t.step({
      name: "Should delete all records",
      fn: async () => {
        await reset()

        const r1 = await db.people.add(testPerson)
        const r2 = await db.people.add(testPerson)
        const id1 = r1.id
        const id2 = r2.id

        const p1_1 = await db.people.find(id1)
        const p2_1 = await db.people.find(id2)

        assert(p1_1 !== null)
        assert(p2_1 !== null)

        await db.people.deleteMany()

        const p1_2 = await db.people.find(id1)
        const p2_2 = await db.people.find(id2)

        assert(p1_2 === null)
        assert(p2_2 === null)
      }
    })

    await t.step({
      name: "Should only delete filtered records",
      fn: async () => {
        await reset()

        const r1 = await db.people.add(testPerson)
        const r2 = await db.people.add(testPerson)
        const id1 = r1.id
        const id2 = r2.id

        const p1_1 = await db.people.find(id1)
        const p2_1 = await db.people.find(id2)

        assert(p1_1 !== null)
        assert(p2_1 !== null)

        await db.people.deleteMany({
          filter: doc => doc.id === id1
        })

        const p1_2 = await db.people.find(id1)
        const p2_2 = await db.people.find(id2)

        assert(p1_2 === null)
        assert(p2_2 !== null)
      }
    })

    await t.step({
      name: "Should only delete the first 2 records",
      fn: async () => {
        await reset()

        await db.people.add(testPerson)
        await db.people.add(testPerson)
        await db.people.add(testPerson)

        const allPeople1 = await db.people.getMany()

        assert(allPeople1.length === 3)

        await db.people.deleteMany({
          limit: 2,
        })

        const allPeople2 = await db.people.getMany()

        assert(allPeople2.length === 1)
      }
    })
  }
})

// Test "getMany" method
Deno.test({
  name: "getMany",
  fn: async t => {
    await t.step({
      name: "Should retrieve all records",
      fn: async () => {
        await reset()

        const r1 = await db.people.add(testPerson)
        const r2 = await db.people.add(testPerson)
        const id1 = r1.id
        const id2 = r2.id

        const allPeople = await db.people.getMany()

        assert(allPeople.length === 2)
        assert(allPeople.some(p => p.id === id1))
        assert(allPeople.some(p => p.id === id2))
      }
    })

    await t.step({
      name: "Should only retrieve filtered records",
      fn: async () => {
        await reset()

        const r1 = await db.people.add(testPerson)
        const r2 = await db.people.add(testPerson)
        const id1 = r1.id
        const id2 = r2.id

        const allPeople = await db.people.getMany({
          filter: doc => doc.id === id1
        })

        assert(allPeople.length === 1)
        assert(allPeople.some(p => p.id === id1))
        assert(!allPeople.some(p => p.id === id2))
      }
    })

    await t.step({
      name: "Should only retrieve the first 2 records",
      fn: async () => {
        await reset()

        await db.people.add(testPerson)
        await db.people.add(testPerson)
        await db.people.add(testPerson)

        const allPeople1 = await db.people.getMany()

        assert(allPeople1.length === 3)

        const allPeople2 = await db.people.getMany({
          limit: 2
        })

        assert(allPeople2.length === 2)
      }
    })
  }
})

// Test "forEach" method
Deno.test({
  name: "forEach",
  fn: async t => {
    await t.step({
      name: "Should add all documents to list",
      fn: async () => {
        await reset()

        const r1 = await db.people.add(testPerson)
        const r2 = await db.people.add(testPerson)
        const id1 = r1.id
        const id2 = r2.id

        const allPeople = await db.people.getMany()

        assert(allPeople.length === 2)

        const list: Document<Person>[] = []
        await db.people.forEach(doc => list.push(doc))

        assert(list.length === 2)
        assert(list.some(doc => doc.id === id1))
        assert(list.some(doc => doc.id === id2))
      }
    })

    await t.step({
      name: "Should only add filtered documents to list",
      fn: async () => {
        await reset()

        const r1 = await db.people.add(testPerson)
        const r2 = await db.people.add(testPerson)
        const id1 = r1.id
        const id2 = r2.id

        const allPeople = await db.people.getMany()

        assert(allPeople.length === 2)

        const list: Document<Person>[] = []
        await db.people.forEach(doc => list.push(doc), {
          filter: doc => doc.id === id1
        })

        assert(list.length === 1)
        assert(list.some(doc => doc.id === id1))
        assert(!list.some(doc => doc.id === id2))
      }
    })
  }
})

// Test atomic operations
Deno.test({
  name: "atomic",
  fn: async t => {
    await t.step({
      name: "Should add numbers to numbers collection",
      fn: async () => {
        await reset()

        const r = await db
          .atomic(db => db.values.numbers)
          .add(1)
          .add(2)
          .add(3)
          .commit()

        const numbersResult = await db.values.numbers.getMany()

        assert(r !== null)
        assert(numbersResult.some(n => n.value === 1))
        assert(numbersResult.some(n => n.value === 2))
        assert(numbersResult.some(n => n.value === 3))
      }
    })

    await t.step({
      name: "Should not commit new value",
      fn: async () => {
        await reset()

        const { id, versionstamp } = await db.values.strings.add("test1")
        await db.values.strings.set(id, "test2")

        const r = await db
          .atomic(db => db.values.strings)
          .check({
            id,
            versionstamp
          })
          .set(id, "test3")
          .commit()

        assert(!r.ok)
      }
    })

    await t.step({
      name: "Should add and sum value",
      fn: async () => {
        await reset()

        const { id } = await db.values.u64s.add(new Deno.KvU64(100n))

        const r1 = await db.values.u64s.find(id)

        assert(r1 !== null)
        assert(r1?.value.value === new Deno.KvU64(100n).value)

        const r2 = await db
          .atomic(db => db.values.u64s)
          .sum(id, 10n)
          .commit()

        assert(r2 !== null)
        
        const r3 = await db.values.u64s.find(id)

        assert(r3 !== null)
        assert(r3?.value.value === new Deno.KvU64(110n).value)
      }
    })

    await t.step({
      name: "Should perform atomic operations using mutate",
      fn: async () => {
        await reset()

        const { id } = await db.values.numbers.add(10)

        const nums1 = await db.values.numbers.getMany()
        assert(nums1.length === 1)

        const r1 = await db
          .atomic(schema => schema.values.numbers)
          .mutate(
            {
              type: "set",
              id: "n1",
              value: 1
            },
            {
              type: "set",
              id: "n2",
              value: 2
            },
            {
              type: "delete",
              id: id
            }
          )
          .commit()

          const nums2 = await db.values.numbers.getMany()
          
          assert(r1.ok)
          assert(nums2.length === 2)
          assert(nums2.some(doc => doc.value === 1))
          assert(nums2.some(doc => doc.value === 2))
          assert(!nums2.some(doc => doc.value === 10))
      }
    })
  }
})