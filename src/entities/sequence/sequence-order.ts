/** Immutable reordering by stable video ID. Used by the editorial keyboard and drag/drop controls. */
export function moveVideo(current: readonly string[], from: string, to: string): string[] {
  const source = current.indexOf(from);
  const destination = current.indexOf(to);
  if (source < 0 || destination < 0 || source === destination) return current.slice();
  const next = current.slice();
  next.splice(destination, 0, next.splice(source, 1)[0]);
  return next;
}

/** Number of slots that differ from the persisted order. */
export function changedPositions(original: readonly string[], proposed: readonly string[]): number {
  if (original.length !== proposed.length) return 0;
  return proposed.filter((id, index) => id !== original[index]).length;
}
