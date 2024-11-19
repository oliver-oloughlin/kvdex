import { jsonSerialize, v8Serialize } from "../../src/ext/encoding/mod.ts";
import { obj } from "./_object.ts";

Deno.bench("utils - jsonSerialize", () => {
  jsonSerialize(obj);
});

Deno.bench("utils - v8Serialize", () => {
  v8Serialize(obj);
});
