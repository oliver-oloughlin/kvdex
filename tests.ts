import type { Document, Model } from "./model.ts"
import { Collection } from "./collection.ts"
import { assert } from "https://deno.land/std@0.184.0/testing/asserts.ts"

interface Person extends Model {
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

const people = new Collection<Person>(["person"])

async function reset() {
  await people.deleteMany()
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

        const { id, versionstamp } = await people.add(testPerson)

        const person = await people.find(id)

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

        const { id, versionstamp } = await people.set({
          id: "test_id",
          ...testPerson
        })

        const person = await people.find(id)

        assert(typeof id === "string")
        assert(typeof versionstamp === "string")
        assert(typeof person === "object" && person?.id === id)
      }
    })

    await t.step({
      name: "Should set record and return commit result with id of type number and versionstamp of type string",
      fn: async () => {
        await reset()

        const { id, versionstamp } = await people.set({
          id: 123,
          ...testPerson
        })

        const person = await people.find(id)

        assert(typeof id === "number")
        assert(typeof versionstamp === "string")
        assert(typeof person === "object" && person?.id === id)
      }
    })

    await t.step({
      name: "Should set record and return commit result with id of type bigint and versionstamp of type string",
      fn: async () => {
        await reset()

        const { id, versionstamp } = await people.set({
          id: 123n,
          ...testPerson
        })

        const person = await people.find(id)

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
        const person = await people.find("non_existing_id")
        assert(person === null)
      }
    })

    await t.step({
      name: "Should return null",
      fn: async () => {
        await reset()

        const person = await people.find(111, {
          consistency: "eventual"
        })

        assert(person === null)
      }
    })

    await t.step({
      name: "Should find document by id and not return null",
      fn: async () => {
        await reset()

        const { id } = await people.add(testPerson)
        const person = await people.find(id)
        assert(typeof person === "object")
      }
    })

    await t.step({
      name: "Should find document by id and not return null",
      fn: async () => {
        await reset()

        const { id } = await people.add(testPerson)

        const person = await people.find(id, {
          consistency: "eventual"
        })
        
        assert(typeof person === "object")
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

        const { id } = await people.add(testPerson)
        const p1 = await people.find(id)

        assert(p1 !== null)

        await people.delete(id)
        const p2 = await people.find(id)

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

        const r1 = await people.add(testPerson)
        const r2 = await people.add(testPerson)
        const id1 = r1.id
        const id2 = r2.id

        const p1_1 = await people.find(id1)
        const p2_1 = await people.find(id2)

        assert(p1_1 !== null)
        assert(p2_1 !== null)

        await people.deleteMany()

        const p1_2 = await people.find(id1)
        const p2_2 = await people.find(id2)

        assert(p1_2 === null)
        assert(p2_2 === null)
      }
    })

    await t.step({
      name: "Should only delete filtered records",
      fn: async () => {
        await reset()

        const r1 = await people.add(testPerson)
        const r2 = await people.add(testPerson)
        const id1 = r1.id
        const id2 = r2.id

        const p1_1 = await people.find(id1)
        const p2_1 = await people.find(id2)

        assert(p1_1 !== null)
        assert(p2_1 !== null)

        await people.deleteMany({
          filter: doc => doc.id === id1
        })

        const p1_2 = await people.find(id1)
        const p2_2 = await people.find(id2)

        assert(p1_2 === null)
        assert(p2_2 !== null)
      }
    })

    await t.step({
      name: "Should only delete the first 2 records",
      fn: async () => {
        await reset()

        await people.add(testPerson)
        await people.add(testPerson)
        await people.add(testPerson)

        const allPeople1 = await people.getMany()

        assert(allPeople1.length === 3)

        await people.deleteMany({
          limit: 2,
        })

        const allPeople2 = await people.getMany()

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

        const r1 = await people.add(testPerson)
        const r2 = await people.add(testPerson)
        const id1 = r1.id
        const id2 = r2.id

        const allPeople = await people.getMany()

        assert(allPeople.length === 2)
        assert(allPeople.some(p => p.id === id1))
        assert(allPeople.some(p => p.id === id2))
      }
    })

    await t.step({
      name: "Should only retrieve filtered records",
      fn: async () => {
        await reset()

        const r1 = await people.add(testPerson)
        const r2 = await people.add(testPerson)
        const id1 = r1.id
        const id2 = r2.id

        const allPeople = await people.getMany({
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

        await people.add(testPerson)
        await people.add(testPerson)
        await people.add(testPerson)

        const allPeople1 = await people.getMany()

        assert(allPeople1.length === 3)

        const allPeople2 = await people.getMany({
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

        const r1 = await people.add(testPerson)
        const r2 = await people.add(testPerson)
        const id1 = r1.id
        const id2 = r2.id

        const allPeople = await people.getMany()

        assert(allPeople.length === 2)

        const list: Document<Person>[] = []
        await people.forEach(doc => list.push(doc))

        assert(list.length === 2)
        assert(list.some(doc => doc.id === id1))
        assert(list.some(doc => doc.id === id2))
      }
    })

    await t.step({
      name: "Should only add filtered documents to list",
      fn: async () => {
        await reset()

        const r1 = await people.add(testPerson)
        const r2 = await people.add(testPerson)
        const id1 = r1.id
        const id2 = r2.id

        const allPeople = await people.getMany()

        assert(allPeople.length === 2)

        const list: Document<Person>[] = []
        await people.forEach(doc => list.push(doc), {
          filter: doc => doc.id === id1
        })

        assert(list.length === 1)
        assert(list.some(doc => doc.id === id1))
        assert(!list.some(doc => doc.id === id2))
      }
    })
  }
})