import { WrappedStage } from "./wrapped-stage";
import { Event, metronome } from "../";



type CacheLine = Record<string, CacheItem>
export type CacheItem = { time: number };

/**
 * A generic unbounded cache.
 * 
 * Stored in the cache is the time key was last updated.
 */
export class Cache extends WrappedStage {
  protected _cache: CacheLine = {}
  async workOn(event: Event): Promise<void> {
    const inCache = !!this.get(event.key);
    if (inCache) {
      return;
    }
    const r = await this.wrapped.accept(event);
    this.set(event.key, { time: metronome.now() });
  }

  public get(key: string): any {
    return this._cache[key]
  }
  public set(key: string, value: any): void {
    this._cache[key] = value;
  }

  /**
   * Removes all entries from the cache.
   */
  public clear(): void {
    this._cache = {}
  }

  /**
   * Deletes a key from the cache
   * @param key The key to remove
   */
  public remove(key: string): void {
    delete this._cache[key];
  }

  /**
   * Returns the store, which is just some object
   */
  public getStore(): any {
    return this._cache;
  }
}