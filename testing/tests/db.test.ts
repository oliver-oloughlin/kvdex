import { kvdb, collection } from "../../mod.ts"
import { db, reset, testPerson, testPerson2 } from "../config.ts"
import { assert, assertThrows } from "../deps.ts"

// Test atomic operations
Deno.test("db", async t1 => {
  // Test "kvdb" function
  await t1.step("kvdb", async t2 => {
    await t2.step("Should throw error when creating KVDB with duplicate collection keys", () => {
      assertThrows(() => kvdb({
        numbers1: collection<number>(["numbers"]),
        numbers2: collection<number>(["numbers"])
      }))

      assertThrows(() => kvdb({
        numbers: collection<number>(["numbers", 123, 123n]),
        nested: {
          numbers: collection<number>(["numbers", 123, 123n]),
          nested: {
            numbers: collection<number>(["numbers", 123, 123n])
          }
        }
      }))
    })

    await t2.step("Should not throw error when creating KVDB with unique collection keys", () => {
      assert(() => {
        kvdb({
          numbers1: collection<number>(["numbers1"]),
          numbers2: collection<number>(["numbers2"])
        })

        return true
      })

      assert(() => {
        kvdb({
          numbers: collection<number>(["numbers", 123, 123n]),
          nested: {
            numbers: collection<number>(["numbers", 1234, 123n]),
            nested: {
              numbers: collection<number>(["numbers", 123, 1234n])
            }
          }
        })

        return true
      })
    })
  })

  // Test "atomic" method
  await t1.step("atomic", async t2 => {
    await t2.step("Should add numbers to numbers collection", async () => {
      await reset()

      const r = await db
        .atomic(db => db.values.numbers)
        .add(1)
        .add(2)
        .add(3)
        .commit()

      const numbersResult = await db.values.numbers.getMany()

      assert(r !== null)
      assert(r.ok)
      assert(numbersResult.some(n => n.value === 1))
      assert(numbersResult.some(n => n.value === 2))
      assert(numbersResult.some(n => n.value === 3))
    })

    await t2.step("Should not commit new value", async () => {
      await reset()

      const cr = await db.values.strings.add("test1")
      if (!cr.ok) throw Error("'test1' not added to collection successfully")

      await db.values.strings.set(cr.id, "test2")

      const r = await db
        .atomic(db => db.values.strings)
        .check({
          id: cr.id,
          versionstamp: cr.versionstamp
        })
        .set(cr.id, "test3")
        .commit()

      assert(!r.ok)
    })

    await t2.step("Should add and sum value", async () => {
      await reset()

      const cr = await db.values.u64s.add(new Deno.KvU64(100n))
      if (!cr.ok) throw Error("'100n' not added to collection successfully")

      const r1 = await db.values.u64s.find(cr.id)

      assert(r1 !== null)
      assert(r1?.value.value === new Deno.KvU64(100n).value)

      const r2 = await db
        .atomic(db => db.values.u64s)
        .sum(cr.id, 10n)
        .commit()

      assert(r2 !== null)
      
      const r3 = await db.values.u64s.find(cr.id)

      assert(r3 !== null)
      assert(r3?.value.value === new Deno.KvU64(110n).value)
    })

    await t2.step("Should perform atomic operations using mutate", async () => {
      await reset()

      const cr = await db.values.numbers.add(10)
      if (!cr.ok) throw Error("'10' not added to collection successfully")

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
            id: cr.id
          }
        )
        .commit()

        const nums2 = await db.values.numbers.getMany()
        
        assert(r1.ok)
        assert(nums2.length === 2)
        assert(nums2.some(doc => doc.value === 1))
        assert(nums2.some(doc => doc.value === 2))
        assert(!nums2.some(doc => doc.value === 10))
    })
  })

  // Test "atomic" method with indexable collection
  await t1.step("indexable_atomic", async t2 => {
    await t2.step("Should add documents to collection with index entries by generated and given id", async () => {
      await reset()

      const id2 = "elias"

      await db
        .atomic(schema => schema.indexablePeople)
        .add(testPerson)
        .set(id2, testPerson2)
        .commit()

      const indexDoc1 = await db.indexablePeople.findByIndex({
        name: testPerson.name
      })
      assert(indexDoc1 !== null)
      assert(indexDoc1.value.name === testPerson.name)

      const idDoc2 = await db.indexablePeople.find(id2)
      assert(idDoc2 !== null)
      assert(idDoc2.value.name === testPerson2.name)

      const indexDoc2 = await db.indexablePeople.findByIndex({
        name: testPerson2.name
      })
      assert(indexDoc2 !== null)
      assert(indexDoc2.value.name === testPerson2.name)
    })

    await t2.step("Should delete all index entries for document", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) throw Error("document was not added to collection successfully")

      const idDoc1 = await db.indexablePeople.find(cr.id)
      assert(idDoc1 !== null)

      const indexDoc1 = await db.indexablePeople.findByIndex({
        name: testPerson.name
      })
      assert(indexDoc1 !== null)

      await db
        .atomic(schema => schema.indexablePeople)
        .delete(cr.id)
        .commit()

      const idDoc2 = await db.indexablePeople.find(cr.id)
      assert(idDoc2 === null)

      const indexDoc2 = await db.indexablePeople.findByIndex({
        name: testPerson.name
      })
      assert(indexDoc2 === null)
    })

    await t2.step("Should add and delete document with index entries using mutate", async () => {
      await reset()

      const id = "oliver"

      await db
        .atomic(schema => schema.indexablePeople)
        .mutate({
          type: "set",
          id,
          value: testPerson
        })
        .commit()

      const idDoc1 = await db.indexablePeople.find(id)
      assert(idDoc1 !== null)

      const indexDoc1 = await db.indexablePeople.findByIndex({
        name: testPerson.name
      })
      assert(indexDoc1 !== null)

      await db
        .atomic(schema => schema.indexablePeople)
        .mutate({
          type: "delete",
          id
        })
        .commit()

      const idDoc2 = await db.indexablePeople.find(id)
      assert(idDoc2 === null)

      const indexDoc2 = await db.indexablePeople.findByIndex({
        name: testPerson.name
      })
      assert(indexDoc2 === null)
    })

    await t2.step("Should fail atomic operation with add/delete document of same id", async () => {
      await reset()

      const id = "oliver"

      const cr1 = await db
        .atomic(schema => schema.indexablePeople)
        .set(id, testPerson)
        .delete(id)
        .commit()

      assert(!cr1.ok)

      const cr2 = await db
        .atomic(schema => schema.indexablePeople)
        .mutate(
          {
            type: "set",
            id,
            value: testPerson
          },
          {
            type: "delete",
            id
          }
        )
        .commit()
      
      assert(!cr2.ok)

      const cr3 = await db
        .atomic(schema => schema.indexablePeople)
        .delete(id)
        .select(schema => schema.values.numbers)
        .add(10)
        .select(schema => schema.indexablePeople)
        .mutate({
          type: "set",
          id,
          value: testPerson
        })
        .commit()

      assert(!cr3.ok)
    })

    await t2.step("Should fail atomic operation if writing to index entry that already exists", async () => {
      await reset()

      const cr1 = await db
        .atomic(schema => schema.indexablePeople)
        .add(testPerson)
        .commit()

      assert(cr1.ok)

      const cr2 = await db
        .atomic(schema => schema.indexablePeople)
        .add(testPerson)
        .commit()

      assert(!cr2.ok)

      const cr3 = await db
        .atomic(schema => schema.indexablePeople)
        .set("id1", testPerson)
        .commit()

      assert(!cr3.ok)

      const cr4 = await db
        .atomic(schema => schema.indexablePeople)
        .mutate({
          type: "set",
          id: "id2",
          value: testPerson
        })
        .commit()

      assert(!cr4.ok)
    })
  })
})