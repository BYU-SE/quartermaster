import { Stage } from "./stage";

/**
 * Wrapped Stage encapsulates a single other stage. Useful for retries,
 * caches, timeouts, etc.
 * 
 * For example, the workOn() method could call: await this.wrapped.accept()
 * and pass on the request to the stage that was wrapped.
 */
export abstract class WrappedStage extends Stage {
  constructor(protected wrapped: Stage) {
    super();
  }
}