/**
 * Type-safe custom properties on Events
 */

import { Event, metronome, ResponsePayload, Stage, WrappedStage } from "../src";
export class ADependency extends Stage {
  async workOn(event: Event): Promise<ResponsePayload> {
    return "yay";
  }
}
export class AWrappedStage extends WrappedStage {
  async workOn(event: Event): Promise<ResponsePayload> {
    return this.wrapped.accept(event);
  }
}

type CustomEvent = Event<{ prop: number }>;
export class ACustomEventWrappedStage extends WrappedStage {
  async workOn(event: CustomEvent): Promise<ResponsePayload> {
    await metronome.wait(event.custom.prop);
    return this.wrapped.accept(event);
  }
}

const a = new ADependency();
const wrapped = new AWrappedStage(a);
const customEventWrappedStage = new ACustomEventWrappedStage(a);