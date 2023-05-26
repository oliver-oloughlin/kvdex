import { createDb } from "../../mod.ts"
import { db, reset, testPerson, testPerson2 } from "../config.ts"
import { assert, assertThrows } from "../../deps.ts"

// Test atomic operations
Deno.test("db", async (t1) => {
  // Test "kvdb" function
  await t1.step("kvdb", async (t2) => {
    await t2.step(
      "Should throw error when creating KVDB with duplicate collection keys",
      async () => {
        const kv = await Deno.openKv()

        assertThrows(() =>
          createDb(kv, (cb) => ({
            numbers1: cb.collection<number>(["numbers"]),
            numbers2: cb.collection<number>(["numbers"]),
          }))
        )

        assertThrows(() =>
          createDb(kv, (cb) => ({
            numbers: cb.collection<number>(["numbers", 123, 123n]),
            nested: {
              numbers: cb.collection<number>(["numbers", 123, 123n]),
              nested: {
                numbers: cb.collection<number>(["numbers", 123, 123n]),
              },
            },
          }))
        )

        kv.close()
      },
    )

    await t2.step(
      "Should not throw error when creating DB with unique collection keys",
      async () => {
        const kv = await Deno.openKv()

        assert(() => {
          createDb(kv, (cb) => ({
            numbers1: cb.collection<number>(["numbers1"]),
            numbers2: cb.collection<number>(["numbers2"]),
          }))

          return true
        })

        assert(() => {
          createDb(kv, (cb) => ({
            numbers: cb.collection<number>(["numbers", 123, 123n]),
            nested: {
              numbers: cb.collection<number>(["numbers", 1234, 123n]),
              nested: {
                numbers: cb.collection<number>(["numbers", 123, 1234n]),
              },
            },
          }))

          return true
        })

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
      assert(numbersResult.some((n) => n.value === 1))
      assert(numbersResult.some((n) => n.value === 2))
      assert(numbersResult.some((n) => n.value === 3))
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
      assert(nums1.length === 1)

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
      assert(nums2.length === 2)
      assert(nums2.some((doc) => doc.value === 1))
      assert(nums2.some((doc) => doc.value === 2))
      assert(!nums2.some((doc) => doc.value === 10))
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

        const indexDoc1 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson.name,
        })
        assert(indexDoc1 !== null)
        assert(indexDoc1.value.name === testPerson.name)

        const idDoc2 = await db.indexablePeople.find(id2)
        assert(idDoc2 !== null)
        assert(idDoc2.value.name === testPerson2.name)

        const indexDoc2 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson2.name,
        })
        assert(indexDoc2 !== null)
        assert(indexDoc2.value.name === testPerson2.name)

        const indexDocs = await db.indexablePeople.findBySecondaryIndex({
          age: 24,
        })
        assert(indexDocs.some((doc) => doc.id === indexDoc1.id))
        assert(indexDocs.some((doc) => doc.id === id2))
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

      const indexDoc1 = await db.indexablePeople.findByPrimaryIndex({
        name: testPerson.name,
      })
      assert(indexDoc1 !== null)

      await db
        .atomic((schema) => schema.indexablePeople)
        .delete(cr.id)
        .commit()

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

        const indexDoc1 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson.name,
        })
        assert(indexDoc1 !== null)

        const indexDocs1 = await db.indexablePeople.findBySecondaryIndex({
          age: 24,
        })
        assert(indexDocs1.some((doc) => doc.id === idDoc1.id))

        await db
          .atomic((schema) => schema.indexablePeople)
          .mutate({
            type: "delete",
            id,
          })
          .commit()

        const idDoc2 = await db.indexablePeople.find(id)
        assert(idDoc2 === null)

        const indexDoc2 = await db.indexablePeople.findByPrimaryIndex({
          name: testPerson.name,
        })
        assert(indexDoc2 === null)

        const indexDocs2 = await db.indexablePeople.findBySecondaryIndex({
          age: 24,
        })
        assert(indexDocs2.length === 0)
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

  // Test valid data types
  await t1.step("types", async (t2) => {
    await t2.step(
      "Should allow and properly store/retrieve all primitive types",
      async () => {
        const kv = await Deno.openKv()

        const db = createDb(kv, (builder) => ({
          strings: builder.collection<string>(["strings"]),
          numbers: builder.collection<number>(["numbers"]),
          bigints: builder.collection<bigint>(["bigints"]),
          u64s: builder.collection<Deno.KvU64>(["u64s"]),
        }))

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

        const db = createDb(kv, (builder) => ({
          arrs: builder.collection<Array<string>>(["arrs"]),
          i8arrs: builder.collection<Int8Array>(["i8arrs"]),
          i16arrs: builder.collection<Int16Array>(["i16arrs"]),
          i32arrs: builder.collection<Int32Array>(["i32arrs"]),
          i64arrs: builder.collection<BigInt64Array>(["i64arrs"]),
          u8arrs: builder.collection<Uint8Array>(["u8arrs"]),
          u16arrs: builder.collection<Uint16Array>(["u16arrs"]),
          u32arrs: builder.collection<Uint32Array>(["u32arrs"]),
          u64arrs: builder.collection<BigUint64Array>(["u64arrs"]),
          u8carrs: builder.collection<Uint8ClampedArray>(["u8carrs"]),
          f32arrs: builder.collection<Float32Array>(["f32arrs"]),
          f64arrs: builder.collection<Float64Array>(["f64arrs"]),
          buffers: builder.collection<ArrayBuffer>(["buffers"]),
        }))

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
          assert(
            typeof doc.value === "object" && doc.value instanceof Array<string>,
          )
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

        const db = createDb(kv, (builder) => ({
          dates: builder.collection<Date>(["dates"]),
          sets: builder.collection<Set<string>>(["sets"]),
          maps: builder.collection<Map<string, number>>(["maps"]),
          regExps: builder.collection<RegExp>(["regExps"]),
          dataVeiws: builder.collection<DataView>(["fdataVeiws"]),
          errors: builder.collection<Error>(["errors"]),
        }))

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
          assert(
            typeof doc.value === "object" && doc.value instanceof Set<string>,
          )
        )

        await db.maps.forEach((doc) =>
          assert(
            typeof doc.value === "object" &&
              doc.value instanceof Map<string, number>,
          )
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
