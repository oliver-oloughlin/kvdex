import { Document, flatten } from "../../mod.ts"
import { db, type Person, reset, testPerson, testPerson2 } from "../config.ts"
import { assert } from "../../deps.ts"

Deno.test({
  name: "collection",
  fn: async (t) => {
    // Test "add" method
    await t.step({
      name: "add",
      fn: async (t) => {
        await reset()

        await t.step({
          name:
            "Should add record and return commit result with random id of type string and versionstamp of type string",
          fn: async () => {
            await reset()

            const cr = await db.people.add(testPerson)
            if (!cr.ok) {
              throw Error("'testPerson' not added to collection successfully")
            }

            const person = await db.people.find(cr.id)

            assert(typeof cr.id === "string")
            assert(typeof cr.versionstamp === "string")
            assert(typeof person === "object" && person?.id === cr.id)
          },
        })
      },
    })

    // Test "set" method
    await t.step({
      name: "set",
      fn: async (t) => {
        await t.step({
          name:
            "Should set record and return commit result with id of type string and versionstamp of type string",
          fn: async () => {
            await reset()

            const cr = await db.people.set("test_id", testPerson)
            if (!cr.ok) {
              throw Error("'testPerson' not added to collection successfully")
            }

            const person = await db.people.find(cr.id)

            assert(typeof cr.id === "string")
            assert(typeof cr.versionstamp === "string")
            assert(typeof person === "object" && person?.id === cr.id)
          },
        })

        await t.step({
          name:
            "Should set record and return commit result with id of type number and versionstamp of type string",
          fn: async () => {
            await reset()

            const cr = await db.people.set(123, testPerson)
            if (!cr.ok) {
              throw Error("'testPerson' not added to collection successfully")
            }

            const person = await db.people.find(cr.id)

            assert(typeof cr.id === "number")
            assert(typeof cr.versionstamp === "string")
            assert(typeof person === "object" && person?.id === cr.id)
          },
        })

        await t.step({
          name:
            "Should set record and return commit result with id of type bigint and versionstamp of type string",
          fn: async () => {
            await reset()

            const cr = await db.people.set(123n, testPerson)
            if (!cr.ok) {
              throw Error("'testPerson' not added to collection successfully")
            }

            const person = await db.people.find(cr.id)

            assert(typeof cr.id === "bigint")
            assert(typeof cr.versionstamp === "string")
            assert(typeof person === "object" && person?.id === cr.id)
          },
        })

        await t.step({
          name: "Should not override existing record with the same id",
          fn: async () => {
            await reset()

            const cr1 = await db.people.set(123n, testPerson)
            if (!cr1.ok) {
              throw Error("'testPerson' not added to collection successfully")
            }

            const cr2 = await db.people.set(123n, testPerson)
            assert(!cr2.ok)
          },
        })
      },
    })

    // Test "find" method
    await t.step({
      name: "find",
      fn: async (t) => {
        await t.step({
          name: "Should return null",
          fn: async () => {
            await reset()
            const doc = await db.people.find("non_existing_id")
            assert(doc === null)
          },
        })

        await t.step({
          name: "Should return null",
          fn: async () => {
            await reset()

            const doc = await db.people.find(111, {
              consistency: "eventual",
            })

            assert(doc === null)
          },
        })

        await t.step({
          name: "Should find document by id and not return null",
          fn: async () => {
            await reset()

            const cr = await db.people.add(testPerson)
            if (!cr.ok) {
              throw Error("'testPerson' not added to collection successfully")
            }

            const doc = await db.people.find(cr.id)
            assert(typeof doc === "object")
            assert(typeof doc?.value === "object")
            assert(doc?.value.name === testPerson.name)
          },
        })

        await t.step({
          name: "Should find document by id and not return null",
          fn: async () => {
            await reset()

            const cr = await db.people.add(testPerson)
            if (!cr.ok) throw Error("'' not added to collection successfully")

            const doc = await db.people.find(cr.id, {
              consistency: "eventual",
            })

            assert(typeof doc === "object")
            assert(typeof doc?.value === "object")
            assert(doc?.value.name === testPerson.name)
          },
        })
      },
    })

    // Test "findMany" method
    await t.step({
      name: "findMany",
      fn: async (t) => {
        await t.step({
          name: "Should not find any documents",
          fn: async () => {
            await reset()

            const docs = await db.people.findMany(["123", 123, 123n, "abc"])

            assert(docs.length === 0)
          },
        })

        await t.step({
          name: "Should find 2 documents",
          fn: async () => {
            await reset()

            await db.people.set("123", testPerson)
            await db.people.set(123n, testPerson)

            const docs = await db.people.findMany(["123", 123, 123n, "abc"])

            assert(docs.length === 2)
            assert(docs.some((doc) => doc.id === "123"))
            assert(docs.some((doc) => doc.id === 123n))
          },
        })

        await t.step({
          name: "Should find 4 documents",
          fn: async () => {
            await reset()

            const arrayId = new Uint8Array()
            arrayId.fill(10)

            await db.people.set("123", testPerson)
            await db.people.set(123, testPerson)
            await db.people.set(123n, testPerson)
            await db.people.set(arrayId, testPerson)

            const docs = await db.people.findMany(["123", 123, 123n, arrayId])

            assert(docs.length === 4)
            assert(docs.some((doc) => doc.id === "123"))
            assert(docs.some((doc) => doc.id === 123))
            assert(docs.some((doc) => doc.id === 123n))
            assert(
              docs.some((doc) =>
                doc.id instanceof Uint8Array &&
                doc.id.every((n) => arrayId.includes(n))
              ),
            )
          },
        })
      },
    })

    // Test "addMany" method
    await t.step("addMany", async (t2) => {
      await t2.step("Should add all document entries", async () => {
        await reset()

        const cr = await db.people.addMany(testPerson, testPerson2)

        assert(cr.ok)

        const people = await db.people.getMany()

        assert(people.result.length === 2)
        assert(people.result.some((doc) => doc.value.name === testPerson.name))
        assert(people.result.some((doc) => doc.value.name === testPerson2.name))
      })
    })

    // Test "delete" method
    await t.step({
      name: "delete",
      fn: async (t) => {
        await t.step({
          name: "Should delete record by id",
          fn: async () => {
            await reset()

            const cr = await db.people.add(testPerson)
            if (!cr.ok) {
              throw Error("'testPerson' not added to collection successfully")
            }

            const p1 = await db.people.find(cr.id)

            assert(p1 !== null)

            await db.people.delete(cr.id)
            const p2 = await db.people.find(cr.id)

            assert(p2 === null)
          },
        })
      },
    })

    // Test "update" method
    await t.step("update", async (t2) => {
      await t2.step(
        "Should update primitive and standard objects with new value",
        async () => {
          await reset()

          const cr1 = await db.values.numbers.add(1)
          const cr2 = await db.arrs.add(["1", "2", "3"])
          const cr3 = await db.dates.add(new Date("2020-01-01"))
          const cr4 = await db.values.u64s.add(new Deno.KvU64(100n))

          assert(cr1.ok && cr2.ok && cr3.ok && cr4.ok)

          const cr11 = await db.values.numbers.update(cr1.id, 2)
          const cr22 = await db.arrs.update(cr2.id, ["101"])
          const cr33 = await db.dates.update(cr3.id, new Date("2022-02-02"))
          const cr44 = await db.values.u64s.update(cr4.id, new Deno.KvU64(200n))

          assert(cr11.ok && cr22.ok && cr33.ok && cr44.ok)

          const doc1 = await db.values.numbers.find(cr1.id)
          const doc2 = await db.arrs.find(cr2.id)
          const doc3 = await db.dates.find(cr3.id)
          const doc4 = await db.values.u64s.find(cr4.id)

          assert(doc1 !== null && doc1.value === 2)

          assert(
            doc2 !== null &&
              JSON.stringify(doc2.value) === JSON.stringify(["101"]),
          )

          assert(
            doc3 !== null &&
              doc3.value.getMilliseconds() ===
                new Date("2022-02-02").getMilliseconds(),
          )

          assert(
            doc4 !== null && doc4.value.value === new Deno.KvU64(200n).value,
          )
        },
      )

      await t2.step(
        "Should update object types with merged value",
        async () => {
          await reset()

          const cr1 = await db.people.add(testPerson)

          assert(cr1.ok)

          const cr2 = await db.people.update(cr1.id, {
            age: 77,
            address: {
              country: "Sweden",
              city: null,
            },
            friends: [],
          })

          assert(cr2.ok)

          const doc = await db.people.find(cr1.id)

          assert(doc !== null)

          const value = flatten(doc)

          assert(value.name === testPerson.name)
          assert(value.age === 77)
          assert(value.address.country === "Sweden")
          assert(value.address.city === null)
          assert(typeof value.address.postcode === "undefined")
          assert(value.friends.length === 0)
        },
      )
    })

    // Test "deleteMany" method
    await t.step("deleteMany", async (t2) => {
      await t2.step({
        name: "Should delete all records",
        fn: async () => {
          await reset()

          const r1 = await db.people.add(testPerson)
          const r2 = await db.people.add(testPerson)
          if (!r1.ok || !r2.ok) {
            throw Error("'testPerson' not added to collection successfully")
          }

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
        },
      })

      await t2.step({
        name: "Should only delete filtered records",
        fn: async () => {
          await reset()

          const r1 = await db.people.add(testPerson)
          const r2 = await db.people.add(testPerson)
          if (!r1.ok || !r2.ok) {
            throw Error("'testPerson' not added to collection successfully")
          }

          const id1 = r1.id
          const id2 = r2.id

          const p1_1 = await db.people.find(id1)
          const p2_1 = await db.people.find(id2)

          assert(p1_1 !== null)
          assert(p2_1 !== null)

          await db.people.deleteMany({
            filter: (doc) => doc.id === id1,
          })

          const p1_2 = await db.people.find(id1)
          const p2_2 = await db.people.find(id2)

          assert(p1_2 === null)
          assert(p2_2 !== null)
        },
      })

      await t2.step({
        name: "Should only delete the first 2 records",
        fn: async () => {
          await reset()

          await db.people.add(testPerson)
          await db.people.add(testPerson)
          await db.people.add(testPerson)

          const allPeople1 = await db.people.getMany()

          assert(allPeople1.result.length === 3)

          await db.people.deleteMany({
            limit: 2,
          })

          const allPeople2 = await db.people.getMany()

          assert(allPeople2.result.length === 1)
        },
      })
    })

    // Test "getMany" method
    await t.step({
      name: "getMany",
      fn: async (t) => {
        await t.step({
          name: "Should retrieve all records",
          fn: async () => {
            await reset()

            const r1 = await db.people.add(testPerson)
            const r2 = await db.people.add(testPerson)
            if (!r1.ok || !r2.ok) {
              throw Error("'testPerson' not added to collection successfully")
            }

            const id1 = r1.id
            const id2 = r2.id

            const allPeople = await db.people.getMany()

            assert(allPeople.result.length === 2)
            assert(allPeople.result.some((p) => p.id === id1))
            assert(allPeople.result.some((p) => p.id === id2))
          },
        })

        await t.step({
          name: "Should only retrieve filtered records",
          fn: async () => {
            await reset()

            const r1 = await db.people.add(testPerson)
            const r2 = await db.people.add(testPerson)
            if (!r1.ok || !r2.ok) {
              throw Error("'testPerson' not added to collection successfully")
            }

            const id1 = r1.id
            const id2 = r2.id

            const allPeople = await db.people.getMany({
              filter: (doc) => doc.id === id1,
            })

            assert(allPeople.result.length === 1)
            assert(allPeople.result.some((p) => p.id === id1))
            assert(!allPeople.result.some((p) => p.id === id2))
          },
        })

        await t.step({
          name: "Should only retrieve the first 2 records",
          fn: async () => {
            await reset()

            await db.people.add(testPerson)
            await db.people.add(testPerson)
            await db.people.add(testPerson)

            const allPeople1 = await db.people.getMany()

            assert(allPeople1.result.length === 3)

            const allPeople2 = await db.people.getMany({
              limit: 2,
            })

            assert(allPeople2.result.length === 2)
          },
        })
      },
    })

    // Test "forEach" method
    await t.step({
      name: "forEach",
      fn: async (t) => {
        await t.step({
          name: "Should add all documents to list",
          fn: async () => {
            await reset()

            const r1 = await db.people.add(testPerson)
            const r2 = await db.people.add(testPerson)
            if (!r1.ok || !r2.ok) {
              throw Error("'testPerson' not added to collection successfully")
            }

            const id1 = r1.id
            const id2 = r2.id

            const allPeople = await db.people.getMany()

            assert(allPeople.result.length === 2)

            const list: Document<Person>[] = []
            await db.people.forEach((doc) => list.push(doc))

            assert(list.length === 2)
            assert(list.some((doc) => doc.id === id1))
            assert(list.some((doc) => doc.id === id2))
          },
        })

        await t.step({
          name: "Should only add filtered documents to list",
          fn: async () => {
            await reset()

            const r1 = await db.people.add(testPerson)
            const r2 = await db.people.add(testPerson)
            if (!r1.ok || !r2.ok) {
              throw Error("'testPerson' not added to collection successfully")
            }

            const id1 = r1.id
            const id2 = r2.id

            const allPeople = await db.people.getMany()

            assert(allPeople.result.length === 2)

            const list: Document<Person>[] = []
            await db.people.forEach((doc) => list.push(doc), {
              filter: (doc) => doc.id === id1,
            })

            assert(list.length === 1)
            assert(list.some((doc) => doc.id === id1))
            assert(!list.some((doc) => doc.id === id2))
          },
        })
      },
    })

    // Perform last reset
    await t.step("RESET", async () => await reset())
  },
})
