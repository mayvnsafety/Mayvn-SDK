declare module "bun" {
    interface BuildConfig {
        dts?: boolean;
    }
}

await Bun.build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    target: "node",
    format: "esm",
    packages: "external",
    sourcemap: "external",
    minify: {
        identifiers: true,
        keepNames: true,
        syntax: true,
        whitespace: true
    },
    dts: true,
    banner: `/*
 * SPDX-License-Identifier: LGPL-3.0-only
 * Copyright 2026 bogdan-glitchm
*/`,
});
