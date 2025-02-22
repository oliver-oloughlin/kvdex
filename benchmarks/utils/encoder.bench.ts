import { brotliCompressor } from "../../src/ext/encoding/brotli/brotli_compressor.ts";
import { v8Serialize } from "../../src/ext/encoding/v8/utils.ts";
import { obj } from "./_object.ts";

const data = v8Serialize(obj);
const compressor = brotliCompressor();

Deno.bench("encoder - brotli_compress", async () => {
  await compressor.compress(data);
});
