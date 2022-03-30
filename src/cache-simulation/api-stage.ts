import {Event, ResponsePayload, Stage, WrappedStage} from "../";

/**
 * A cache that returns the data it has immediately, and has a
 * background process to refresh the cache
 */
export class ApiStage extends WrappedStage {
    async workOn(event: Event): Promise<ResponsePayload> {

    }
}
