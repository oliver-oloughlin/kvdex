import {
  collection,
  indexableCollection,
  kvdex,
  largeCollection,
} from "../mod.ts"
import { model } from "../src/model.ts"
import { ulid } from "./deps.ts"
import { User, UserSchema } from "./models.ts"

// Create test db
export function createDb(kv: Deno.Kv) {
  return kvdex(kv, {
    u64s: collection(model<Deno.KvU64>(), {
      idGenerator: () => ulid(),
    }),
    users: collection(model<User>(), {
      idGenerator: () => ulid(),
    }),
    i_users: indexableCollection(model<User>(), {
      idGenerator: () => ulid(),
      indices: {
        username: "primary",
        age: "secondary",
      },
    }),
    l_users: largeCollection(model<User>(), {
      idGenerator: () => ulid(),
    }),
    z_users: collection(UserSchema, {
      idGenerator: () => ulid(),
    }),
    zi_users: indexableCollection(UserSchema, {
      idGenerator: () => ulid(),
      indices: {
        username: "primary",
        age: "secondary",
      },
    }),
    zl_users: collection(UserSchema, {
      idGenerator: () => ulid(),
    }),
  })
}

// Temporary use functions
export async function useKv(
  fn: (kv: Deno.Kv) => unknown,
) {
  const kv = await Deno.openKv(":memory:")
  const result = await fn(kv)
  kv.close()

  if (typeof result === "function") {
    await result()
  }
}

export async function useDb(
  fn: (db: ReturnType<typeof createDb>) => unknown,
) {
  await useKv(async (kv) => {
    const db = createDb(kv)
    return await fn(db)
  })
}

// Generator functions
export function generateLargeUsers(n: number) {
  const users: User[] = []

  let country = ""
  for (let i = 0; i < 50_000; i++) {
    country += "A"
  }

  for (let i = 0; i < n; i++) {
    const r = Math.random()
    users.push({
      username: `user_${i}`,
      age: Math.floor(15 + i / 5),
      address: {
        country,
        city: r < 0.5 ? "Bergen" : "Oslo",
        street: r < 0.5 ? "Olav Kyrres gate" : "Karl Johans gate",
        houseNr: Math.round(Math.random() * 100),
      },
    })
  }

  return users
}

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

export function generateInvalidUsers(n: number) {
  const users: User[] = []

  for (let i = 0; i < n; i++) {
    users.push({
      username: 100,
      age: Math.floor(15 + i / 5),
      address: {
        street: 100n,
      },
    } as unknown as User)
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
