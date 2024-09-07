import type { User } from "./models.ts"

export const mockUser1: User = {
  username: "oliver",
  age: 69,
  address: {
    country: "Norway",
    city: "Bergen",
    street: "Olav Kyrres gate",
    houseNr: 420,
  },
}

export const mockUser2: User = {
  username: "elias",
  age: 69,
  address: {
    country: "Norway",
    city: "Oslo",
    street: "Karl Johans gate",
    houseNr: 420,
  },
}

export const mockUser3: User = {
  username: "anders",
  age: 80,
  address: {
    country: "Ireland",
    city: "Dublin",
    houseNr: 10,
  },
}

export const mockUserInvalid = {
  username: 100,
  age: 69,
  address: {
    street: "Karl Johans gate",
    houseNr: "420",
  },
} as unknown as User

export const mockUsersWithAlteredAge: User[] = [
  {
    ...mockUser1,
    age: 50,
  },
  {
    ...mockUser2,
    age: 80,
  },
  {
    ...mockUser3,
    age: 20,
  },
]
