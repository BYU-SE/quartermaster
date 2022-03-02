import { Cache } from "./cache";
import { Event, metronome, ResponsePayload } from "../";

/**
 * A cache that returns the data it has immediately, and has a
 * background process to refresh the cache
 */
export class AsideCache extends Cache {
  protected _cache: any = {};
  async workOn(event: Event): Promise<ResponsePayload> {
    const self = this;
    this.wrapped.accept(event).then((payload) => self.set(event.key, { time: metronome.now(), payload }));

    const inCache = this.get(event.key);
    if(inCache)
      return inCache.payload;
    throw "fail";
  }
}
