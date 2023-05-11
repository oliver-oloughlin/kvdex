import { db, testPerson, reset } from "../config.ts"
import { assert } from "../deps.ts"

Deno.test("indexable_collection", async t1 => {
  // Test the configuration
  await t1.step("config", async t2 => {
    await t2.step("Should not find document by index after reset", async () => {
      await reset()

      const indexDoc = await db.indexablePeople.findByIndex({
        name: testPerson.name
      })

      assert(indexDoc === null)
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

      const indexDoc = await db.indexablePeople.findByIndex({
        name: testPerson.name
      })

      assert(indexDoc !== null)
      assert(indexDoc.value.name === testPerson.name)
    })

    await t2.step("Should add document to collection by id, but not by undefined index", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) throw Error("Did not add document to collection successfully")

      const idDoc = await db.indexablePeople.find(cr.id)
      assert(idDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const indexDoc = await db.indexablePeople.findByIndex({
        age: testPerson.age
      })

      assert(indexDoc === null)
    })

    await t2.step("Should add document to collection by id and only defined index", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) throw Error("Did not add document to collection successfully")

      const idDoc = await db.indexablePeople.find(cr.id)
      assert(idDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const indexDoc = await db.indexablePeople.findByIndex({
        name: testPerson.name
      })

      assert(indexDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const undefinedDoc = await db.indexablePeople.findByIndex({
        age: testPerson.age
      })

      assert(undefinedDoc === null)
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

      const indexDoc = await db.indexablePeople.findByIndex({
        name: testPerson.name
      })

      assert(indexDoc !== null)
      assert(indexDoc.value.name === testPerson.name)
    })

    await t2.step("Should add document to collection by given id, but not by undefined index", async () => {
      await reset()

      const id = "oliver"

      const cr = await db.indexablePeople.set(id, testPerson)
      if (!cr.ok) throw Error("Did not add document to collection successfully")

      const idDoc = await db.indexablePeople.find(cr.id)
      assert(idDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const indexDoc = await db.indexablePeople.findByIndex({
        age: testPerson.age
      })

      assert(indexDoc === null)
    })

    await t2.step("Should add document to collection by given id and only defined index", async () => {
      await reset()

      const id = "oliver"

      const cr = await db.indexablePeople.set(id, testPerson)
      if (!cr.ok) throw Error("Did not add document to collection successfully")

      const idDoc = await db.indexablePeople.find(id)
      assert(idDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const indexDoc = await db.indexablePeople.findByIndex({
        name: testPerson.name
      })

      assert(indexDoc !== null)
      assert(idDoc.value.name === testPerson.name)

      const undefinedDoc = await db.indexablePeople.findByIndex({
        age: testPerson.age
      })

      assert(undefinedDoc === null)
    })
  })
})