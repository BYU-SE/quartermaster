import { Stage, Event, ResponseType, metronome, standardDeviation } from "."
import { normal } from "./util";
import { stats } from "./stats";


class Simulation {
  /**
   * The rate at which events are sent to the starting stage
   */
  eventsPer1000Ticks: number = 50;

  /**
   * The mean of keys used when creating new Events
   */
  keyspaceMean: number = 1000;

  /**
   * The standard deviation of keys used when creating new Events
   */
  keyspaceStd: number = 50;

  private _arrivalRate: number = 0;
  private _eventsSent: number = 0;
  private _running: boolean = false;

  public debug: boolean = false;


  reset() {
    this._arrivalRate = 0;
    this._eventsSent = 0;
    Event.resetIDCounter();
  }

  /**
 * Execute a simulation.
 * 
 * Legacy method, supporting Quartermaster Versions < v1.1.4
 * 
 * @param stage The stage where events will be inserted
 * @param numEventsToSend The number of events to be sent
 */
  async run(stage: Stage, numEventsToSend: number): Promise<Event[]> {
    return await this.runForNumEvents(stage, numEventsToSend);
  }
  /**
   * Execute a simulation
   * 
   * TODO: Move to own class, so we can set properties on this later, such as changing rates mid-simulation,
   * setting the keyspace, etc.
   * 
   * @param stage The stage where events will be inserted
   * @param numEventsToSend The number of events to be sent
   */
  async runForNumEvents(stage: Stage, numEventsToSend: number): Promise<Event[]> {
    if (this._running) {
      throw "another simulation is already running";
    }

    //early exit when no events to send
    if (numEventsToSend == 0) {
      return [];
    }

    // clear global state (ouch)
    this.reset();
    stats.reset();
    //metronome.resetCurrentTime();
    metronome.start();

    this._running = true;
    if (this.debug)
      console.log("sending events");
    const pendingEvents = await this.sendEvents(stage, numEventsToSend)
    if (this.debug)
      console.log("events sent, waiting for events to settle");

    const events = await Promise.all(pendingEvents);

    if (this.debug)
      console.log("events settled, stopping metronome");
    await metronome.stop(true);

    if (this.debug)
      console.log("metronome stopped");

    this._running = false;
    return events;
  }

  /**
   * Execute a simulation for a specific number of ticks
   * 
   * @todo Increase test coverage
   * 
   * @param stage The stage where events will be inserted
   * @param numEventsToSend The number of events to be sent
   */
  async runForNumTicks(stage: Stage, numTicksToRun: number): Promise<Event[]> {
    console.warn("simulation.runForNumTicks() is in testing. It may not be functional and its contract is not stable.")

    if (this._running) {
      throw "another simulation is already running";
    }

    //early exit when no events to send
    if (numTicksToRun == 0) {
      return [];
    }

    // clear global state (ouch)
    this.reset();
    stats.reset();
    metronome.start();


    this._arrivalRate = 0;
    this._running = true;
    if (this.debug)
      console.log("sending events");


    const pendingEvents: Promise<Event>[] = [];
    this._eventsSent = 0;

    let time = 0;
    let virtualTime = 0;
    outer: while (true) {
      this._arrivalRate = this.eventsPer1000Ticks;
      const delta = 1000 / this.eventsPer1000Ticks;
      // delta might be 2 ticks between events for    500 eps
      // delta might be 1.43 ticks between events for 700 eps
      // delta might be 1 ticks between events for   1000 eps
      // delta might be 0.5 ticks between events for 2000 eps

      while (virtualTime <= time) {
        virtualTime += delta;
        pendingEvents.push(this.createEvent(stage));
        this._eventsSent++;
      }

      if (this.debug) {
        console.log("framework loop", this._eventsSent, "/", Number.POSITIVE_INFINITY);
      }

      time++;
      if (time >= numTicksToRun) {
        break;
      }

      //go to next tick
      await metronome.wait(1);
    }

    if (this.debug)
      console.log("completed ticks, stopping metronome");
    await metronome.stop(true);

    if (this.debug)
      console.log("metronome stopped");

    this._running = false;
    this._arrivalRate = 0;

    // only return the completed events.
    const completedEvents: Event[] = [];
    pendingEvents.forEach(p => p.then(e => {
      completedEvents.push(e);
    }))

    return completedEvents;
  }

  /**
   * A helper method to send events at the correct rate to the stage
   * @param stage 
   * @param numEventsToSend 
   */
  private async sendEvents(stage: Stage, numEventsToSend: number): Promise<Promise<Event>[]> {
    const events: Promise<Event>[] = [];
    this._eventsSent = 0;

    let time = 0;
    let virtualTime = 0;
    outer: while (true) {
      this._arrivalRate = this.eventsPer1000Ticks;
      const delta = 1000 / this.eventsPer1000Ticks;
      // delta might be 2 ticks between events for    500 eps
      // delta might be 1.43 ticks between events for 700 eps
      // delta might be 1 ticks between events for   1000 eps
      // delta might be 0.5 ticks between events for 2000 eps

      while (virtualTime <= time) {
        virtualTime += delta;
        events.push(this.createEvent(stage));
        this._eventsSent++;

        if (this._eventsSent >= numEventsToSend) {
          break outer;
        }
      }

      if (this.debug) {
        console.log("framework loop", this._eventsSent, "/", numEventsToSend);
      }

      //go to next tick
      await metronome.wait(1);
      time++;
    }

    this._arrivalRate = 0;
    return events;
  }


  private createEvent(stage: Stage): Promise<Event> {
    const key = "" + normal(this.keyspaceMean, this.keyspaceStd);
    const event = new Event(key);
    const time = event.responseTime;
    time.startTime = metronome.now();

    return stage.accept(event).then(successPayload => {
      event.response = {
        responseType: "success",
        responsePayload: successPayload
      }
      time.endTime = metronome.now();
      return event;
    }).catch(errorPayload => {
      event.response = {
        responseType: "fail",
        responsePayload: errorPayload
      }
      time.endTime = metronome.now();
      return event
    });
  }


  public getArrivalRate(): number {
    return this._arrivalRate;
  }
  public getEventsSent(): number {
    return this._eventsSent;
  }
  //TODO:
  /*async runForSomeTicks(stage: Stage, numTicks: number): Promise<void> {
  }*/
}

export const simulation = new Simulation();






/**
 * Show interesting stats from the event data.
 * 
 * Show the following stats:
 * 
 * 1. % QoS? (we don't have access to this data)
 * 2. % success
 * 3. % latencies
 * 4. % slow failures? (interesting?)
 * @param events The events that have completed the simulation
 * @return {EventSummary} Returns statistics for the events
 */
export function eventSummary(events: Event[], additionalColumns?: EventSummaryColumn[]): EventSummary {
  const summary = createEventSummary(events, additionalColumns);

  console.log("Overview of Events");
  console.table(summary);
  return summary;
}


export type EventSummary = SummaryResponseData[];
export type SummaryEventResponseType = ResponseType | "in-flight"
export type SummaryResponseData = {
  type: SummaryEventResponseType
  count: number;
  percent: string;
  mean_latency: string;
  std_latency: string;
}
type EventSummaryColumnFunction = (events: Event[]) => number | string;
type EventSummaryColumn = {
  name: string;
  func: EventSummaryColumnFunction;
}
function createEventSummary(events: Event[], additionalColumns?: EventSummaryColumn[]): EventSummary {
  const success: Event[] = [];
  const fail: Event[] = [];
  const inFlight: Event[] = [];

  events.forEach(e => {
    if (e.response?.responseType == "fail") {
      fail.push(e);
    } else if (e.response == null) {
      inFlight.push(e);
    }
    else {
      success.push(e);
    }
  })

  const count = (e: Event[]) => e.length;
  const percent = (e: Event[]) => events.length > 0 ? e.length / events.length : 0;
  const mean_latency = (e: Event[]) => e.map(e => e.responseTime.endTime - e.responseTime.startTime).reduce((sum, cur) => sum + cur, 0) / e.length;
  const std_latency = (e: Event[]) => standardDeviation(e.map(e => e.responseTime.endTime - e.responseTime.startTime));

  const others = additionalColumns || [];
  const names = ["count", "percent", "mean_latency", "std_latency", ...others.map(x => x.name)]
  const columns = [count, percent, mean_latency, std_latency, ...others.map(x => x.func)];

  const successRow: any = { type: "success" };
  const failRow: any = { type: "fail" };
  const inFlightRow: any = { type: "in-flight" };

  const precision = 3;
  columns.forEach((col, i) => {
    const propName = names[i] || `Column ${i}`

    let successResult = col(success);
    if (typeof successResult === "number" && successResult % 1 != 0) // not a whole number
      successResult = successResult.toFixed(precision);
    successRow[propName] = successResult;

    let failResult = col(fail);
    if (typeof failResult === "number" && failResult % 1 != 0) // not a whole number
      failResult = failResult.toFixed(precision);
    failRow[propName] = failResult;

    let inFlightResult = col(inFlight);
    if (typeof inFlightResult === "number" && inFlightResult % 1 != 0) // not a whole number
      inFlightResult = inFlightResult.toFixed(precision);
    inFlightRow[propName] = inFlightResult;
  })

  const table = [successRow, failRow, inFlightRow];
  return table;
}








/**
 * Print a need summary to the console describing events' behavior within a
 * stage; specifically traffic and timing summaries.
 * 
 * @param stages A stage or an array of stages to report stats about
 * @return {StageSummary} Returns statistics for the stages
 */
export function stageSummary(stages: Stage | Stage[], additionalColumns?: StageSummaryColumn[]): StageSummary {
  const arr = Array.isArray(stages) ? stages : [stages];
  const summary = createStageSummary(arr, additionalColumns);
  console.log("\nOverview of event behavior in stage")
  console.table(summary)
  return summary;
}

type StageSummary = StageData[];
type StageData = {
  stage: string;
  add: number;
  queueTime: number;
  workOn: number;
  workTime: number;
  success: number;
  fail: number;
}
type StageSummaryColumnFunction = (stage: Stage) => number | string;
type StageSummaryColumn = {
  name: string;
  func: StageSummaryColumnFunction;
}
function createStageSummary(stages: Stage[], additionalColumns: StageSummaryColumn[] = []): StageSummary {
  return stages.map(s => ({
    stage: s.time.stage,
    add: s.traffic.add,
    queueTime: s.time.queueTime,
    workOn: s.traffic.workOn,
    workTime: s.time.workTime,
    success: s.traffic.success,
    fail: s.traffic.fail,
    ...additionalColumns.reduce((acc, cur) => {
      acc[cur.name] = cur.func(s)
      return acc;
    }, {} as any)
  }));
}





/**
 * Compare 2 sets of events
 * @param a 
 * @param b 
 */
export function eventCompare(a: Event[], b: Event[]): void {
  const aSummary = createEventSummary(a);
  const bSummary = createEventSummary(b);

  const aSuccess = aSummary[0];
  const bSuccess = bSummary[0];

  const aFail = aSummary[1];
  const bFail = bSummary[1];

  const aInflight = aSummary[2];
  const bInflight = bSummary[2];


  const precision = 3;
  const diff: EventSummary = [
    {
      type: "success" as SummaryEventResponseType,
      count: bSuccess.count - aSuccess.count,
      percent: (parseFloat(bSuccess.percent) - parseFloat(aSuccess.percent)).toFixed(precision),
      mean_latency: (parseFloat(bSuccess.mean_latency) - parseFloat(aSuccess.mean_latency)).toFixed(precision),
      std_latency: (parseFloat(bSuccess.std_latency) - parseFloat(aSuccess.std_latency)).toFixed(precision),
    },
    {
      type: "fail" as SummaryEventResponseType,
      count: bFail.count - aFail.count,
      percent: (parseFloat(bFail.percent) - parseFloat(aFail.percent)).toFixed(precision),
      mean_latency: (parseFloat(bFail.mean_latency) - parseFloat(aFail.mean_latency)).toFixed(precision),
      std_latency: (parseFloat(bFail.std_latency) - parseFloat(aFail.std_latency)).toFixed(precision),
    },
    {
      type: "in-flight" as SummaryEventResponseType,
      count: bInflight.count - aInflight.count,
      percent: (parseFloat(bInflight.percent) - parseFloat(aInflight.percent)).toFixed(precision),
      mean_latency: (parseFloat(bInflight.mean_latency) - parseFloat(aInflight.mean_latency)).toFixed(precision),
      std_latency: (parseFloat(bInflight.std_latency) - parseFloat(aInflight.std_latency)).toFixed(precision),
    }
  ]

  console.log("\nDiff of the events, (B - A):");
  console.table(diff);
}
