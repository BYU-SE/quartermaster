# Quartermaster - Examples

We have provided a set of examples to demonstrate how Quartermaster can be used to 1) explore interesting behavior of existing techniques 2) create novel techniques.

## Table of Contents

**[1. Incident Reports](#reports)** \
**[2. Timed](#Timed)** \
**[3. Manual Events](#Manual-Events)** \
**[4. Aggressive Timeout](#Aggressive-Timeout)** \
**[5. Variable Traffic](#Variable-Traffic)** \
**[6. Other](#other)**

## Incident Reports

Incident reports are a great source of system degradation that Quartermaster may be able to model in useful ways. We've included a single model from this incident report, and others are available in the official Quartermaster Incident Model repository, which you can reach from [BYU-SE's GitHub page](https://github.com/BYU-SE).

### CircleCI 2015 Incident

`./examples/circleci`

Summary: A large burst in traffic caused a deadlocked database, cascading failures into the build service. Engineers prevented new elements from joining a backed up queue, turned off automatic retries, optimized slow database queries, and provisioned new hardware.

[Full Incident Report](https://circleci.statuspage.io/incidents/hr0mm9xmm3x6) | [Quartermaster Implementation](../examples/circleci)

## Timed

If you are jumping into Quartermaster, start with this example.

The timed example demonstrates a simple dependency that has cache before it. This might represent a call to a local database service, with a small in-memory TTL cache to help cover frequently requested keys and improve the response time.

This example shows how such a cache and dependency are represented as a `LRUCache` and a `TimedDependency` and how to configure properties on each.

[Quartermaster Implementation](../examples/timed.ts)

## Manual Events

This example shows how to manually send events through an identical system to the Timed example (a dependency with a cache). This could prove useful as starter code to demonstrate how to replay live traffic through the system.

[Quartermaster Implementation](../examples/manual.ts)

## Aggressive Timeout

This example shows how to evaluate the effects of using specific techniques on some system. A `TimedDependency` represents some remote dependency that has an interesting property: failures have a higher latency than successes.

Since failures are slower than successes, it is possible to configure a timeout that allows for most successes to happen and ensures that we don't wait eventually what will be failures. This timeout would allow for faster retries when it is statistically like a failure will happen.

Events are sent through the system without any fault tolerant technique and through a duplicate system that contains a retry and timeout. Then, a summary is displayed of the events from both systems to evaluate how behavior changed. Finally, this example demonstrates `eventCompare(events, events2)`, which provides a simple diff between the two sets of events.

[Quartermaster Implementation](../examples/aggresive-timeouts.ts)

## Other

We provide a few other types of examples that may be interesting. This list may grow to demonstrate new features of Quartermaster or to provide clarity in some areas.

[Using a LIFOQueue to Sort Incoming Events](../examples/queue-sorting.ts) \
[Creating Custom Statistics](../examples/custom-statistics.ts)
