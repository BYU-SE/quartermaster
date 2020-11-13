

import { TimedDependency, LRUCache, Event, metronome, stageSummary, eventSummary } from "../src";

/**
 * A variation of the timed example. Instead of events being sent by the 
 * simulation, events are manually sent to the stage.
 */

const live = new TimedDependency();
live.availability = 0.995;
live.mean = 150;
live.std = 20;

const cache = new LRUCache(live);
cache.ttl = 30000;
cache.capacity = 500

manual();
async function manual() {
  const first = cache.accept(new Event("a"))
  const second = cache.accept(new Event("b"))
  const third = cache.accept(new Event("a"))

  metronome.start();
  const responses = await Promise.all([first, second, third])
  metronome.stop(true);

  stageSummary([cache, live])
}

