import { Cache, CacheItem } from "./cache";
import { metronome } from "../metronome";

/**
 * A fixed capacity cache that evicts the least recently used
 * elements first. Also includes a TTL.
 */
export class LRUCache extends Cache {
  /**
   * @defaultvalue 10000
   */
  public ttl: number = 10000;

  /**
   * @defaultvalue 1000
   */
  public capacity: number = 1000;

  /**
   * @defaultvalue []
   */
  protected order: string[] = [];

  public get(key: string): any {
    this.prune();
    const value = super.get(key);
    if (value) {
      // update order
      this.order = this.order.filter(x => x != key);
      this.order.push(key);
    }
    return value;
  }

  public set(key: string, value: any): void {
    this.order = this.order.filter(x => x != key);
    this.order.push(key);
    super.set(key, value);
  }

  public getStore(): any {
    this.prune();
    return super.getStore();
  }

  /**
   * Checks if a line item is older than the ttl
   * @param lineItem The line item to check
   */
  protected isExpired(lineItem: CacheItem) {
    return metronome.now() - lineItem.time > this.ttl;
  }

  /**
   * Evict items that are expired (always) or lru (when over capacity)
   */
  protected prune(): void {
    // remove expired items first
    for (let i = 0; i < this.order.length; i++) {
      const key = this.order[i];
      if (this.isExpired(this._cache[key])) {
        this.remove(key);
        this.order.splice(i, 1);
        i--;
      }
    }

    // then look for lru
    while (this.order.length > this.capacity) {
      const keyToRemove = this.order.shift() as string;
      this.remove(keyToRemove)
    }
  }

  /**
   * Removes all entries from the cache.
   */
   public clear(): void {
     this.order = [];
     super.clear();
  }
}
