import { describe, it, expect } from "vitest";
import { AdvisorOutputSchema, enforceGrounding } from "./index";

describe("AdvisorOutputSchema", () => {
  it("valida uma saída bem-formada e aplica defaults", () => {
    const parsed = AdvisorOutputSchema.parse({
      evaluation: "ok",
      disclaimer: "educacional",
    });
    expect(parsed.candidateAssets).toEqual([]);
    expect(parsed.caveats).toEqual([]);
  });
});

describe("enforceGrounding", () => {
  it("remove tickers que não estão no universo permitido e registra o descarte", () => {
    const out = AdvisorOutputSchema.parse({
      evaluation: "x",
      disclaimer: "y",
      candidateAssets: [
        { ticker: "HGLG11", reason: "boa" },
        { ticker: "INVENTADO99", reason: "alucinada" },
      ],
    });
    const grounded = enforceGrounding(out, ["HGLG11", "MXRF11"]);
    expect(grounded.candidateAssets.map((c) => c.ticker)).toEqual(["HGLG11"]);
    expect(grounded.caveats.some((c) => c.includes("descartados"))).toBe(true);
  });
});
