# Quartermaster

A Tool for Modeling and Simulating System Degradation

---

## Installation

To explore and develop locally, you can clone this repository. Then, run `npm i` to install dependencies. This provides the examples and Typescript source code in an easy to consume format.

## Usage

A sample usage, representing a call to a remote dependency with a cache:

```typescript
import {
  TimedDependency,
  LRUCache,
  simulation,
  eventSummary,
  stageSummary,
} from ".";

/**
 * The timed example is the basic unit of several other examples. It features
 * a timed dependency with available 99.5% of the time and a normally
 * distributed latency with mean = 150 ticks and standard deviation = 20 ticks.
 * Additionally, there is an LRU cache that can contain up to 500 cached items
 * with a max age of 30,000 ticks.
 *
 * The timed dependecy stage could represent a database and the lru cache
 * stage could represent a small, in memory cache that serves to speed up
 * responses to commonly queried items.
 */

const live = new TimedDependency();
live.availability = 0.995;
live.mean = 150;
live.std = 20;

const cache = new LRUCache(live);
cache.ttl = 30000;
cache.capacity = 500;

/**
 * The keyspace is defined with normally distributed keys with a mean of 999
 * and a standard deviation of 90. Additionally, the simulation will push
 * 40 events every 1,000 ticks through the stages.
 *
 * This keyspace could represent a service which responds to a (relatively)
 * small set of distinct events at the rate of 40 requests per second.
 */

simulation.keyspaceMean = 999;
simulation.keyspaceStd = 90;
simulation.eventsPer1000Ticks = 40;

work();
async function work() {
  const events = await simulation.run(cache, 20000);
  eventSummary(events);
  stageSummary([cache, live]);
}
```

## The Quartermaster Model

A system that is fault tolerant is resistant to faults, often by allowing the system to degrade gracefully instead of failing immediately. There are certain techniques that are commonly used in industry to this end, such as caching, retries, short timeouts, and the circuit breaker pattern.

In Quartermaster, a user can describe a system's structure and the fault-tolerant techniques it uses as various configurations of a single unit: the stage. A stage contains a queue and several methods which can be overwritten: `add()`, `workOn()`, `success()`, and `fail()`. Events are the basic units that pass through stages. In a web system, these events are analogous to http requests.

`add()` An admission control function, called before the event enters the queue.
\
`workOn()` Called when the event has left the queue and has been picked up by a worker.
\
`success()` Called when `workOn()` did not throw an error or returned a rejected promise.
\
`fail()` Called when `workOn()` did throw an error or returned a rejected promise.

[Read more about the Quartermaster model.](docs/model.md)

## Simulating With Quartermaster

Some tools are provided to implement these methods and simulate their behavior, such as a variety of prebuilt fault tolerant techniques. Since this repository is a TypeScript implementation of the model, we've included a brief overview here. You can [read more in-depth about how Quartermaster simulates a system](docs/simulation.md) in our docs.

### Rich Default Output

The simulation's `eventSummary([...events])` displays a quick summary of statistics of the events.

```
Overview of Events
┌─────────┬───────────┬───────┬─────────┬──────────────┬─────────────┐
│ (index) │   type    │ count │ percent │ mean_latency │ std_latency │
├─────────┼───────────┼───────┼─────────┼──────────────┼─────────────┤
│    0    │ 'success' │   4   │ '0.800' │  '153.500'   │  '10.874'   │
│    1    │  'fail'   │   1   │ '0.200' │  '144.000'   │   '0.000'   │
└─────────┴───────────┴───────┴─────────┴──────────────┴─────────────┘
```

The simulation also comes bundled with `stageSummary([...stages])` methods, which displays rich output of a set of stages.

```
Overview of event time spent in stage
┌─────────┬─────────────┬───────────┬──────────┐
│ (index) │    stage    │ queueTime │ workTime │
├─────────┼─────────────┼───────────┼──────────┤
│    0    │ 'LRUCache'  │     7     │   604    │
│    1    │ 'TimedLive' │    10     │   592    │
└─────────┴─────────────┴───────────┴──────────┘

Overview of event behavior in stage
┌─────────┬─────────────┬─────┬────────┬─────────┬──────┐
│ (index) │    stage    │ add │ workOn │ success │ fail │
├─────────┼─────────────┼─────┼────────┼─────────┼──────┤
│    0    │ 'LRUCache'  │  5  │   5    │    4    │  1   │
│    1    │ 'TimedLive' │  5  │   5    │    4    │  1   │
└─────────┴─────────────┴─────┴────────┴─────────┴──────┘
```

### Prebuilt Techniques

You don't need to code your entire system up in Quartermaster to use it. Quartermaster comes with a set of prebuilt components and techniques that are easily configured. If they don't cover all of your requirements, we've provided examples to help build whatever you need.

- Caching
  - Unbounded: An unlimited size cache
  - LRU: A fixed capacity cache, that evicts the least-recently-used elements.
  - Background Cache: A cache which serves inbound requests strictly from cached data, and refreshes the requested data in the background.
- Circuit Breaker Pattern: Don't wait for an operation that will (or is likely to) fail.
- Retry: Attempt multiple times upon a failure.
- Timeout: Limit how much time is being spent working on an event.

Additionally, we've included some prebuilt stages to simulate the actual dependency (such as a database, another remote dependency, or even a 3rd party API) that is being called.

- AvailableDependency: Responds immediately with some availability.
- TimedDependency: Responds with some availability and latency distributions.

Our [examples](docs/examples.md) show you many of these in action.

### Custom Statistics

While the Quartermaster looks at measuring and evaluating degradation, it is possible that you want to measure additional properties or analyze other behavior of the system. The model is flexible enough to support doing this, and we've provided an example which includes a few ways to do so. See [the custom statistics example](docs/examples.md).

## Examples

The `./examples` directory includes some interesting examples with documentation and descriptions.

[Read more about examples provided with Quartermaster.](docs/examples.md)

## Tests

Tests can be run with `npm test`.

All prebuilt components have been placed under tests, located in the `./tests` directory.

## Contributing

Open a pull request with your contributions to the Quartermaster, or request a feature by opening an issue.

## Known Issues

Node 10: Some behavioral changes - likely due to changes in the NodeJS task processing. Please use Node 12+

## Publications

**ICSE 2021 Demonstrations Track**: *Quartermaster: A Tool for Modeling and Simulating System Degradation* [Proceedings](https://www.computer.org/csdl/proceedings-article/icse-companion/2021/121900a057/1sET5Q6iyyI) | [arXiv](https://arxiv.org/abs/2103.03956#) 
