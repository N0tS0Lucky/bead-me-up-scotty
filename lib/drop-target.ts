// Drop-target resolution for the board's drag-and-drop (bead woi / lb2).
//
// dnd-kit's closestCorners collision resolution misresolves cross-column
// drops on some real input pipelines (Wayland + fractional scaling), so the
// target is resolved by geometric containment against column and card rects
// instead of trusting e.over.
//
// Pure function over rect data so the bun (lib-only) suite can test it.

export interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface RectEl {
  id: string;
  rect: RectLike;
}

export interface PointerSample {
  x: number;
  y: number;
}

export type DropResolution =
  | { kind: "no-sample" }            // no pointer sample seen → caller falls back to e.over
  | { kind: "outside" }              // sample exists but hit no rect → no-op
  | { kind: "column"; id: string }   // over empty column area
  | { kind: "bead"; id: string; columnId: string }; // over a card

function contains(r: RectLike, p: PointerSample): boolean {
  return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
}

function area(r: RectLike): number {
  return (r.right - r.left) * (r.bottom - r.top);
}

/**
 * Resolve the drop target from the last pointer sample.
 *
 * Containment is checked against both card rects (data-board-bead) and
 * column rects (data-board-column); the smallest containing rect wins, so a
 * card beat the column behind it and a column beats any larger ancestor.
 */
export function resolveDropTarget(
  sample: PointerSample | null,
  beads: readonly RectEl[],
  columns: readonly RectEl[],
): DropResolution {
  if (!sample) return { kind: "no-sample" };

  let hit: RectEl | null = null;
  let hitArea = Infinity;
  for (const el of [...beads, ...columns]) {
    if (!contains(el.rect, sample)) continue;
    const a = area(el.rect);
    if (a < hitArea) {
      hitArea = a;
      hit = el;
    }
  }
  if (!hit) return { kind: "outside" };

  const isBead = beads.some((b) => b.id === hit!.id);
  if (isBead) {
    const columnId = columns.find((c) => contains(c.rect, sample))?.id ?? null;
    if (!columnId) return { kind: "outside" };
    return { kind: "bead", id: hit.id, columnId };
  }
  return { kind: "column", id: hit.id };
}
