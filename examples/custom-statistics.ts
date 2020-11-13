import { TimedDependency, stageSummary, simulation, LRUCache, eventSummary, metronome, Event, WrappedStage } from "../src";


/**
 * A variation on the timed example, demonstrating several ways to collect
 * custom statistics.
 */

const live = new TimedDependency();
live.availability = 0.995;
live.mean = 150;
live.std = 20;

const cache = new LRUCache(live);
cache.ttl = 30000;
cache.capacity = 500

simulation.keyspaceMean = 999;
simulation.keyspaceStd = 90;
simulation.eventsPer1000Ticks = 40;

/**
 * A custom stat, implemented with metronome.
 * Polls a summary of the cache every 30 seconds.
 */

type CacheStats = { keys: number, averageAge: number }
const cacheSample: CacheStats[] = [];
metronome.setInterval(sampleCache, 30000);





/**
 * A custom stat, implemented with a custom stage.
 * Gathers information about keys that pass through this stage.
 */
type KeyStats = Record<string, number>;
class InterceptionStage extends WrappedStage {
  public keyCounts: KeyStats = {};
  async workOn(event: Event): Promise<void> {
    this.keyCounts[event.key] = this.keyCounts[event.key] + 1 || 1
    await this.wrapped.accept(event);
  }
}
const interception = new InterceptionStage(cache);


work();
async function work() {
  const events = await simulation.run(interception, 20000);

  /**
   * The default summaries can be augmented by the 2nd optional argument,
   * which allows you to pass in a custom data to print out in the table
   */
  eventSummary(events, [{ func: customEventColumn, name: "Custom Column" }]);
  stageSummary([cache, live])

  console.log("")
  console.log("Cache Summary every 30 seconds")
  console.table(cacheSample);



  /**
   * Custom stat reporting at the conclusion of the simulation. The 
   * summaries that come with the framework are for convenience and you can
   * always write your own.
   */
  console.log("")
  console.log("Top Keys Sent summary:");
  const top = Object.entries(interception.keyCounts).
    sort((a, b) => b[1] - a[1]).
    slice(0, 10).
    map(x => ({ key: x[0], count: x[1] }));
  console.table(top);
}


/**
 * The sampler for the custom stat that queries cthe ache for key information.
 */
function sampleCache() {
  // filter out stale keys
  const store = cache.getStore();
  const usedKeys = Object.keys(store).filter(key => !!cache.get(key));
  const keys = usedKeys.length;

  // early exit prevents divide by 0
  if (keys == 0) {
    cacheSample.push({ keys, averageAge: 0 })
    return;
  }

  const averageAge = usedKeys.reduce<number>((sum, current: any) => sum + (metronome.now() - cache.get(current).time), 0) / keys;
  cacheSample.push({ keys, averageAge })
}


/**
 * An additional column for the framework's event summary,
 * It gets the average work time for the dependency for a set of
 * events.
 */

function customEventColumn(events: Event[]): number {
  return events.map(e => e.stageTimes[0].workTime).reduce((a, c) => a + c, 0) / events.length
}