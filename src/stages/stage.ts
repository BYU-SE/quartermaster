import {
  Event,
  NoServiceQueue,
  TimeStats,
  TrafficStats,
  metronome,
  ResponsePayload
} from "../";
import { ServiceQueue } from "../queues";

/**
 * The primary unit of computation.
 * 
 * By default, there is no queue or pool.
 * 
 * TODO: consider if we can break queue out into a QueuedStage since it 
 * could be superfluous for some techniques.
 * 
 * TODO: Refactor queue so that properties are easier to access, it is 
 * easier to override.
 */
export abstract class Stage {
  public inQueue: ServiceQueue = new NoServiceQueue();
  public time: TimeStats;
  public traffic: TrafficStats;
  constructor() {
    this.time = TimeStats.fromStage(this);
    this.traffic = new TrafficStats();
  }

  /**
   * A helper to drive the stage. This function should not be overwritten
   * unless some fixed behavior really needs to be changed.
   * 
   * TODO: Investigate why there is some minor (less than 1% of time) is recorded in queue, when noQueue.
   * Possibly a scheduling issue with promises and the nodejs micro-task scheduler.
   * @param event The event that has been allowed into the stage for processing
   */
  public async accept(event: Event): Promise<ResponsePayload> {
    const time = TimeStats.fromStage(this);
    event.addStageTime(time);

    this.traffic.add++;
    await this.add(event);

    const t = metronome.now();
    const worker = await this.inQueue.enqueue(event);
    time.queueTime = metronome.now() - t;
    this.time.queueTime += time.queueTime;

    const beforeWorkTime = metronome.now();
    try {
      this.traffic.workOn++;
      const payload = await this.workOn(event);
      this.traffic.success++;
      return payload;
    } catch (err) {
      let payload: string;
      if (typeof err !== "string") {
        payload = JSON.stringify(err);
        console.error(`Unexpected error thrown (not type: string, instead type ${typeof err} with properties: ${payload}) in [Stage ${this.constructor.name}]:`)
      }
      else {
        payload = err;
      }
      this.traffic.fail++;
      throw payload;  // which one
    } finally {
      time.workTime = metronome.now() - beforeWorkTime;
      this.time.workTime += time.workTime;

      worker.free();
    }
  }


  /**
   * Admission control before an event reaches the queue.
   * @param event The event that is seeking entry into the stage
   */
  protected async add(event: Event): Promise<void> {
    if (this.inQueue.isFull()) {
      return Promise.reject("fail");
    }
  }

  /**
   * The main method for each stage, which is called when an event is picked up
   * by a worker.
   * @param event The event that is being processed by the stage
   * @returns the payload string
   */
  abstract workOn(event: Event): Promise<ResponsePayload>;
}