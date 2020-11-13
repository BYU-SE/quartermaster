import { TimedDependency, stageSummary, simulation, LRUCache, eventSummary } from "../src";


/**
 * The timed example is the basic unit of several other examples. It features
 * a timed dependency, which might represent a database, and a cache.
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

work();
async function work() {
  const events = await simulation.run(cache, 20000);
  eventSummary(events);
  stageSummary([cache, live])
}


