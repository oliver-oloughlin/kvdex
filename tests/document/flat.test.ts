import { Document } from "../../mod.ts";
import { assert } from "@std/assert";
import { mockUser1 } from "../mocks.ts";

Deno.test("document - flat", async (t) => {
  await t.step("Should flatten document of Model type", () => {
    const id = "id";
    const versionstamp = "000";

    const doc = new Document({
      id,
      versionstamp,
      value: mockUser1,
    });

    const flattened = doc.flat();
    assert(flattened.id === id);
    assert(flattened.versionstamp === versionstamp);
    assert(flattened.username === mockUser1.username);
  });

  await t.step("Should not flatten document of primitive type", () => {
    const id = "id";
    const versionstamp = "000";
    const value = 100;

    const doc = new Document({
      id,
      versionstamp,
      value,
    });

    const flattened = doc.flat();
    assert(flattened.id === id);
    assert(flattened.versionstamp === versionstamp);
    assert(flattened.value === value);
  });

  await t.step("Should not flatten document of built-in object type", () => {
    const id = "id";
    const versionstamp = "000";
    const value = new Date();

    const doc = new Document({
      id,
      versionstamp,
      value,
    });

    const flattened = doc.flat();
    assert(flattened.id === id);
    assert(flattened.versionstamp === versionstamp);
    assert(flattened.value.valueOf() === value.valueOf());
  });
});
