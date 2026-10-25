import { describe, expect, it } from "vitest";

import { getProductConfig } from "@/lib/products/config";
import {
  defaultConfiguration,
  type Configuration,
  type DecalSettings,
} from "@/lib/products/configuration";
import {
  isConfigurationDefault,
  isConfigurationDirty,
  sameConfiguration,
} from "@/lib/studio/dirty";

/**
 * Dirty detection is what decides whether the studio asks before discarding a
 * design. It has to be order-insensitive (a decal built by a spread and one
 * parsed by zod are the same design) and complete (every editable field), or
 * the guard either nags or silently loses work.
 */

const product = getProductConfig("heavyweight-boxy-tee")!;
const base = defaultConfiguration(product);

const decal: DecalSettings = {
  name: "artwork.png",
  zone: product.decal.zones[0]!.id,
  scale: 0.6,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  avoidSeams: true,
};

function changed(patch: (config: Configuration) => Configuration): Configuration {
  return patch(structuredClone(base));
}

describe("sameConfiguration", () => {
  it("treats a structured clone as the same design", () => {
    expect(sameConfiguration(base, structuredClone(base))).toBe(true);
  });

  it("ignores key order", () => {
    const reordered: Configuration = {
      decal: base.decal,
      engrave: { ...base.engrave },
      extras: { ...base.extras },
      parts: Object.fromEntries(Object.entries(base.parts).reverse()),
      slug: base.slug,
      version: base.version,
    };

    expect(sameConfiguration(base, reordered)).toBe(true);
  });

  it("sees colour changes, case-insensitively", () => {
    const partId = Object.keys(base.parts)[0]!;
    const upper = changed((config) => {
      config.parts[partId]!.color = "#ABCDEF";
      return config;
    });
    const lower = changed((config) => {
      config.parts[partId]!.color = "#abcdef";
      return config;
    });

    expect(sameConfiguration(upper, lower)).toBe(true);
    expect(sameConfiguration(base, upper)).toBe(false);
  });

  it("sees finish, extras, engraving and decal changes", () => {
    const partId = Object.keys(base.parts)[0]!;

    expect(
      sameConfiguration(
        base,
        changed((config) => {
          config.parts[partId]!.finish = config.parts[partId]!.finish + 1;
          return config;
        }),
      ),
    ).toBe(false);

    expect(
      sameConfiguration(
        base,
        changed((config) => {
          config.extras = { ...config.extras, "gift-wrap": "yes" };
          return config;
        }),
      ),
    ).toBe(false);

    expect(
      sameConfiguration(
        base,
        changed((config) => {
          config.engrave = { ...config.engrave, text: "A1" };
          return config;
        }),
      ),
    ).toBe(false);

    expect(sameConfiguration(base, { ...base, decal })).toBe(false);
    expect(
      sameConfiguration(
        { ...base, decal },
        { ...base, decal: { ...decal, scale: 0.7 } },
      ),
    ).toBe(false);
  });

  it("compares every decal transform", () => {
    const first: Configuration = { ...base, decal };
    for (const patch of [
      { rotation: 15 },
      { offsetX: 0.2 },
      { offsetY: -0.2 },
      { avoidSeams: false },
      { zone: "other" },
    ] satisfies Partial<DecalSettings>[]) {
      expect(sameConfiguration(first, { ...first, decal: { ...decal, ...patch } })).toBe(false);
    }
  });
});

describe("default / dirty", () => {
  it("knows the untouched design", () => {
    expect(isConfigurationDefault(product, base)).toBe(true);

    const partId = Object.keys(base.parts)[0]!;
    const edited = changed((config) => {
      config.parts[partId]!.color = "#123456";
      return config;
    });
    expect(isConfigurationDefault(product, edited)).toBe(false);
  });

  it("treats an unknown baseline as clean and a different one as dirty", () => {
    expect(isConfigurationDirty(base, null)).toBe(false);
    expect(isConfigurationDirty(base, structuredClone(base))).toBe(false);
    expect(isConfigurationDirty({ ...base, decal }, base)).toBe(true);
  });
});
