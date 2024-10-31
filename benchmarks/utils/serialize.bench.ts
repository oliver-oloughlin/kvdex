import { jsonSerialize } from "../../src/ext/encoding/json.ts";
import { v8Serialize } from "../../src/ext/encoding/v8.ts";
import { obj } from "./_object.ts";

Deno.bench("utils - jsonSerialize", () => {
  jsonSerialize(obj);
});

Deno.bench("utils - v8Serialize", () => {
  v8Serialize(obj);
});
