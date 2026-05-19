// Tiny binary min-heap. Keyed numeric priority, generic payload.
export class MinHeap<T> {
  private items: Array<{ key: number; value: T }> = [];

  get size(): number {
    return this.items.length;
  }

  push(key: number, value: T): void {
    this.items.push({ key, value });
    this.bubbleUp(this.items.length - 1);
  }

  pop(): T | undefined {
    const n = this.items.length;
    if (n === 0) return undefined;
    const top = this.items[0]!.value;
    const last = this.items.pop()!;
    if (n > 1) {
      this.items[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[i]!.key < this.items[parent]!.key) {
        [this.items[i], this.items[parent]] = [this.items[parent]!, this.items[i]!];
        i = parent;
      } else {
        break;
      }
    }
  }

  private bubbleDown(i: number): void {
    const n = this.items.length;
    while (true) {
      const l = i * 2 + 1;
      const r = l + 1;
      let min = i;
      if (l < n && this.items[l]!.key < this.items[min]!.key) min = l;
      if (r < n && this.items[r]!.key < this.items[min]!.key) min = r;
      if (min === i) break;
      [this.items[i], this.items[min]] = [this.items[min]!, this.items[i]!];
      i = min;
    }
  }
}
