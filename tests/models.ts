import { model } from "../mod.ts";
import { z } from "./test.deps.ts";

export type Address = z.infer<typeof AddressSchema>;

export type User = z.infer<typeof UserSchema>;

export type OutputUser = {
  name: string;
  decadeAge: number;
  addressStr: string;
};

export const AddressSchema = z.object({
  country: z.string(),
  city: z.string(),
  street: z.string().optional(),
  houseNr: z.number().nullable(),
});

export const UserSchema = z.object({
  username: z.string(),
  age: z.number(),
  address: AddressSchema,
});

export const TransformUserModel = model<OutputUser, User>((user) => ({
  name: user.username,
  decadeAge: user.age / 10,
  addressStr: `${user.address.city}, ${user.address.country}`,
}));
