import { db, reset, testPerson, testPerson2 } from "../config.ts"
import { assert } from "../../deps.ts"
import { flatten } from "../../mod.ts"

Deno.test("indexable_collection", async (t1) => {
  // Test the configuration
  await t1.step("config", async (t2) => {
    await t2.step("Should not find document by index after reset", async () => {
      await reset()

      const indexDoc = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name,
      })
      assert(indexDoc === null)

      const pplById = await db.indexablePeople.getMany()
      assert(pplById.result.length === 0)

      const pplByAge = await db.indexablePeople.findBySecondaryIndex({
        age: 24,
      })
      assert(pplByAge.length === 0)
    })
  })

  // Test "add" method
  await t1.step("add", async (t2) => {
    await t2.step(
      "Should add document to collection by id and defined index",
      async () => {
        await reset()

        const cr = await db.indexablePeople.add(testPerson)
        if (!cr.ok) {
          throw Error("Did not add document to collection successfully")
        }

        const idDoc = await db.indexablePeople.find(cr.id)
        assert(idDoc !== null)
        assert(idDoc.value.name === testPerson.name)

        const indexDoc = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson.name,
        })

        assert(indexDoc !== null)
        assert(indexDoc.value.name === testPerson.name)

        const indexDocs = await db.indexablePeople.findBySecondaryIndex({
          age: 24,
        })

        assert(indexDocs.some((doc) => doc.id === cr.id))
      },
    )

    await t2.step(
      "Should not add document by id or index if any entry already exists",
      async () => {
        await reset()

        const cr1 = await db.indexablePeople.add(testPerson)
        assert(cr1.ok)

        const cr2 = await db.indexablePeople.add(testPerson)
        assert(!cr2.ok)
      },
    )
  })

  // Test "set" method
  await t1.step("set", async (t2) => {
    await t2.step(
      "Should add document to collection by given id and defined index",
      async () => {
        await reset()

        const id = "oliver"

        const cr = await db.indexablePeople.set(id, testPerson)
        if (!cr.ok) {
          throw Error("Did not add document to collection successfully")
        }

        const idDoc = await db.indexablePeople.find(id)
        assert(idDoc !== null)
        assert(idDoc.value.name === testPerson.name)

        const indexDoc = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson.name,
        })

        assert(indexDoc !== null)
        assert(indexDoc.value.name === testPerson.name)

        const indexDocs = await db.indexablePeople.findBySecondaryIndex({
          age: 24,
        })

        assert(indexDocs.some((doc) => doc.id === cr.id))
      },
    )

    await t2.step(
      "Should not add document by id or index if any entry already exists",
      async () => {
        await reset()

        const cr1 = await db.indexablePeople.set("id1", testPerson)
        assert(cr1.ok)

        const cr2 = await db.indexablePeople.set("id2", testPerson)
        assert(!cr2.ok)
      },
    )

    await t2.step(
      "Should not add document by id or index if id entry already exists",
      async () => {
        await reset()

        const cr1 = await db.indexablePeople.set("id1", testPerson)
        assert(cr1.ok)

        const cr2 = await db.indexablePeople.set("id1", testPerson2)
        assert(!cr2.ok)
      },
    )
  })

  // Test "addMany" method
  await t1.step("addMany", async (t2) => {
    await t2.step(
      "Should add all document entries and index entries",
      async () => {
        await reset()

        const crs = await db.indexablePeople.addMany(testPerson, testPerson2)

        assert(crs.every((cr) => cr.ok))

        const people = await db.indexablePeople.getMany()

        assert(people.result.length === 2)
        assert(people.result.some((doc) => doc.value.name === testPerson.name))
        assert(people.result.some((doc) => doc.value.name === testPerson2.name))

        const byName1 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson.name,
        })

        const byName2 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson2.name,
        })

        assert(byName1 !== null)
        assert(byName2 !== null)

        const byAge = await db.indexablePeople.findBySecondaryIndex({
          age: 24,
        })

        assert(byAge.length === 2)
        assert(byAge.some((doc) => doc.value.name === testPerson.name))
        assert(byAge.some((doc) => doc.value.name === testPerson2.name))
      },
    )

    await t2.step(
      "Should not add document entries with duplicate indices",
      async () => {
        await reset()

        const crs = await db.indexablePeople.addMany(testPerson, testPerson)

        assert(crs.some((cr) => !cr.ok))

        const people = await db.indexablePeople.getMany()

        assert(people.result.length === 1)

        const byName = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson.name,
        })

        assert(byName !== null)

        const byAge = await db.indexablePeople.findBySecondaryIndex({
          age: 24,
        })

        assert(byAge.length === 1)
      },
    )
  })

  // Test "findByPrimaryIndex" method
  await t1.step("findByPrimaryIndex", async (t2) => {
    await t2.step("Should find document by primary index", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) {
        throw Error("document was not added to collection usccessfully")
      }

      const indexDoc = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name,
      })

      assert(indexDoc !== null)
      assert(indexDoc.id === cr.id)
      assert(indexDoc.value.name === testPerson.name)
    })
  })

  // Test "findBySecondaryIndex" method
  await t1.step("findBySecondaryIndex", async (t2) => {
    await t2.step("Should find documents by secondary index", async () => {
      await reset()

      const cr1 = await db.indexablePeople.add(testPerson)
      const cr2 = await db.indexablePeople.add(testPerson2)
      assert(cr1.ok && cr2.ok)

      const peopleByAge24 = await db.indexablePeople.findBySecondaryIndex({
        age: 24,
      })
      assert(peopleByAge24.some((p) => p.id === cr1.id))
      assert(peopleByAge24.some((p) => p.id === cr2.id))
    })
  })

  // Test "delete" method
  await t1.step("delete", async (t2) => {
    await t2.step("Should delete all index entries of document", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) {
        throw Error("document was not added to collection usccessfully")
      }

      const idDoc1 = await db.indexablePeople.find(cr.id)
      assert(idDoc1 !== null)

      const indexDoc1 = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name,
      })
      assert(indexDoc1 !== null)

      await db.indexablePeople.delete(cr.id)

      const idDoc2 = await db.indexablePeople.find(cr.id)
      assert(idDoc2 === null)

      const indexDoc2 = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name,
      })
      assert(indexDoc2 === null)

      const indexDocs = await db.indexablePeople.findBySecondaryIndex({
        age: 24,
      })

      assert(indexDocs.length === 0)
    })
  })

  // Test "update" method
  await t1.step("update", async (t2) => {
    await t2.step("Should update data with merged value", async () => {
      await reset()

      const cr1 = await db.indexablePeople.add(testPerson)

      assert(cr1.ok)

      const cr2 = await db.indexablePeople.update(cr1.id, {
        age: 77,
        address: {
          country: "Sweden",
          city: null,
        },
        friends: [],
      })

      assert(cr2.ok)

      const idDoc = await db.indexablePeople.find(cr1.id)

      const nameDoc = await db.indexablePeople.findByPrimaryIndex({
        name: "Oliver",
      })

      const [ageDoc] = await db.indexablePeople.findBySecondaryIndex({
        age: 77,
      })

      assert(idDoc !== null)
      assert(nameDoc !== null)
      assert(typeof ageDoc !== "undefined" && ageDoc !== null)

      const value1 = flatten(idDoc)
      const value2 = flatten(nameDoc)
      const value3 = flatten(ageDoc)

      assert(value1.name === testPerson.name)
      assert(value1.age === 77)
      assert(value1.address.country === "Sweden")
      assert(value1.address.city === null)
      assert(typeof value1.address.postcode === "undefined")
      assert(value1.friends.length === 0)

      assert(value2.name === testPerson.name)
      assert(value2.age === 77)
      assert(value2.address.country === "Sweden")
      assert(value2.address.city === null)
      assert(typeof value2.address.postcode === "undefined")
      assert(value2.friends.length === 0)

      assert(value3.name === testPerson.name)
      assert(value3.age === 77)
      assert(value3.address.country === "Sweden")
      assert(value3.address.city === null)
      assert(typeof value3.address.postcode === "undefined")
      assert(value3.friends.length === 0)
    })
  })

  // Test "getMany" method
  await t1.step("getMany", async (t2) => {
    await t2.step("Should get exactly one copy of every document", async () => {
      await reset()

      const cr1 = await db.indexablePeople.add(testPerson)
      const cr2 = await db.indexablePeople.add(testPerson2)
      assert(cr1.ok && cr2.ok)

      const all = await db.indexablePeople.getMany()
      assert(all.result.length === 2)
      assert(all.result.some((doc) => doc.id === cr1.id))
      assert(all.result.some((doc) => doc.id === cr2.id))
    })

    await t2.step("Should get all documents by pagination", async () => {
      await reset()

      await db.indexablePeople.add(testPerson)
      await db.indexablePeople.add(testPerson2)

      const allPeople1 = await db.indexablePeople.getMany()
      assert(allPeople1.result.length === 2)

      let cursor: string | undefined
      const result = []
      do {
        const data = await db.indexablePeople.getMany({ cursor, limit: 1 })
        result.push(...data.result)
        cursor = data.cursor
      } while (cursor)

      assert(result.length === 2)
    })
  })

  // Test "deleteMany" method
  await t1.step("deleteMany", async (t2) => {
    await t2.step(
      "Should delete all document entries of all documents",
      async () => {
        await reset()

        // Add test objects
        const cr1 = await db.indexablePeople.add(testPerson)
        const cr2 = await db.indexablePeople.add(testPerson2)
        if (!cr1.ok || !cr2.ok) {
          throw Error("documents were not added to collection successfully")
        }

        // Check that test objects can be found by id and index before delete
        const idDoc1_1 = await db.indexablePeople.find(cr1.id)
        assert(idDoc1_1 !== null)

        const indexDoc1_1 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson.name,
        })
        assert(indexDoc1_1 !== null)

        const idDoc2_1 = await db.indexablePeople.find(cr2.id)
        assert(idDoc2_1 !== null)

        const indexDoc2_1 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson2.name,
        })
        assert(indexDoc2_1 !== null)

        // Delete test objects
        await db.indexablePeople.deleteMany()

        // Check that test objects can not be found by id and index after delete
        const idDoc1_2 = await db.indexablePeople.find(cr1.id)
        assert(idDoc1_2 === null)

        const indexDoc1_2 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson.name,
        })
        assert(indexDoc1_2 === null)

        const idDoc2_2 = await db.indexablePeople.find(cr2.id)
        assert(idDoc2_2 === null)

        const indexDoc2_2 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson2.name,
        })
        assert(indexDoc2_2 === null)

        // Check that secondary indices are deleted
        const indexDocs = await db.indexablePeople.findBySecondaryIndex({
          age: 24,
        })

        assert(indexDocs.length === 0)
      },
    )

    await t2.step(
      "Should only delete document entries of filtered documents",
      async () => {
        await reset()

        // Add test objects
        const cr1 = await db.indexablePeople.add(testPerson)
        const cr2 = await db.indexablePeople.add(testPerson2)
        if (!cr1.ok || !cr2.ok) {
          throw Error("documents were not added to collection successfully")
        }

        // Check that test objects can be found by id and index before delete
        const idDoc1_1 = await db.indexablePeople.find(cr1.id)
        assert(idDoc1_1 !== null)

        const indexDoc1_1 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson.name,
        })
        assert(indexDoc1_1 !== null)

        const idDoc2_1 = await db.indexablePeople.find(cr2.id)
        assert(idDoc2_1 !== null)

        const indexDoc2_1 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson2.name,
        })
        assert(indexDoc2_1 !== null)

        // Delete test objects
        await db.indexablePeople.deleteMany({
          filter: (doc) => doc.value.name === testPerson.name,
        })

        // Check that filtered test objects can not be found by id and index after delete, while un-fitlered can be found
        const idDoc1_2 = await db.indexablePeople.find(cr1.id)
        assert(idDoc1_2 === null)

        const indexDoc1_2 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson.name,
        })
        assert(indexDoc1_2 === null)

        const idDoc2_2 = await db.indexablePeople.find(cr2.id)
        assert(idDoc2_2 !== null)

        const indexDoc2_2 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson2.name,
        })
        assert(indexDoc2_2 !== null)
      },
    )

    await t2.step("Should delete all records using pagination", async () => {
      await reset()

      await db.indexablePeople.add(testPerson)
      await db.indexablePeople.add(testPerson2)

      const allPeople1 = await db.indexablePeople.getMany()
      assert(allPeople1.result.length === 2)

      let cursor: string | undefined
      do {
        const r = await db.indexablePeople.deleteMany({ cursor, limit: 1 })
        cursor = r.cursor
      } while (cursor)

      const allPeople2 = await db.indexablePeople.getMany()
      assert(allPeople2.result.length === 0)
    })
  })

  // Perform last reset
  await t1.step("RESET", async () => await reset())
})
