import {
  db,
  generatePeople,
  Person,
  reset,
  sleep,
  testPerson,
  testPerson2,
  useTemporaryKv,
} from "../config.ts"
import { assert } from "../deps.ts"
import { flatten, indexableCollection, QueueMessage } from "../../mod.ts"
import { kvdex } from "../../src/db.ts"
import {
  COLLECTION_ID_KEY_SUFFIX,
  COLLECTION_PRIMARY_INDEX_KEY_SUFFIX,
  COLLECTION_SECONDARY_INDEX_KEY_SUFFIX,
  KVDEX_KEY_PREFIX,
} from "../../src/constants.ts"

Deno.test("indexable_collection", async (t) => {
  // Test correctness of collection keys
  await t.step("keys", async (t) => {
    await t.step("Collection keys should have kvdex prefix", () => {
      const keys = Object.entries(db.indexablePeople._keys).map(([_, key]) =>
        key
      )
      assert(keys.every((key) => key[0] === KVDEX_KEY_PREFIX))
    })

    await t.step("Id key should have id key suffix", () => {
      const key = db.indexablePeople._keys.idKey
      const suffix = key[key.length - 1]
      assert(suffix === COLLECTION_ID_KEY_SUFFIX)
    })

    await t.step(
      "Primary index key should have primary index key suffix",
      () => {
        const key = db.indexablePeople._keys.primaryIndexKey
        const suffix = key[key.length - 1]
        assert(suffix === COLLECTION_PRIMARY_INDEX_KEY_SUFFIX)
      },
    )

    await t.step(
      "Secondary index key should have secondary index key suffix",
      () => {
        const key = db.indexablePeople._keys.secondaryIndexKey
        const suffix = key[key.length - 1]
        assert(suffix === COLLECTION_SECONDARY_INDEX_KEY_SUFFIX)
      },
    )
  })

  // Test the configuration
  await t.step("config", async (t) => {
    await t.step("Should not find document by index after reset", async () => {
      await reset()

      const indexDoc = await db.indexablePeople.findByPrimaryIndex(
        "name",
        "oliver",
      )
      assert(indexDoc === null)

      const pplById = await db.indexablePeople.getMany()
      assert(pplById.result.length === 0)

      const pplByAge = await db.indexablePeople.findBySecondaryIndex("age", 24)
      assert(pplByAge.result.length === 0)
    })
  })

  // Test "add" method
  await t.step("add", async (t) => {
    await t.step(
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

        const indexDoc = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )

        assert(indexDoc !== null)
        assert(indexDoc.value.name === testPerson.name)

        const indexDocs = await db.indexablePeople.findBySecondaryIndex(
          "age",
          24,
        )

        assert(indexDocs.result.some((doc) => doc.id === cr.id))
      },
    )

    await t.step(
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
  await t.step("set", async (t) => {
    await t.step(
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

        const indexDoc = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )

        assert(indexDoc !== null)
        assert(indexDoc.value.name === testPerson.name)

        const indexDocs = await db.indexablePeople.findBySecondaryIndex(
          "age",
          24,
        )

        assert(indexDocs.result.some((doc) => doc.id === cr.id))
      },
    )

    await t.step(
      "Should not add document by id or index if any entry already exists",
      async () => {
        await reset()

        const cr1 = await db.indexablePeople.set("id1", testPerson)
        assert(cr1.ok)

        const cr2 = await db.indexablePeople.set("id2", testPerson)
        assert(!cr2.ok)
      },
    )

    await t.step(
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

  // Test "write" method
  await t.step("write", async (t) => {
    await t.step("Should write new document to the collection", async () => {
      await reset()

      const id = "id"
      const value = testPerson

      const cr = await db.indexablePeople.write(id, value)
      assert(cr.ok)
      assert(cr.id === id)

      const doc = await db.indexablePeople.find(id)
      assert(doc !== null)
      assert(doc.value.name === value.name)

      const count = await db.indexablePeople.count({
        filter: (doc) => doc.value.name === value.name,
      })

      assert(count === 1)
    })

    await t.step(
      "Should write over existing document in the collection",
      async () => {
        await reset()

        const id = "id"

        const crPrep = await db.indexablePeople.set(id, testPerson)
        assert(crPrep.ok)

        const cr = await db.indexablePeople.write(id, testPerson2)
        assert(cr.ok)
        assert(cr.id === id)

        const doc = await db.indexablePeople.find(id)
        assert(doc !== null)
        assert(doc.value.name === testPerson2.name)

        const count = await db.indexablePeople.count({
          filter: (doc) => doc.value.name === testPerson2.name,
        })

        assert(count === 1)
      },
    )

    await t.step(
      "Should not write over existing document in the collection with index collisions",
      async () => {
        await reset()

        const id = "id"
        const value = testPerson

        const crPrep = await db.indexablePeople.set(id, value)
        assert(crPrep.ok)

        const cr = await db.indexablePeople.write(id, value)
        assert(!cr.ok)
      },
    )
  })

  // Test "addMany" method
  await t.step("addMany", async (t) => {
    await t.step(
      "Should add all document entries and index entries",
      async () => {
        await reset()

        const people = generatePeople(100)
        const crs = await db.indexablePeople.addMany(people)
        assert(crs.every((cr) => cr.ok))

        const allPeople = await db.indexablePeople.getMany()

        assert(allPeople.result.length === people.length)

        assert(
          allPeople.result.every((doc) =>
            crs.some((cr) => cr.ok && cr.id === doc.id)
          ),
        )

        const byName1 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          allPeople.result[0].value.name ?? "",
        )

        const byName2 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          allPeople.result[1].value.name ?? "",
        )

        assert(byName1 !== null)
        assert(byName2 !== null)

        const byAge = await db.indexablePeople.findBySecondaryIndex(
          "age",
          allPeople.result[0].value.age ?? 0,
        )

        assert(byAge.result.length > 0)
      },
    )

    await t.step(
      "Should not add document entries with duplicate indices",
      async () => {
        await reset()

        const crs = await db.indexablePeople.addMany([testPerson, testPerson])

        assert(crs.some((cr) => !cr.ok))

        const people = await db.indexablePeople.getMany()

        assert(people.result.length === 1)

        const byName = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )

        assert(byName !== null)

        const byAge = await db.indexablePeople.findBySecondaryIndex("age", 24)

        assert(byAge.result.length === 1)
      },
    )
  })

  // Test "findByPrimaryIndex" method
  await t.step("findByPrimaryIndex", async (t) => {
    await t.step("Should find document by primary index", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) {
        throw Error("document was not added to collection usccessfully")
      }

      const indexDoc = await db.indexablePeople.findByPrimaryIndex(
        "name",
        testPerson.name,
      )

      assert(indexDoc !== null)
      assert(indexDoc.id === cr.id)
      assert(indexDoc.value.name === testPerson.name)
    })
  })

  // Test "findBySecondaryIndex" method
  await t.step("findBySecondaryIndex", async (t) => {
    await t.step("Should find documents by secondary index", async () => {
      await reset()

      const cr1 = await db.indexablePeople.add(testPerson)
      const cr2 = await db.indexablePeople.add(testPerson2)
      assert(cr1.ok && cr2.ok)

      const peopleByAge24 = await db.indexablePeople.findBySecondaryIndex(
        "age",
        24,
      )
      assert(peopleByAge24.result.some((p) => p.id === cr1.id))
      assert(peopleByAge24.result.some((p) => p.id === cr2.id))
    })
  })

  // Test "delete" method
  await t.step("delete", async (t) => {
    await t.step(
      "Should delete all index entries of document by id",
      async () => {
        await reset()

        const cr = await db.indexablePeople.add(testPerson)
        if (!cr.ok) {
          throw Error("document was not added to collection usccessfully")
        }

        const idDoc1 = await db.indexablePeople.find(cr.id)
        assert(idDoc1 !== null)

        const indexDoc1 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )
        assert(indexDoc1 !== null)

        await db.indexablePeople.delete(cr.id)

        const idDoc2 = await db.indexablePeople.find(cr.id)
        assert(idDoc2 === null)

        const indexDoc2 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )
        assert(indexDoc2 === null)

        const indexDocs = await db.indexablePeople.findBySecondaryIndex(
          "age",
          24,
        )

        assert(indexDocs.result.length === 0)
      },
    )

    await t.step(
      "Should delete all index entries of multiple documents by ids",
      async () => {
        await reset()

        const cr1 = await db.indexablePeople.add(testPerson)
        const cr2 = await db.indexablePeople.add(testPerson2)

        assert(cr1.ok)
        assert(cr2.ok)

        const allPeople1 = await db.indexablePeople.getMany()
        assert(allPeople1.result.length === 2)

        const indexDoc1_1 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )

        const indexDoc2_1 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson2.name,
        )

        assert(indexDoc1_1 !== null)
        assert(indexDoc2_1 !== null)

        const peopleByAge1 = await db.indexablePeople.findBySecondaryIndex(
          "age",
          24,
        )

        assert(peopleByAge1.result.length === 2)

        await db.indexablePeople.delete(cr1.id, cr2.id)

        const allPeople2 = await db.indexablePeople.getMany()
        assert(allPeople2.result.length === 0)

        const indexDoc1_2 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )

        const indexDoc2_2 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson2.name,
        )

        assert(indexDoc1_2 === null)
        assert(indexDoc2_2 === null)

        const peopleByAge2 = await db.indexablePeople.findBySecondaryIndex(
          "age",
          24,
        )

        assert(peopleByAge2.result.length === 0)
      },
    )
  })

  // Test "update" method
  await t.step("update", async (t) => {
    await t.step("Should update data with merged value", async () => {
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

      const nameDoc = await db.indexablePeople.findByPrimaryIndex(
        "name",
        "Oliver",
      )

      const { result } = await db.indexablePeople.findBySecondaryIndex(
        "age",
        77,
      )
      const [ageDoc] = result

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

    await t.step("Should not update document with index conflict", async () => {
      await reset()

      const cr1 = await db.indexablePeople.add(testPerson)
      const cr12 = await db.indexablePeople.add(testPerson2)
      assert(cr1.ok && cr12.ok)

      const cr3 = await db.indexablePeople.update(cr1.id, {
        name: testPerson2.name,
      })

      assert(!cr3.ok)

      const doc1 = await db.indexablePeople.find(cr1.id)
      assert(doc1?.value.name === testPerson.name)
    })
  })

  // Test "updateByPrimaryIndex" method
  await t.step("updateByPrimaryIndex", async (t) => {
    await t.step(
      "Should update data with merged value by primary index",
      async () => {
        await reset()

        const cr1 = await db.indexablePeople.add(testPerson)

        assert(cr1.ok)

        const cr2 = await db.indexablePeople.updateByPrimaryIndex(
          "name",
          testPerson.name,
          {
            age: 77,
            address: {
              country: "Sweden",
              city: null,
            },
            friends: [],
          },
        )

        assert(cr2.ok)

        const idDoc = await db.indexablePeople.find(cr1.id)

        const nameDoc = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )

        const { result } = await db.indexablePeople.findBySecondaryIndex(
          "age",
          77,
        )
        const [ageDoc] = result

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
      },
    )

    await t.step("Should not update document with index conflict", async () => {
      await reset()

      const cr1 = await db.indexablePeople.add(testPerson)
      const cr12 = await db.indexablePeople.add(testPerson2)
      assert(cr1.ok && cr12.ok)

      const cr3 = await db.indexablePeople.updateByPrimaryIndex(
        "name",
        testPerson.name,
        {
          name: testPerson2.name,
        },
      )

      assert(!cr3.ok)

      const doc1 = await db.indexablePeople.find(cr1.id)
      assert(doc1?.value.name === testPerson.name)
    })
  })

  // Test "updateBySecondaryIndex" method
  await t.step("updateBySecondaryIndex", async (t) => {
    await t.step(
      "Should partially update all documents by secondary index",
      async () => {
        await reset()

        const crs = await db.indexablePeople.addMany([testPerson, testPerson2])
        assert(crs.every((cr) => cr.ok))

        const newAge = 99

        const count1 = await db.indexablePeople.count({
          filter: (doc) => doc.value.age === newAge,
        })

        assert(count1 === 0)

        await db.indexablePeople.updateBySecondaryIndex("age", testPerson.age, {
          age: newAge,
        })

        const count2 = await db.indexablePeople.count({
          filter: (doc) => doc.value.age === newAge,
        })

        assert(count2 === 2)
      },
    )

    await t.step(
      "Should only update filtered documents by secondary index",
      async () => {
        await reset()

        const cr1 = await db.indexablePeople.add(testPerson)
        const cr2 = await db.indexablePeople.add(testPerson2)
        assert(cr1.ok && cr2.ok)

        const newAge = 99

        const { result } = await db.indexablePeople.updateBySecondaryIndex(
          "age",
          testPerson.age,
          { age: newAge },
          {
            filter: (doc) => doc.value.name === testPerson.name,
          },
        )

        assert(result.every((cr) => cr.ok))

        const doc1 = await db.indexablePeople.find(cr1.id)
        const doc2 = await db.indexablePeople.find(cr2.id)
        assert(doc1?.value.age === newAge)
        assert(doc2?.value.age === testPerson2.age)
      },
    )

    await t.step(
      "Should only update 1 document with new primary index data",
      async () => {
        await reset()

        const cr1 = await db.indexablePeople.add(testPerson)
        const cr2 = await db.indexablePeople.add(testPerson2)
        assert(cr1.ok && cr2.ok)

        const newName = "new_name"

        const { result } = await db.indexablePeople.updateBySecondaryIndex(
          "age",
          testPerson.age,
          {
            name: newName,
          },
        )

        assert(result.some((cr) => cr.ok))
        assert(result.some((cr) => !cr.ok))

        const count = await db.indexablePeople.count({
          filter: (doc) => doc.value.name === newName,
        })

        assert(count === 1)
      },
    )
  })

  // Test "updateMany" method
  await t.step("updateMany", async (t) => {
    await t.step("Should partially update all documents", async () => {
      await reset()

      const people = generatePeople(50)
      const crs = await db.indexablePeople.addMany(people)
      assert(crs.every((cr) => cr.ok))

      const newAge = 99

      const count1 = await db.indexablePeople.count({
        filter: (doc) => doc.value.age === newAge,
      })

      assert(count1 < people.length)

      await db.indexablePeople.updateMany({ age: newAge })

      const count2 = await db.indexablePeople.count({
        filter: (doc) => doc.value.age === newAge,
      })

      assert(count2 === people.length)
    })

    await t.step("Should only update filtered documents", async () => {
      await reset()

      const cr1 = await db.indexablePeople.add(testPerson)
      const cr2 = await db.indexablePeople.add(testPerson2)
      assert(cr1.ok && cr2.ok)

      const newAge = 99

      const { result } = await db.indexablePeople.updateMany({ age: newAge }, {
        filter: (doc) => doc.value.name === testPerson.name,
      })

      assert(result.every((cr) => cr.ok))

      const doc1 = await db.indexablePeople.find(cr1.id)
      const doc2 = await db.indexablePeople.find(cr2.id)
      assert(doc1?.value.age === newAge)
      assert(doc2?.value.age === testPerson2.age)
    })

    await t.step(
      "Should only update 1 document with new primary index data",
      async () => {
        await reset()

        const cr1 = await db.indexablePeople.add(testPerson)
        const cr2 = await db.indexablePeople.add(testPerson2)
        assert(cr1.ok && cr2.ok)

        const newName = "new_name"

        const { result } = await db.indexablePeople.updateMany({
          name: newName,
        })

        assert(result.some((cr) => cr.ok))
        assert(result.some((cr) => !cr.ok))

        const count = await db.indexablePeople.count({
          filter: (doc) => doc.value.name === newName,
        })

        assert(count === 1)
      },
    )
  })

  // Test "getMany" method
  await t.step("getMany", async (t) => {
    await t.step("Should get exactly one copy of every document", async () => {
      await reset()

      const cr1 = await db.indexablePeople.add(testPerson)
      const cr2 = await db.indexablePeople.add(testPerson2)
      assert(cr1.ok && cr2.ok)

      const all = await db.indexablePeople.getMany()
      assert(all.result.length === 2)
      assert(all.result.some((doc) => doc.id === cr1.id))
      assert(all.result.some((doc) => doc.id === cr2.id))
    })

    await t.step("Should get all documents by pagination", async () => {
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
  await t.step("deleteMany", async (t) => {
    await t.step(
      "Should delete all document entries of all documents",
      async () => {
        await reset()

        // Add test objects
        const people = generatePeople(100)
        const crs = await db.indexablePeople.addMany(people)
        assert(crs.every((cr) => cr.ok))

        // Check that test objects can be found by id and index before delete
        const [cr1, cr2] = crs
        const [p1, p2] = people
        if (!cr1 || !cr2 || !cr1.ok || !cr2.ok || !p1 || !p2) {
          throw Error("No result object or error result")
        }

        const idDoc1_1 = await db.indexablePeople.find(cr1.id)
        assert(idDoc1_1 !== null)

        const indexDoc1_1 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          p1.name,
        )
        assert(indexDoc1_1 !== null)

        const idDoc2_1 = await db.indexablePeople.find(cr2.id)
        assert(idDoc2_1 !== null)

        const indexDoc2_1 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          p2.name,
        )
        assert(indexDoc2_1 !== null)

        const indexDocs1 = await db.indexablePeople.findBySecondaryIndex(
          "age",
          p1.age,
        )

        assert(indexDocs1.result.length > 0)

        // Delete test objects
        await db.indexablePeople.deleteMany()

        // Check that test objects can not be found by id and index after delete
        const idDoc1_2 = await db.indexablePeople.find(cr1.id)
        assert(idDoc1_2 === null)

        const indexDoc1_2 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          p1.name,
        )
        assert(indexDoc1_2 === null)

        const idDoc2_2 = await db.indexablePeople.find(cr2.id)
        assert(idDoc2_2 === null)

        const indexDoc2_2 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          p2.name,
        )
        assert(indexDoc2_2 === null)

        // Check that secondary indices are deleted
        const indexDocs2 = await db.indexablePeople.findBySecondaryIndex(
          "age",
          p1.age,
        )

        assert(indexDocs2.result.length === 0)
      },
    )

    await t.step(
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

        const indexDoc1_1 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )
        assert(indexDoc1_1 !== null)

        const idDoc2_1 = await db.indexablePeople.find(cr2.id)
        assert(idDoc2_1 !== null)

        const indexDoc2_1 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson2.name,
        )
        assert(indexDoc2_1 !== null)

        // Delete test objects
        await db.indexablePeople.deleteMany({
          filter: (doc) => doc.value.name === testPerson.name,
        })

        // Check that filtered test objects can not be found by id and index after delete, while un-fitlered can be found
        const idDoc1_2 = await db.indexablePeople.find(cr1.id)
        assert(idDoc1_2 === null)

        const indexDoc1_2 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )
        assert(indexDoc1_2 === null)

        const idDoc2_2 = await db.indexablePeople.find(cr2.id)
        assert(idDoc2_2 !== null)

        const indexDoc2_2 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson2.name,
        )
        assert(indexDoc2_2 !== null)
      },
    )

    await t.step("Should delete all records using pagination", async () => {
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

  // Test "count" method
  await t.step("count", async (t) => {
    await t.step(
      "Should correctly count all documents in collection",
      async () => {
        await reset()

        await db.indexablePeople.addMany([testPerson, testPerson2])

        const allPeople = await db.indexablePeople.getMany()
        assert(allPeople.result.length === 2)

        const count = await db.indexablePeople.count()
        assert(count === 2)
      },
    )

    await t.step("Should correctly count filtered documents", async () => {
      await reset()

      await db.indexablePeople.addMany([testPerson, testPerson2])

      const allPeople = await db.indexablePeople.getMany()
      assert(allPeople.result.length === 2)

      const count = await db.indexablePeople.count({
        filter: (doc) => doc.value.name === testPerson.name,
      })

      assert(count === 1)
    })
  })

  // Test "map" method
  await t.step("map", async (t) => {
    await t.step(
      "Should map from all documents to document fields",
      async () => {
        await reset()

        const crs = await db.indexablePeople.addMany([testPerson, testPerson2])
        assert(crs.every((cr) => cr.ok))

        const names = await db.indexablePeople.map((doc) => doc.value.name)
        assert(names.result.length === 2)
        assert(names.result.every((id) => typeof id === "string"))

        const docsByName = await Promise.all(
          names.result.map((name) =>
            db.indexablePeople.findByPrimaryIndex("name", name)
          ),
        )
        assert(docsByName.length === 2)
        assert(docsByName.every((doc) => doc !== null))
      },
    )

    await t.step(
      "Should map from all filtered documents to document fields",
      async () => {
        await reset()

        const crs = await db.indexablePeople.addMany([testPerson, testPerson2])
        assert(crs.every((cr) => cr.ok))

        const names = await db.indexablePeople.map((doc) => doc.value.name, {
          filter: (doc) => doc.value.name === testPerson.name,
        })

        assert(names.result.length === 1)
        assert(names.result.every((id) => typeof id === "string"))

        const docsByName = await Promise.all(
          names.result.map((name) =>
            db.indexablePeople.findByPrimaryIndex("name", name)
          ),
        )

        assert(docsByName.length === 1)
        assert(docsByName.every((doc) => doc !== null))
      },
    )
  })

  // Test "enqueue" method
  await t.step("enqueue", async (t) => {
    await t.step("Should enqueue message with string data", async () => {
      await useTemporaryKv(async (kv) => {
        const data = "data"

        const db = kvdex(kv, {
          numbers: indexableCollection<Person>().build({ indices: {} }),
        })

        let assertion = false

        await db.numbers.enqueue("data")

        kv.listenQueue((msg) => {
          const qMsg = msg as QueueMessage
          assertion = qMsg.collectionKey !== null && qMsg.data === data
        })

        await sleep(500)
        assert(assertion)
      })
    })
  })

  // Test "listenQueue" method
  await t.step("listenQueue", async (t) => {
    await t.step("Should receive message with string data", async () => {
      await useTemporaryKv(async (kv) => {
        const data = "data"

        const db = kvdex(kv, {
          numbers: indexableCollection<Person>().build({ indices: {} }),
        })

        let assertion = false

        await kv.enqueue({
          collectionKey: db.numbers._keys.baseKey,
          data,
        } as QueueMessage)

        db.numbers.listenQueue((msgData) => {
          assertion = msgData === data
        })

        await sleep(500)
        assert(assertion)
      })
    })

    await t.step("Should not receive db queue message", async () => {
      await useTemporaryKv(async (kv) => {
        const data = "data"

        const db = kvdex(kv, {
          numbers: indexableCollection<Person>().build({ indices: {} }),
        })

        await db.enqueue(data)

        let assertion = true

        db.numbers.listenQueue(() => {
          assertion = false
        })

        await sleep(500)
        assert(assertion)
      })
    })
  })

  // Test "deleteByPrimaryIndex" method
  await t.step("deleteByPrimaryIndex", async (t) => {
    await t.step("Should delete document entry by primary index", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      assert(cr.ok)

      const count1 = await db.indexablePeople.count()
      assert(count1 > 0)

      const byName1 = await db.indexablePeople.findByPrimaryIndex(
        "name",
        testPerson.name,
      )

      assert(byName1 !== null)

      const byAge1 = await db.indexablePeople.findBySecondaryIndex(
        "age",
        testPerson.age,
      )
      assert(byAge1.result.length > 0)

      // Perform delete by primary index
      await db.indexablePeople.deleteByPrimaryIndex("name", testPerson.name)

      const count2 = await db.indexablePeople.count()
      assert(count2 === 0)

      const byName2 = await db.indexablePeople.findByPrimaryIndex(
        "name",
        testPerson.name,
      )

      assert(byName2 === null)

      const byAge2 = await db.indexablePeople.findBySecondaryIndex(
        "age",
        testPerson.age,
      )

      assert(byAge2.result.length === 0)
    })
  })

  // Test "deleteBySecondaryIndex" method
  await t.step("deleteBySecondaryIndex", async (t) => {
    await t.step(
      "Should delete all document entries by secondary index",
      async () => {
        await reset()

        const [cr1, cr2] = await db.indexablePeople.addMany([
          testPerson,
          testPerson2,
        ])
        assert(cr1.ok && cr2.ok)

        const count1 = await db.indexablePeople.count()
        assert(count1 === 2)

        const byName1_1 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )

        const byName2_1 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson2.name,
        )

        assert(byName1_1 !== null && byName2_1 !== null)

        const byAge1 = await db.indexablePeople.findBySecondaryIndex(
          "age",
          testPerson.age,
        )

        assert(byAge1.result.length === 2)

        // Perform delete by secondary index
        await db.indexablePeople.deleteBySecondaryIndex("age", testPerson.age)

        const count2 = await db.indexablePeople.count()
        assert(count2 === 0)

        const byName1_2 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )

        const byName2_2 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson2.name,
        )

        assert(byName1_2 === null && byName2_2 === null)

        const byAge2 = await db.indexablePeople.findBySecondaryIndex(
          "age",
          testPerson.age,
        )

        assert(byAge2.result.length === 0)
      },
    )

    await t.step(
      "Should only delete filtered document entries by secondary index",
      async () => {
        await reset()

        const people = generatePeople(100)
        const crs = await db.indexablePeople.addMany(people)
        assert(crs.every((cr) => cr.ok))

        const count1 = await db.indexablePeople.count()
        assert(count1 === people.length)

        const [p1] = people

        const byName1 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          p1.name,
        )

        assert(byName1 !== null)

        const byAge1 = await db.indexablePeople.findBySecondaryIndex(
          "age",
          p1.age,
        )

        const byAgeCount1 = byAge1.result.length
        assert(byAgeCount1 > 0)

        // Perform delete by secondary index with filtering
        await db.indexablePeople.deleteBySecondaryIndex("age", p1.age, {
          filter: (doc) => doc.value.name === p1.name,
        })

        const count2 = await db.indexablePeople.count()
        assert(count2 === people.length - 1)

        const byName2 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          p1.name,
        )

        assert(byName2 === null)

        const byAge2 = await db.indexablePeople.findBySecondaryIndex(
          "age",
          p1.age,
        )

        const byAgeCount2 = byAge2.result.length
        assert(byAgeCount2 === byAgeCount1 - 1)
      },
    )
  })

  // Perform last reset
  await t.step("RESET", async () => await reset())
})
