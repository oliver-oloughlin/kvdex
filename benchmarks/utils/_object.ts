export const obj = createLargeObject()

function createLargeObject(depth = 6) {
  if (depth <= 0) {
    return null
  }

  const arr: any[] = []
  const obj: Record<string, any> = {}

  for (let i = 0; i < 25_000; i++) {
    arr.push(crypto.randomUUID())

    if (i % 1_000 === 0) {
      obj[crypto.randomUUID()] = 100n
    }

    if (i % 12_500 === 0) {
      obj[crypto.randomUUID()] = createLargeObject(depth - 1)
    }
  }

  obj[crypto.randomUUID()] = arr

  return obj
}
