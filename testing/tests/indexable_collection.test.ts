import { db, testPerson, reset, testPerson2 } from "../config.ts"
import { assert } from "../deps.ts"

Deno.test("indexable_collection", async t1 => {
  // Test the configuration
  await t1.step("config", async t2 => {
    await t2.step("Should not find document by index after reset", async () => {
      await reset()

      const indexDoc = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name
      })
      assert(indexDoc === null)

      const pplById = await db.indexablePeople.getMany()
      assert(pplById.length === 0)

      const pplByAge = await db.indexablePeople.findBySecondaryIndex({ age: 24 })
      assert(pplByAge.length === 0)
    })
  })

  // Test "add" method
  await t1.step("add", async t2 => {
    await t2.step("Should add document to collection by id and defined index", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) throw Error("Did not add document to collection successfully")

      const idDoc = await db.indexablePeople.find(cr.id)
      assert(idDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const indexDoc = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name
      })

      assert(indexDoc !== null)
      assert(indexDoc.value.name === testPerson.name)

      const indexDocs = await db.indexablePeople.findBySecondaryIndex({
        age: 24 
      })

      assert(indexDocs.some(doc => doc.id === cr.id))
    })

    await t2.step("Should add document to collection by id, but not by undefined index", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) throw Error("Did not add document to collection successfully")

      const idDoc = await db.indexablePeople.find(cr.id)
      assert(idDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const indexDoc = await db.indexablePeople.findByPrimaryIndex({
        age: testPerson.age
      })

      assert(indexDoc === null)

      const indexDocs = await db.indexablePeople.findBySecondaryIndex({
        username: "oliver"
      })

      assert(indexDocs.length === 0)
    })

    await t2.step("Should add document to collection by id and only defined index", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) throw Error("Did not add document to collection successfully")

      const idDoc = await db.indexablePeople.find(cr.id)
      assert(idDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const indexDoc = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name
      })

      assert(indexDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const undefinedDoc = await db.indexablePeople.findByPrimaryIndex({
        age: testPerson.age
      })

      assert(undefinedDoc === null)
    })

    await t2.step("Should not add document by id or index if any entry already exists", async () => {
      await reset()

      const cr1 = await db.indexablePeople.add(testPerson)
      assert(cr1.ok)

      const cr2 = await db.indexablePeople.add(testPerson)
      assert(!cr2.ok)
    })
  })

  // Test "set" method
  await t1.step("set", async t2 => {
    await t2.step("Should add document to collection by given id and defined index", async () => {
      await reset()

      const id = "oliver"

      const cr = await db.indexablePeople.set(id, testPerson)
      if (!cr.ok) throw Error("Did not add document to collection successfully")

      const idDoc = await db.indexablePeople.find(id)
      assert(idDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const indexDoc = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name
      })

      assert(indexDoc !== null)
      assert(indexDoc.value.name === testPerson.name)

      const indexDocs = await db.indexablePeople.findBySecondaryIndex({
        age: 24 
      })

      assert(indexDocs.some(doc => doc.id === cr.id))
    })

    await t2.step("Should add document to collection by given id, but not by undefined index", async () => {
      await reset()

      const id = "oliver"

      const cr = await db.indexablePeople.set(id, testPerson)
      if (!cr.ok) throw Error("Did not add document to collection successfully")

      const idDoc = await db.indexablePeople.find(cr.id)
      assert(idDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const indexDoc = await db.indexablePeople.findByPrimaryIndex({
        age: testPerson.age
      })

      assert(indexDoc === null)

      const indexDocs = await db.indexablePeople.findBySecondaryIndex({
        username: "oliver"
      })

      assert(indexDocs.length === 0)
    })

    await t2.step("Should add document to collection by given id and only defined index", async () => {
      await reset()

      const id = "oliver"

      const cr = await db.indexablePeople.set(id, testPerson)
      if (!cr.ok) throw Error("Did not add document to collection successfully")

      const idDoc = await db.indexablePeople.find(id)
      assert(idDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const indexDoc = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name
      })

      assert(indexDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const undefinedDoc = await db.indexablePeople.findByPrimaryIndex({
        age: testPerson.age
      })

      assert(undefinedDoc === null)
    })

    await t2.step("Should not add document by id or index if any entry already exists", async () => {
      await reset()

      const cr1 = await db.indexablePeople.set("id1", testPerson)
      assert(cr1.ok)

      const cr2 = await db.indexablePeople.set("id2", testPerson)
      assert(!cr2.ok)
    })

    await t2.step("Should not add document by id or index if id entry already exists", async () => {
      await reset()

      const cr1 = await db.indexablePeople.set("id1", testPerson)
      assert(cr1.ok)

      const cr2 = await db.indexablePeople.set("id1", testPerson2)
      assert(!cr2.ok)
    })
  })

  // Test "findByIndex" method
  await t1.step("findByPrimaryIndex", async t2 => {
    await t2.step("Should find document by primary index", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) throw Error("document was not added to collection usccessfully")

      const indexDoc = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name
      })

      assert(indexDoc !== null)
      assert(indexDoc.id === cr.id)
      assert(indexDoc.value.name === testPerson.name)
    })

    await t2.step("Should not find document by undefined primary index", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) throw Error("document was not added to collection usccessfully")

      const indexDoc = await db.indexablePeople.findByPrimaryIndex({
        age: testPerson.age
      })

      assert(indexDoc === null)
    })

    await t2.step("Should find document by selection of defined and undefined primary index", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) throw Error("document was not added to collection usccessfully")

      const indexDoc = await db.indexablePeople.findByPrimaryIndex({
        age: testPerson.age,
        name: testPerson.name
      })

      assert(indexDoc !== null)
      assert(indexDoc.id === cr.id)
      assert(indexDoc.value.name === testPerson.name)
    })
  })

  // Test "findBySecondaryIndex" method
  await t1.step("findBySecondaryIndex", async t2 => {
    await t2.step("Should find documents by secondary index", async () => {
      await reset()

      const cr1 = await db.indexablePeople.add(testPerson)
      const cr2 = await db.indexablePeople.add(testPerson2)
      assert(cr1.ok && cr2.ok)

      const peopleByAge24 = await db.indexablePeople.findBySecondaryIndex({ age: 24 })
      assert(peopleByAge24.some(p => p.id === cr1.id))
      assert(peopleByAge24.some(p => p.id === cr2.id))
    })
  })

  // Test "delete" method
  await t1.step("delete", async t2 => {
    await t2.step("Should delete all index entries of document", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) throw Error("document was not added to collection usccessfully")

      const idDoc1 = await db.indexablePeople.find(cr.id)
      assert(idDoc1 !== null)

      const indexDoc1 = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name
      })
      assert(indexDoc1 !== null)

      await db.indexablePeople.delete(cr.id)

      const idDoc2 = await db.indexablePeople.find(cr.id)
      assert(idDoc2 === null)

      const indexDoc2 = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name
      })
      assert(indexDoc2 === null)

      const indexDocs = await db.indexablePeople.findBySecondaryIndex({
        age: 24
      })

      assert(indexDocs.length === 0)
    })
  })

  // Test "getMany" method
  await t1.step("getMany", async t2 => {
    await t2.step("Should get exactly one copy of every document", async () => {
      await reset()

      const cr1 = await db.indexablePeople.add(testPerson)
      const cr2 = await db.indexablePeople.add(testPerson2)
      assert(cr1.ok && cr2.ok)

      const all = await db.indexablePeople.getMany()
      assert(all.length === 2)
      assert(all.some(doc => doc.id === cr1.id))
      assert(all.some(doc => doc.id === cr2.id))
    })
  })

  // Test "deleteMany" method
  await t1.step("deleteMany", async t2 => {
    await t2.step("Should delete all document entries of all documents", async () => {
      await reset()

      // Add test objects
      const cr1 = await db.indexablePeople.add(testPerson)
      const cr2 = await db.indexablePeople.add(testPerson2)
      if (!cr1.ok || !cr2.ok) throw Error("documents were not added to collection successfully")

      // Check that test objects can be found by id and index before delete
      const idDoc1_1 = await db.indexablePeople.find(cr1.id)
      assert(idDoc1_1 !== null)

      const indexDoc1_1 = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name
      })
      assert(indexDoc1_1 !== null)

      const idDoc2_1 = await db.indexablePeople.find(cr2.id)
      assert(idDoc2_1 !== null)

      const indexDoc2_1 = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson2.name
      })
      assert(indexDoc2_1 !== null)

      // Delete test objects
      await db.indexablePeople.deleteMany()

      // Check that test objects can not be found by id and index after delete
      const idDoc1_2 = await db.indexablePeople.find(cr1.id)
      assert(idDoc1_2 === null)

      const indexDoc1_2 = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name
      })
      assert(indexDoc1_2 === null)

      const idDoc2_2 = await db.indexablePeople.find(cr2.id)
      assert(idDoc2_2 === null)

      const indexDoc2_2 = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson2.name
      })
      assert(indexDoc2_2 === null)

      // Check that secondary indices are deleted
      const indexDocs = await db.indexablePeople.findBySecondaryIndex({
        username: "oliver"
      })

      assert(indexDocs.length === 0)
    })

    await t2.step("Should only delete document entries of filtered documents", async () => {
      await reset()

      // Add test objects
      const cr1 = await db.indexablePeople.add(testPerson)
      const cr2 = await db.indexablePeople.add(testPerson2)
      if (!cr1.ok || !cr2.ok) throw Error("documents were not added to collection successfully")

      // Check that test objects can be found by id and index before delete
      const idDoc1_1 = await db.indexablePeople.find(cr1.id)
      assert(idDoc1_1 !== null)

      const indexDoc1_1 = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name
      })
      assert(indexDoc1_1 !== null)

      const idDoc2_1 = await db.indexablePeople.find(cr2.id)
      assert(idDoc2_1 !== null)

      const indexDoc2_1 = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson2.name
      })
      assert(indexDoc2_1 !== null)

      // Delete test objects
      await db.indexablePeople.deleteMany({
        filter: doc => doc.value.name === testPerson.name
      })

      // Check that filtered test objects can not be found by id and index after delete, while un-fitlered can be found
      const idDoc1_2 = await db.indexablePeople.find(cr1.id)
      assert(idDoc1_2 === null)

      const indexDoc1_2 = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name
      })
      assert(indexDoc1_2 === null)

      const idDoc2_2 = await db.indexablePeople.find(cr2.id)
      assert(idDoc2_2 !== null)

      const indexDoc2_2 = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson2.name
      })
      assert(indexDoc2_2 !== null)
    })
  })

  // Perform last reset
  await t1.step("RESET", async () => await reset())
})