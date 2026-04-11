// Converts Deno bench --json output to the customSmallerIsBetter format
// expected by benchmark-action/github-action-benchmark.
//
// Input:  Deno bench JSON (stdin or file argument)
// Output: JSON array of { name, unit, value, range } objects

import { z } from "zod";

const input = Deno.args[0]
  ? await Deno.readTextFile(Deno.args[0])
  : await new Response(Deno.stdin.readable).text();

const data = JSON.parse(input);

const benchResultSchema = z.object({
  name: z.string(),
  results: z.array(
    z.object({
      ok: z.object({
        avg: z.number(),
        min: z.number(),
        max: z.number(),
      }),
    }),
  ),
});

type BenchResult = z.infer<typeof benchResultSchema>;

const benches: unknown[] = data?.benches ?? [];

const results = benches
  .filter((bench: unknown): bench is BenchResult =>
    benchResultSchema.safeParse(bench).success
  )
  .map(
    (bench) => ({
      name: bench.name,
      unit: "µs/iter",
      value: Math.round(bench.results[0].ok.avg / 1_000 * 100) / 100,
      range: `${Math.round(bench.results[0].ok.min / 1_000)} … ${
        Math.round(bench.results[0].ok.max / 1_000)
      } µs`,
    }),
  );

// deno-lint-ignore no-console
console.log(JSON.stringify(results, null, 2));
