
import {eventSummary, simulation, stageSummary, metronome, stats, LRUCache, AvailableDependency, NoServiceQueue} from "../../src";
import {ApiStage} from "./api-stage";


const database = new AvailableDependency();
database.availability = 0.995;

const cache = new LRUCache(database);
cache.inQueue = new NoServiceQueue();
cache.ttl = 30000;
cache.capacity = 500

const api = new ApiStage(cache);

simulation.keyspaceMean = 1000;
simulation.keyspaceStd = 100;
simulation.eventsPer1000Ticks = 1000;


work();
async function work() {
    const events = await simulation.run(api, 5); // 200ish seconds of execution time
    eventSummary(events);
    stageSummary([api, cache, database])
}
