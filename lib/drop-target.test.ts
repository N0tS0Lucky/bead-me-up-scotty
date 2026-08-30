import { describe, expect, test } from "bun:test";
import { resolveDropTarget, type RectEl } from "./drop-target";

const col = (id: string, l: number, r: number): RectEl => ({
  id,
  rect: { left: l, top: 0, right: r, bottom: 600 },
});
const bead = (id: string, l: number, r: number, t: number, b: number): RectEl => ({
  id,
  rect: { left: l, top: t, right: r, bottom: b },
});
// Two columns 0–300 (todo) and 320–620 (done); a 20px gutter between.
const COLUMNS = [col("todo", 0, 300), col("done", 320, 620)];

describe("resolveDropTarget", () => {
  test("no sample → no-sample (caller falls back to e.over)", () => {
    expect(resolveDropTarget(null, [], COLUMNS)).toEqual({ kind: "no-sample" });
  });

  test("sample inside a column → that column", () => {
    expect(resolveDropTarget({ x: 100, y: 300 }, [], COLUMNS)).toEqual({
      kind: "column",
      id: "todo",
    });
  });

  test("sample in the gutter between columns → outside (no-op, never e.over fallback)", () => {
    expect(resolveDropTarget({ x: 310, y: 300 }, [], COLUMNS)).toEqual({ kind: "outside" });
  });

  test("sample over a card → bead id with its column", () => {
    const BEADS = [bead("bd-1", 10, 290, 100, 180)];
    expect(resolveDropTarget({ x: 150, y: 140 }, BEADS, COLUMNS)).toEqual({
      kind: "bead",
      id: "bd-1",
      columnId: "todo",
    });
  });

  test("smallest containing rect wins (card beats its column)", () => {
    const BEADS = [bead("bd-2", 10, 290, 100, 180)];
    const r = resolveDropTarget({ x: 150, y: 140 }, BEADS, COLUMNS);
    expect(r).toEqual({ kind: "bead", id: "bd-2", columnId: "todo" });
  });
});
