import { jsonDeserialize, jsonSerialize } from "../../src/ext/encoding/json.ts";
import { v8Deserialize, v8Serialize } from "../../src/ext/encoding/v8.ts";
import { obj } from "./_object.ts";

const js = jsonSerialize(obj);
const ds = v8Serialize(obj);

Deno.bench(
  `utils - jsonDeserialize (${js.byteLength / 1024 / 1024} MB)`,
  () => {
    jsonDeserialize(js);
  },
);

Deno.bench(
  `utils - v8Deserialize - (${ds.byteLength / 1024 / 1024} MS)`,
  () => {
    v8Deserialize(ds);
  },
);
