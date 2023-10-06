import { collection, Document, kvdex, Model } from "../../mod.ts"
import { ID_KEY_PREFIX, KVDEX_KEY_PREFIX } from "../../src/constants.ts"
import { extendKey, keyEq } from "../../src/utils.ts"
import { assert } from "../deps.ts"
import { mockUser1 } from "../mocks.ts"
import { User } from "../models.ts"
import { generateUsers, useDb, useKv } from "../utils.ts"

Deno.test("collection - properties", async (t) => {
  await t.step("Keys should have the correct prefixes", async () => {
    await useDb((db) => {
      const baseKey = db.users._keys.baseKey
      const idKey = db.users._keys.idKey
      const prefix = extendKey([KVDEX_KEY_PREFIX], "users")

      assert(keyEq(baseKey, prefix))
      assert(keyEq(idKey, extendKey(prefix, ID_KEY_PREFIX)))
    })
  })

  await t.step("Should generate ids with custom id generator", async () => {
    await useKv((kv) => {
      const db = kvdex(kv, {
        users1: collection(new Model<User>(), {
          idGenerator: () => Math.random(),
        }),
        users2: collection(new Model<User>(), {
          idGenerator: (data) => data.username,
        }),
      })

      const id1 = db.users1._idGenerator(mockUser1)
      const id2 = db.users2._idGenerator(mockUser1)

      assert(typeof id1 === "number")
      assert(id2 === mockUser1.username)
    })
  })

  await t.step("Should select using pagination", async () => {
    await useDb(async (db) => {
      const users = generateUsers(1_000)
      const crs = await db.users.addMany(users)
      assert(crs.every((cr) => cr.ok))

      const selected: Document<User>[] = []
      let cursor: string | undefined = undefined
      do {
        const query = await db.users.getMany({
          cursor,
          limit: users.length / 10,
        })

        selected.push(...query.result)
        cursor = query.cursor
      } while (cursor)

      assert(
        users.every((user) =>
          selected.some((doc) => doc.value.username === user.username)
        ),
      )
    })
  })

  await t.step("Should select filtered", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      const crs = await db.users.addMany(users)
      const count1 = await db.users.count()
      assert(crs.every((cr) => cr.ok))
      assert(count1 === users.length)

      const sliced = users.slice(5, 7)

      const { result } = await db.users.getMany({
        filter: (doc) =>
          sliced.map((user) => user.username).includes(
            doc.value.username,
          ),
      })

      assert(result.length === sliced.length)
      assert(
        result.every((doc) =>
          sliced.some((user) => user.username === doc.value.username)
        ),
      )
    })
  })

  await t.step("Should select in reverse", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      const crs = await db.users.addMany(users)
      const count1 = await db.users.count()
      assert(crs.every((cr) => cr.ok))
      assert(count1 === users.length)

      const query1 = await db.users.getMany()
      const query2 = await db.users.getMany({ reverse: true })

      assert(
        JSON.stringify(query1.result) ===
          JSON.stringify(query2.result.reverse()),
      )
    })
  })

  await t.step("Should select from start id", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      const crs = await db.users.addMany(users)
      const count1 = await db.users.count()
      assert(crs.every((cr) => cr.ok))
      assert(count1 === users.length)

      const index = 5

      const query1 = await db.users.getMany()
      const query2 = await db.users.getMany({
        startId: query1.result.at(index)?.id,
      })

      assert(query2.result.length === query1.result.slice(index).length)
      assert(
        query2.result.every((doc1) =>
          query1.result.slice(index).some((doc2) => doc1.id === doc2.id)
        ),
      )
    })
  })

  await t.step("Should select until end id", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      const crs = await db.users.addMany(users)
      const count1 = await db.users.count()
      assert(crs.every((cr) => cr.ok))
      assert(count1 === users.length)

      const index = 5

      const query1 = await db.users.getMany()
      const query2 = await db.users.getMany({
        endId: query1.result.at(index)?.id,
      })

      assert(query2.result.length === query1.result.slice(0, index).length)
      assert(
        query2.result.every((doc1) =>
          query1.result.slice(0, index).some((doc2) => doc1.id === doc2.id)
        ),
      )
    })
  })

  await t.step("Should select from start id to end id", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      const crs = await db.users.addMany(users)
      const count1 = await db.users.count()
      assert(crs.every((cr) => cr.ok))
      assert(count1 === users.length)

      const index1 = 5
      const index2 = 7

      const query1 = await db.users.getMany()
      const query2 = await db.users.getMany({
        startId: query1.result.at(index1)?.id,
        endId: query1.result.at(index2)?.id,
      })

      assert(
        query2.result.length === query1.result.slice(index1, index2).length,
      )
      assert(
        query2.result.every((doc1) =>
          query1.result.slice(index1, index2).some((doc2) =>
            doc1.id === doc2.id
          )
        ),
      )
    })
  })
})
