import { db, reset } from "./config.ts"
import { assert } from "https://deno.land/std@0.184.0/testing/asserts.ts"

// Test atomic operations
Deno.test({
  name: "db",
  fn: async t => {
    await t.step({
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
  }
})