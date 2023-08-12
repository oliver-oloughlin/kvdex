import { collection, kvdex, QueueMessage } from "../../mod.ts"
import {
  db,
  reset,
  sleep,
  testPerson,
  testPerson2,
  useTemporaryKv,
} from "../config.ts"
import { assert } from "../deps.ts"
import { KVDEX_KEY_PREFIX } from "../../src/constants.ts"

// Test atomic operations
Deno.test("db", async (t1) => {
  // Test "kvdb" function
  await t1.step("kvdex", async (t2) => {
    await t2.step(
      "Should create unique keys for collections with equal name in different nestings",
      async () => {
        const kv = await Deno.openKv()

        const db = kvdex(kv, {
          numbers: collection<number>().build(),
          nested: {
            numbers: collection<number>().build(),
          },
        })

        const key1 = JSON.stringify(db.numbers._keys.baseKey)
        const key2 = JSON.stringify(db.nested.numbers._keys.baseKey)

        assert(key1 !== key2)
        assert(key1 === `["${KVDEX_KEY_PREFIX}","numbers"]`)
        assert(key2 === `["${KVDEX_KEY_PREFIX}","nested","numbers"]`)

        kv.close()
      },
    )
  })

  // Test "atomic" method
  await t1.step("atomic", async (t2) => {
    await t2.step("Should add numbers to numbers collection", async () => {
      await reset()

      const r = await db
        .atomic((db) => db.values.numbers)
        .add(1)
        .add(2)
        .add(3)
        .commit()

      const numbersResult = await db.values.numbers.getMany()

      assert(r !== null)
      assert(r.ok)
      assert(numbersResult.result.some((n) => n.value === 1))
      assert(numbersResult.result.some((n) => n.value === 2))
      assert(numbersResult.result.some((n) => n.value === 3))
    })

    await t2.step("Should not commit new value", async () => {
      await reset()

      const cr = await db.values.strings.set("id", "test1")
      if (!cr.ok) throw Error("document not added to collection successfully")

      await db.values.strings.delete(cr.id)

      await db.values.strings.set(cr.id, "test2")

      const r = await db
        .atomic((db) => db.values.strings)
        .check({
          id: cr.id,
          versionstamp: cr.versionstamp,
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
        .atomic((db) => db.values.u64s)
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
      assert(nums1.result.length === 1)

      const r1 = await db
        .atomic((schema) => schema.values.numbers)
        .mutate(
          {
            type: "set",
            id: "n1",
            value: 1,
          },
          {
            type: "set",
            id: "n2",
            value: 2,
          },
          {
            type: "delete",
            id: cr.id,
          },
        )
        .commit()

      const nums2 = await db.values.numbers.getMany()

      assert(r1.ok)
      assert(nums2.result.length === 2)
      assert(nums2.result.some((doc) => doc.value === 1))
      assert(nums2.result.some((doc) => doc.value === 2))
      assert(!nums2.result.some((doc) => doc.value === 10))
    })

    await t2.step(
      "Should not insert document with id that already exists",
      async () => {
        await reset()

        const cr1 = await db.people.add(testPerson)
        assert(cr1.ok)

        const cr2 = await db
          .atomic((schema) => schema.people)
          .set(cr1.id, testPerson2)
          .commit()

        assert(!cr2.ok)

        const cr3 = await db
          .atomic((schema) => schema.people)
          .mutate({
            type: "set",
            id: cr1.id,
            value: testPerson2,
          })
          .commit()

        assert(!cr3.ok)
      },
    )
  })

  // Test "atomic" method with indexable collection
  await t1.step("indexable_atomic", async (t2) => {
    await t2.step(
      "Should add documents to collection with index entries by generated and given id",
      async () => {
        await reset()

        const id2 = "elias"

        await db
          .atomic((schema) => schema.indexablePeople)
          .add(testPerson)
          .set(id2, testPerson2)
          .commit()

        const indexDoc1 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )
        assert(indexDoc1 !== null)
        assert(indexDoc1.value.name === testPerson.name)

        const idDoc2 = await db.indexablePeople.find(id2)
        assert(idDoc2 !== null)
        assert(idDoc2.value.name === testPerson2.name)

        const indexDoc2 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson2.name,
        )
        assert(indexDoc2 !== null)
        assert(indexDoc2.value.name === testPerson2.name)

        const indexDocs = await db.indexablePeople.findBySecondaryIndex(
          "age",
          24,
        )
        assert(indexDocs.result.some((doc) => doc.id === indexDoc1.id))
        assert(indexDocs.result.some((doc) => doc.id === id2))
      },
    )

    await t2.step("Should delete all index entries for document", async () => {
      await reset()

      const cr = await db.indexablePeople.add(testPerson)
      if (!cr.ok) {
        throw Error("document was not added to collection successfully")
      }

      const idDoc1 = await db.indexablePeople.find(cr.id)
      assert(idDoc1 !== null)

      const indexDoc1 = await db.indexablePeople.findByPrimaryIndex(
        "name",
        testPerson.name,
      )
      assert(indexDoc1 !== null)

      await db
        .atomic((schema) => schema.indexablePeople)
        .delete(cr.id)
        .commit()

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
    })

    await t2.step(
      "Should add and delete document with index entries using mutate",
      async () => {
        await reset()

        const id = "oliver"

        await db
          .atomic((schema) => schema.indexablePeople)
          .mutate({
            type: "set",
            id,
            value: testPerson,
          })
          .commit()

        const idDoc1 = await db.indexablePeople.find(id)
        assert(idDoc1 !== null)

        const indexDoc1 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )
        assert(indexDoc1 !== null)

        const indexDocs1 = await db.indexablePeople.findBySecondaryIndex(
          "age",
          24,
        )
        assert(indexDocs1.result.some((doc) => doc.id === idDoc1.id))

        await db
          .atomic((schema) => schema.indexablePeople)
          .mutate({
            type: "delete",
            id,
          })
          .commit()

        const idDoc2 = await db.indexablePeople.find(id)
        assert(idDoc2 === null)

        const indexDoc2 = await db.indexablePeople.findByPrimaryIndex(
          "name",
          testPerson.name,
        )
        assert(indexDoc2 === null)

        const indexDocs2 = await db.indexablePeople.findBySecondaryIndex(
          "age",
          24,
        )
        assert(indexDocs2.result.length === 0)
      },
    )

    await t2.step(
      "Should fail atomic operation with add/delete document of same id",
      async () => {
        await reset()

        const id = "oliver"

        const cr1 = await db
          .atomic((schema) => schema.indexablePeople)
          .set(id, testPerson)
          .delete(id)
          .commit()

        assert(!cr1.ok)

        const cr2 = await db
          .atomic((schema) => schema.indexablePeople)
          .mutate(
            {
              type: "set",
              id,
              value: testPerson,
            },
            {
              type: "delete",
              id,
            },
          )
          .commit()

        assert(!cr2.ok)

        const cr3 = await db
          .atomic((schema) => schema.indexablePeople)
          .delete(id)
          .select((schema) => schema.values.numbers)
          .add(10)
          .select((schema) => schema.indexablePeople)
          .mutate({
            type: "set",
            id,
            value: testPerson,
          })
          .commit()

        assert(!cr3.ok)
      },
    )

    await t2.step(
      "Should fail atomic operation if writing to index entry that already exists",
      async () => {
        await reset()

        const cr1 = await db
          .atomic((schema) => schema.indexablePeople)
          .add(testPerson)
          .commit()

        assert(cr1.ok)

        const cr2 = await db
          .atomic((schema) => schema.indexablePeople)
          .add(testPerson)
          .commit()

        assert(!cr2.ok)

        const cr3 = await db
          .atomic((schema) => schema.indexablePeople)
          .set("id1", testPerson)
          .commit()

        assert(!cr3.ok)

        const cr4 = await db
          .atomic((schema) => schema.indexablePeople)
          .mutate({
            type: "set",
            id: "id2",
            value: testPerson,
          })
          .commit()

        assert(!cr4.ok)
      },
    )
  })

  // Test "countAll" method
  await t1.step("countAll", async (t) => {
    await t.step(
      "Should count all document entries across all collections",
      async () => {
        await reset()

        await db.values.numbers.addMany(1, 2, 3, 4, 5)
        await db.values.strings.addMany("1", "2", "3", "4", "5")
        await db.people.addMany(testPerson, testPerson, testPerson)
        await db.indexablePeople.addMany(testPerson, testPerson2)

        const count = await db.countAll()
        assert(count === 15)
      },
    )
  })

  // Test "deleteAll" method
  await t1.step("deleteAll", async (t) => {
    await t.step(
      "Should delete all document entries across all collections",
      async () => {
        await reset()

        await db.values.numbers.addMany(1, 2, 3, 4, 5)
        await db.values.strings.addMany("1", "2", "3", "4", "5")
        await db.people.addMany(testPerson, testPerson, testPerson)
        await db.indexablePeople.addMany(testPerson, testPerson2)

        const count1 = await db.countAll()
        assert(count1 === 15)

        await db.deleteAll()

        const count2 = await db.countAll()
        assert(count2 === 0)
      },
    )
  })

  // Test "enqueue" method
  await t1.step("enqueue", async (t2) => {
    await t2.step("Should enqueue message with string data", async () => {
      await useTemporaryKv(async (kv) => {
        const data = "data"
        const db = kvdex(kv, {})
        let assertion = false

        await db.enqueue("data")

        kv.listenQueue((msg) => {
          const qMsg = msg as QueueMessage
          assertion = qMsg.data === data
        })

        await sleep(500)
        assert(assertion)
      })
    })
  })

  // Test "listenQueue" method
  await t1.step("listenQueue", async (t2) => {
    await t2.step("Should receive message with string data", async () => {
      await useTemporaryKv(async (kv) => {
        const data = "data"
        const db = kvdex(kv, {})
        let assertion = false

        await kv.enqueue({
          collectionKey: null,
          data,
        } as QueueMessage)

        db.listenQueue((msgData) => {
          assertion = msgData === data
        })

        await sleep(500)
        assert(assertion)
      })
    })

    await t2.step("Should not receive collection queue message", async () => {
      await useTemporaryKv(async (kv) => {
        const data = "data"

        const db = kvdex(kv, {
          numbers: collection<number>().build(),
        })

        await db.numbers.enqueue(data)

        let assertion = true

        db.listenQueue(() => {
          assertion = false
        })

        await sleep(500)
        assert(assertion)
      })
    })
  })

  // Test valid data types
  await t1.step("types", async (t2) => {
    await t2.step(
      "Should allow and properly store/retrieve all primitive types",
      async () => {
        const kv = await Deno.openKv()

        const db = kvdex(kv, {
          strings: collection<string>().build(),
          numbers: collection<number>().build(),
          bigints: collection<bigint>().build(),
          u64s: collection<Deno.KvU64>().build(),
        })

        await db.strings.add("str1")
        await db.numbers.add(1)
        await db.bigints.add(1n)
        await db.u64s.add(new Deno.KvU64(1n))

        await db.strings.forEach((doc) => assert(typeof doc.value === "string"))
        await db.numbers.forEach((doc) => assert(typeof doc.value === "number"))
        await db.bigints.forEach((doc) => assert(typeof doc.value === "bigint"))
        await db.u64s.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Deno.KvU64,
          )
        )

        await db.strings.deleteMany()
        await db.numbers.deleteMany()
        await db.bigints.deleteMany()
        await db.u64s.deleteMany()

        kv.close()
      },
    )

    await t2.step(
      "Should allow and properly store/retrieve array types",
      async () => {
        const kv = await Deno.openKv()

        const db = kvdex(kv, {
          arrs: collection<Array<string>>().build(),
          i8arrs: collection<Int8Array>().build(),
          i16arrs: collection<Int16Array>().build(),
          i32arrs: collection<Int32Array>().build(),
          i64arrs: collection<BigInt64Array>().build(),
          u8arrs: collection<Uint8Array>().build(),
          u16arrs: collection<Uint16Array>().build(),
          u32arrs: collection<Uint32Array>().build(),
          u64arrs: collection<BigUint64Array>().build(),
          u8carrs: collection<Uint8ClampedArray>().build(),
          f32arrs: collection<Float32Array>().build(),
          f64arrs: collection<Float64Array>().build(),
          buffers: collection<ArrayBuffer>().build(),
        })

        await db.arrs.add(["str1", "str2", "str3"])
        await db.i8arrs.add(new Int8Array([1, 2, 3]))
        await db.i16arrs.add(new Int16Array([1, 2, 3]))
        await db.i32arrs.add(new Int32Array([1, 2, 3]))
        await db.i64arrs.add(new BigInt64Array([1n, 2n, 3n]))
        await db.u8arrs.add(new Uint8Array([1, 2, 3]))
        await db.u16arrs.add(new Uint16Array([1, 2, 3]))
        await db.u32arrs.add(new Uint32Array([1, 2, 3]))
        await db.u64arrs.add(new BigUint64Array([1n, 2n, 3n]))
        await db.u8carrs.add(new Uint8ClampedArray([1, 2, 3]))
        await db.f32arrs.add(new Float32Array([1.0, 2.0, 3.0]))
        await db.f64arrs.add(new Float64Array([1.0, 2.0, 3.0]))
        await db.buffers.add(new ArrayBuffer(16))

        await db.arrs.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof Array)
        )
        await db.i8arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Int8Array,
          )
        )
        await db.i16arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Int16Array,
          )
        )
        await db.i32arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Int32Array,
          )
        )
        await db.i64arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof BigInt64Array,
          )
        )
        await db.u8arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Uint8Array,
          )
        )
        await db.u16arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Uint16Array,
          )
        )
        await db.u32arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Uint32Array,
          )
        )
        await db.u64arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" &&
              doc.value instanceof BigUint64Array,
          )
        )
        await db.u8carrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" &&
              doc.value instanceof Uint8ClampedArray,
          )
        )
        await db.f32arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Float32Array,
          )
        )
        await db.f64arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Float64Array,
          )
        )
        await db.buffers.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof ArrayBuffer,
          )
        )

        await db.arrs.deleteMany()
        await db.i8arrs.deleteMany()
        await db.i16arrs.deleteMany()
        await db.i32arrs.deleteMany()
        await db.i64arrs.deleteMany()
        await db.u8arrs.deleteMany()
        await db.u16arrs.deleteMany()
        await db.u32arrs.deleteMany()
        await db.u64arrs.deleteMany()
        await db.u8carrs.deleteMany()
        await db.f32arrs.deleteMany()
        await db.f64arrs.deleteMany()
        await db.buffers.deleteMany()

        kv.close()
      },
    )

    await t2.step(
      "Should allow and properly store/retrieve built-in object types",
      async () => {
        const kv = await Deno.openKv()

        const db = kvdex(kv, {
          dates: collection<Date>().build(),
          sets: collection<Set<string>>().build(),
          maps: collection<Map<string, number>>().build(),
          regExps: collection<RegExp>().build(),
          dataVeiws: collection<DataView>().build(),
          errors: collection<Error>().build(),
        })

        await db.dates.add(new Date())
        await db.sets.add(new Set())
        await db.maps.add(new Map())
        await db.regExps.add(new RegExp("^[0-9]$"))
        await db.dataVeiws.add(new DataView(new ArrayBuffer(16)))
        await db.errors.add(new Error("error"))

        await db.dates.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof Date)
        )

        await db.sets.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof Set)
        )

        await db.maps.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof Map)
        )

        await db.regExps.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof RegExp)
        )

        await db.dataVeiws.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof DataView)
        )

        await db.errors.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof Error)
        )

        await db.dates.deleteMany()
        await db.sets.deleteMany()
        await db.maps.deleteMany()
        await db.regExps.deleteMany()
        await db.dataVeiws.deleteMany()

        kv.close()
      },
    )
  })

  // Perform last reset
  await t1.step("RESET", async () => await reset())
})
