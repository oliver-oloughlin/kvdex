import { z } from "./deps.ts"

export type Address = z.infer<typeof AddressSchema>

export type User = z.infer<typeof UserSchema>

export const AddressSchema = z.object({
  country: z.string(),
  city: z.string(),
  street: z.string().optional(),
  houseNr: z.number().nullable(),
})

export const UserSchema = z.object({
  username: z.string(),
  age: z.number(),
  address: AddressSchema,
})
