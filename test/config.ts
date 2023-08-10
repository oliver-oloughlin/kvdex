import { kvdex, type Model } from "../mod.ts"

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

export type LargeData = {
  name: string
  numbers: number[]
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

export const testLargeData: LargeData = {
  name: "large_data_1",
  numbers: generateNumbers(500_000),
}

export const testLargeData2: LargeData = {
  name: "large_data_2",
  numbers: generateNumbers(500_000),
}

export const kv = await Deno.openKv()

export const db = kvdex(kv, {
  people: (cb) => cb.collection<Person>().build(),
  indexablePeople: (cb) =>
    cb.indexableCollection<Person>().build({
      indices: {
        name: "primary",
        age: "secondary",
      },
    }),
  largeDocs: (ctx) => ctx.largeCollection<LargeData>().build(),
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

export function generateLargeDatas(n: number) {
  const largeDatas: LargeData[] = []

  for (let i = 0; i < n; i++) {
    largeDatas.push({
      name: `generated_name_${i}`,
      numbers: generateNumbers(50_000 + Math.random() * 250_000),
    })
  }

  return largeDatas
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function useTemporaryKv(
  fn: (kv: Deno.Kv) => void | Promise<void>,
) {
  const dbId = crypto.randomUUID()
  const dir = await Deno.makeTempDir()
  const filePath = `${dir}/${dbId}.sqlite3`
  await Deno.writeFile(filePath, new Uint8Array())
  const kv = await Deno.openKv(filePath)
  try {
    await fn(kv)
  } finally {
    kv.close()
  }
}
