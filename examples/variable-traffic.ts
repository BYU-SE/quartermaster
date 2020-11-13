import { TimedDependency, stageSummary, simulation, LRUCache, metronome, eventSummary } from "../src";


/**
 * A variation on the timed example, where the rate of events being sent and
 * the response time of the dependency is changed at runtime.
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

metronome.setInterval(adjustEventRate, 1000);
metronome.setInterval(adjustLiveResponseTime, 800);


work();
async function work() {
  const events = await simulation.run(cache, 20000);
  eventSummary(events);
  stageSummary([cache, live])
}


function adjustEventRate(): void {
  simulation.eventsPer1000Ticks = Math.floor(40 + (Math.random() * 20 - 10));
  console.log(`simulation.eventPer1000Ticks = ${simulation.eventsPer1000Ticks}`)
}

function adjustLiveResponseTime(): void {
  live.mean = Math.floor(150 + (Math.random() * 30 - 15));
  console.log(`live.mean = ${live.mean}`)
}

