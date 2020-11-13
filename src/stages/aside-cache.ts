import { Cache } from "./cache";
import { Event } from "../";

/**
 * A cache that returns the data it has immediately, and has a
 * background process to refresh the cache
 */
export class AsideCache extends Cache {
  protected _cache: any = {};
  async workOn(event: Event): Promise<void> {
    const self = this;
    this.wrapped.accept(event).then(() => self.set(event.key, "success"));

    const inCache = !!this.get(event.key);
    if (!inCache) {
      throw "fail";
    }
  }
}
