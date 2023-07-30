import { createDb, type Model } from "../mod.ts"

export interface Person extends Model {
  name: string
  age: number
  friends: string[]
  address: {
    country: string
    city: string | null
    postcode?: number
  }
}

export const testPerson: Person = {
  name: "Oliver",
  age: 24,
  friends: ["Elias", "Anders"],
  address: {
    country: "Norway",
    city: "Bergen",
    postcode: 420,
  },
}

export const testPerson2: Person = {
  name: "Anders",
  age: 24,
  friends: ["Oliver", "Elias"],
  address: {
    country: "Norway",
    city: "Oslo",
    postcode: 1024,
  },
}

const kv = await Deno.openKv()

export const db = createDb(kv, {
  people: (cb) => cb.collection<Person>().build(),
  indexablePeople: (cb) =>
    cb.indexableCollection<Person>().build({
      indices: {
        name: "primary",
        age: "secondary",
      },
    }),
  values: {
    numbers: (cb) => cb.collection<number>().build(),
    strings: (cb) => cb.collection<string>().build(),
    u64s: (cb) => cb.collection<Deno.KvU64>().build(),
  },
  arrs: (cb) => cb.collection<string[]>().build(),
  dates: (cb) => cb.collection<Date>().build(),
})

export async function reset() {
  await db.deleteAll()
}

export function generateNumbers(n: number) {
  const numbers: number[] = []
  for (let i = 0; i < n; i++) {
    numbers.push(i)
  }

  return numbers
}

export function generatePeople(n: number) {
  const people: Person[] = []
  for (let i = 0; i < n; i++) {
    people.push({
      name: `generated_name_${i}`,
      age: Math.floor(Math.random() * 100),
      friends: [],
      address: {
        city: "Bergen",
        country: "Norway",
      },
    })
  }

  return people
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function useTemporaryKv(
  fn: (kv: Deno.Kv) => void | Promise<void>,
) {
  const dbId = crypto.randomUUID()
  const dir = await Deno.makeTempDir()
  const filePath = `${dir}/${dbId}.sqlite`
  await Deno.writeFile(filePath, new Uint8Array())
  const kv = await Deno.openKv(filePath)
  try {
    await fn(kv)
  } finally {
    kv.close()
  }
}
