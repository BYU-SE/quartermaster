import { TimeStats, ResponseStats, Response } from ".";

/**
 * An event goes through a stage. In web systems, it could be a web request.
 * Two events with the same key are identical, but could have originated from
 * two separate sources.
 * Each event has a unique id.
 * 
 * An event keeps track of time spent in various stages.
 * 
 * @template CustomProps The type of custom properties that exist on `event.custom`
 */
export class Event<CustomProps extends object = {}> {
  private static idCounter: number = 0;

  public static resetIDCounter(): void {
    this.idCounter = 0;
  }

  public static getIDCounter(): number {
    return this.idCounter;
  }


  /**
   * Quick-access timing information about this event and how long it spent
   * in each stage.
   */
  public readonly stageTimes: TimeStats[] = [];

  /**
   * The response, if any, from some stage to this event.
   */
  public response: Response | null = null;

  /**
   * Quick-access timing information about this event and its response
   */
  public readonly responseTime: ResponseStats = new ResponseStats();

  /**
   * A unique identifer for this event
   */
  public readonly id: number;

  /**
   * Store custom data on the event object, separated from other properties
   * so there are no accidental overwrites.
   * 
   * Typed as any intentionally, so we can new up an empty object when the Event
   * is created
   */
  private customProperties: any = {};

  constructor(public key: string) {
    this.id = ++Event.idCounter;
  }

  addStageTime(t: TimeStats): void {
    this.stageTimes.push(t);
  }

  public get custom(): CustomProps {
    return this.customProperties;
  }
}
