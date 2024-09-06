import { ulid } from "../../deps.ts"
import type { DenoKvStrictKey, DenoKvStrictKeyPart } from "../../types.ts"

export function createVersionstamp() {
  return ulid()
}

export function keySort(key1: DenoKvStrictKey, key2: DenoKvStrictKey): number {
  for (let i = 0; i < Math.min(key1.length, key2.length); i++) {
    const p1 = key1.at(i)
    const p2 = key2.at(i)

    if (p1 === undefined) {
      return -1
    }

    if (p2 === undefined) {
      return 1
    }

    const typeSorted = sortByType(p1, p2)
    if (typeSorted !== 0) {
      return typeSorted
    }

    const valueSorted = sortByValue(p1, p2)
    if (valueSorted !== 0) {
      return valueSorted
    }
  }

  if (key1.length < key2.length) {
    return -1
  }

  if (key1.length > key2.length) {
    return 1
  }

  return 0
}

const typeMap = {
  object: 0,
  string: 1,
  number: 2,
  bigint: 3,
  boolean: 4,
  function: 5,
  symbol: 5,
  undefined: 5,
}

function sortByType(
  part1: DenoKvStrictKeyPart,
  part2: DenoKvStrictKeyPart,
): number {
  const t1 = typeMap[typeof part1]
  const t2 = typeMap[typeof part2]
  return t1 - t2
}

function sortByValue(
  part1: DenoKvStrictKeyPart,
  part2: DenoKvStrictKeyPart,
) {
  if (typeof part2 !== typeof part2) {
    throw Error("Cannot compare values of different type")
  }

  switch (typeof part1) {
    case "object": {
      return sortByUint8Array(part1, part2 as Uint8Array)
    }

    case "string": {
      return sortByString(part1, part2 as string)
    }

    case "number": {
      return sortByNumber(part1, part2 as number)
    }

    case "bigint": {
      return sortByBigint(part1, part2 as bigint)
    }

    case "boolean": {
      return sortByBoolean(part1, part2 as boolean)
    }

    default: {
      return 0
    }
  }
}

function sortByUint8Array(u1: Uint8Array, u2: Uint8Array) {
  for (let i = 0; i < Math.min(u1.length, u2.length); i++) {
    const b1 = u1.at(i)
    const b2 = u2.at(i)

    if (b1 === undefined) {
      return -1
    }

    if (b2 === undefined) {
      return 1
    }

    if (b2 > b1) {
      return -1
    }

    if (b2 < b1) {
      return 1
    }
  }

  if (u1.length < u2.length) {
    return -1
  }

  if (u1.length > u2.length) {
    return 1
  }

  return 0
}

function sortByString(str1: string, str2: string): number {
  return str1.localeCompare(str2)
}

function sortByNumber(n1: number, n2: number): number {
  return n1 - n2
}

function sortByBigint(n1: bigint, n2: bigint): number {
  return n1 < n2 ? -1 : n1 > n2 ? 1 : 0
}

function sortByBoolean(b1: boolean, b2: boolean): number {
  return Number(b1) - Number(b2)
}
