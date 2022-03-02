import { WrappedStage } from "./wrapped-stage";
import { Event, metronome } from "../";
import { ResponsePayload } from "../response";



type CacheLine = Record<string, CacheItem>
export type CacheItem = { time: number, payload: ResponsePayload };

/**
 * A generic unbounded cache.
 * 
 * Stored in the cache is the time key was last updated.
 */
export class Cache extends WrappedStage {
  protected _cache: CacheLine = {}
  async workOn(event: Event): Promise<ResponsePayload> {
    const inCache = this.get(event.key);

    if (inCache) {
      return inCache.payload; // can return payload here?
    }
    const payload = await this.wrapped.accept(event); // what is r for?
    this.set(event.key, { time: metronome.now(), payload });
    return payload;
  }

  public get(key: string): CacheItem {
    return this._cache[key]
  }

  public set(key: string, value: CacheItem): void {
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