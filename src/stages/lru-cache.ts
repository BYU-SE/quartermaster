import { Cache, CacheItem } from "./cache";
import { metronome } from "../metronome";

/**
 * A fixed capacity cache that evicts the least recently used
 * elements first. Also includes a TTL.
 */
export class LRUCache extends Cache {
  public ttl: number = 10000;
  public capacity: number = 1000;
  protected order: string[] = [];



  public get(key: string): any {
    this.prune();
    return super.get(key);
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
   * Removes all entries from the cache.
   */
  public clear(): void {
    super.clear();
    this.order = [];
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
    // expired keys first. Since order has oldest stuff at beginning, loop
    // until first non-stale key, delete up to this point
    let indexToRemoveUpTo = 0;
    for (let i = 0; i < this.order.length; i++) {
      const key = this.order[i];
      if (this.isExpired(this._cache[key]))
        indexToRemoveUpTo = i;
      else
        break;
    }

    const keysToDelete = this.order.splice(0, indexToRemoveUpTo);
    keysToDelete.forEach(key => this.remove(key));

    // then look for lru
    while (this.order.length > this.capacity) {
      const keyToRemove = this.order.shift() as string;
      delete this._cache[keyToRemove];
    }
  }
}
