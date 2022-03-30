import {Event, LRUCache, ResponsePayload} from "../";

/**
 * A cache that returns the data it has immediately, and has a
 * background process to refresh the cache
 */
export class CacheStage extends LRUCache {
    async workOn(event: Event): Promise<ResponsePayload> {

    }
}
