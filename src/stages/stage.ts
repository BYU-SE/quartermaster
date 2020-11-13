import {
  Event,
  Response,
  Queue,
  NoQueue,
  TimeStats,
  TrafficStats,
  metronome
} from "../";

/**
 * The primary unit of a fault tolerant technique.
 * 
 * By default, it includes a FIFO queue with fixed capacity and worker pool.
 * 
 * 
 * TODO: consider if we can break queue out into a QueuedStage since it 
 * could be superfluous for some techniques.
 * 
 * TODO: Refactor queue so that properties are easier to access, it is 
 * easier to override.
 */
export abstract class Stage {
  public inQueue: Queue = new NoQueue();
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
  public async accept(event: Event): Promise<Response> {
    const time = TimeStats.fromStage(this);
    event.addStageTime(time);

    this.traffic.add++;
    await this.add(event);

    const t = metronome.now();
    const worker = await this.inQueue.enqueue(event);
    time.queueTime = metronome.now() - t;
    this.time.queueTime += time.queueTime;

    try {
      this.traffic.workOn++;
      const t = metronome.now();
      await this.workOn(event);
      time.workTime = metronome.now() - t;
      this.time.workTime += time.workTime;

      this.traffic.success++;
      return this.success(event);
    } catch (err) {
      if (err != "fail") {
        console.error(`Unexpected error thrown (not 'fail') in [Stage ${this.constructor.name}]:`);
        console.error(err);
        console.error("\n");
      }

      this.traffic.fail++;
      return this.fail(event);
    } finally {
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
   */
  abstract workOn(event: Event): Promise<void>;

  /**
   * A helper function which is called when workOn completes without rejection
   * or a thrown error.
   * @param event The event that successfully passed through the stage
   */
  protected success(event: Event): Response {
    return "success"
  }

  /**
   * A helper function which is called when workOn returns a rejected promise
   * or throws an error
   * @param event The event that was processing when the rejection occured
   */
  protected fail(event: Event): Response {
    throw "fail"
  }

}