import {
  jsonDeserialize,
  jsonSerialize,
  v8Deserialize,
  v8Serialize,
} from "../../src/ext/encoding/mod.ts";
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
