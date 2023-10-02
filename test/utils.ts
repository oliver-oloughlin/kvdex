import { collection, kvdex } from "../mod.ts"
import {
  indexableCollection,
  largeCollection,
} from "../src/collection_builder.ts"
import { ulid } from "./deps.ts"
import { User } from "./models.ts"

// Create test db
export function createDb(kv: Deno.Kv) {
  return kvdex(kv, {
    users: collection<User>().build({
      idGenerator: () => ulid(),
    }),
    i_users: indexableCollection<User>().build({
      idGenerator: () => ulid(),
      indices: {
        username: "primary",
        age: "secondary",
      },
    }),
    l_users: largeCollection<User>().build({
      idGenerator: () => ulid(),
    }),
  })
}

// Temporary use functions
export async function useKv(fn: (kv: Deno.Kv) => unknown) {
  const kv = await Deno.openKv(":memory:")
  await fn(kv)
  kv.close()
}

export async function useDb(fn: (db: ReturnType<typeof createDb>) => unknown) {
  await useKv(async (kv) => {
    const db = createDb(kv)
    await fn(db)
  })
}

// Generator functions
export function generateUsers(n: number) {
  const users: User[] = []
  for (let i = 0; i < n; i++) {
    const r = Math.random()
    users.push({
      username: `user_${i}`,
      age: Math.floor(15 + i / 5),
      address: {
        country: "Norway",
        city: r < 0.5 ? "Bergen" : "Oslo",
        street: r < 0.5 ? "Olav Kyrres gate" : "Karl Johans gate",
        houseNr: Math.round(Math.random() * 100),
      },
    })
  }

  return users
}

export function generateNumbers(n: number) {
  const numbers: number[] = []
  for (let i = 0; i < n; i++) {
    numbers.push(i)
  }

  return numbers
}

// Sleep function
export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}
