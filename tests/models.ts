export type Address = {
  country: string
  city: string
  street?: string
  houseNr: number | null
}

export type User = {
  username: string
  age: number
  address: Address
}
