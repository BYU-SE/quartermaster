# Quartermaster - Model

You can model an entire system in Quartermaster, including system components and fault tolerant techniques (like caching, retries, timeouts, circuit breaker pattern, priority queueing, etc). The Quartermaster was originally proposed in a paper awaiting publication. The Typescript implementation differs from the model in a few ways, which are denotated with a `*` where they are important to note. (This document focuses on the Typescript implementation; if you are interested in the actual model that was written, read the paper.) If you are interested in the simulation aspect, you can [read about simulating the model with Quartermaster](simulation.md).

## Stage

A set of system components and techniques can be generalized as a series (network) of stages. An individual stage consists of:

- (optionally) a queue and worker pool for inbound events
- a set of overloadable event driven methods.

Some techniques can be represented by a single, independent stage such as a lone timeout or retry. Alternatively, a single technique could require several tightly coupled stages to function. Or, several techniques could be implemented in a single stage.

The stage design used by the quartermaster was inspired by SEDA<sup id="seda">1</sup>, staged event-driven architecture. In SEDA, events pass through a set of stages conected by queues. Each stage does some work and passes it on to some other stages. Similarly, the Quartermaster's events flow through a network of stages where work can be performed.

The high-level flow of events is:

1. An event is given to the stage
2. The stage can accept or reject the event
3. (Optionally) The event enters a queue
4. (Optionally) The event waits to be processed by a worker
5. The stage performs some work
6. If the work succeeded, the stage records a success, else the stage records a failure

By saying the stage performs some work, we mean the stage can record statistics, alter the event, store a property on the event, perform a network request, stop event propagation through the network of stages, fire off new events, etc.

[1]: While [SEDA](http://www.sosp.org/2001/papers/welsh.pdf) was proposed as a way to architect software systems, not all actual systems are architected in this form. It can be complex to design an equivalent non-staged system in SEDA and verify that its behavior is identical. Thus, we chose not to use the exact SEDA architecture for Quartermaster. Quartermaster is flexible to support non-SEDA and SEDA architectures alike.

An example implementation of the stage (a Retry):

```typescript
export class Retry extends WrappedStage {
  public attempts: number = 2;
  async workOn(event: Event): Promise<void> {
    let attempt: number = 1;
    while (attempt <= this.attempts) {
      try {
        await this.wrapped.accept(event);
        return;
      } catch {
        attempt++;
      }
    }
    throw "fail";
  }
}
```

## Event

An event is contextual data that is sent to a dependency. In a web server with a remote dependency, the event is analogous to an HTTP request. The event is a key, which describes the resource that is being requested. That is, two different events with the same key are asking for the same data from the dependency.

Referring to _Diagram 1_, events traditionally originate in the client, are sent to the server, then to the stage, and finally to the dependency. Additionally, stages can create events, which can serve to help further isolate the server and the dependency.

## Event Handlers

Event handlers are triggered as an event flows through a stage. These handlers are the minimal set of events needed to describe any techniques to be represented (such as retries, timeouts, caches, etc). Additional events could be added out of convenience, but many of those can be done using this minimal set.

The event handlers on the stage are:

| Method                    | Triggered On                              |
| ------------------------- | ----------------------------------------- |
| `add(event):void`         | An event enters the stage's queue.        |
| `workOn(event):void`      | An event leaves the queue to be serviced. |
| `success(event):Response` | An event's `workOn()` succeeded.\*        |
| `fail(event):Response`    | An event's `workOn()` failed.\*           |

> \* NOTE: These events handlers are not included in the actual Quartermaster model, but are provided for convenience in this implementation, since they often lead to cleaner code when used.

Some of these event methods have default behavior, specified below.

| Method           | Default Behavior              |
| ---------------- | ----------------------------- |
| `add(event)`     | Rejects if the queue is full. |
| `workOn(event)`  | None.                         |
| `success(event)` | Always returns `"success"`.   |
| `fail(event)`    | Always throws `"fail"`.       |

## Queue

The queue is a buffer within the stage where events can wait to be be removed from the queue by a worker and worked on by the stage. Not all stages have a queue. (However, a stage without a queue is effectively equivalent to a stage with unlimited length queue and unlimited size worker pool.)

The queue affects the timing, order, and quantity of events allowed into the stage. The queue itself can be a technique used in graceful degradation. For example, a FIFO queue with a fixed length can act as a shock absorber for incoming traffic. As events arrive at a varying pace, a queue and worker pool allows for load-leveling.

> \* NOTE: By default, Quartermaster assigns a default type of queue called a `NoQueue` to each stage, to ensure that the underlying simulation has a fixed, orderly, and automatic set of operations to call on each stage. That is, when an event arrives to a stage, the simulation will always try to enqueue it. When there is a free worker to service an event from the queue, the event is dequeued and the `workOn()` is dispatched. The `NoQueue` acts as if there were no queue there - it will never fill up, and there will always be a worker available to service events as they arrive.

The queue is an interface with a small contract that covers the queue and worker pool:

| Method               | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `enqueue(event)`     | Returns a promise for a worker assigned to service the event. |
| `isFull()`           | Is the queue full?                                            |
| `setCapacity(num)`   | Sets the max length of the queue.                             |
| `getCapacity()`      | Gets the max length of the queue.                             |
| `hasFreeWorker()`    | Is there a free worker?                                       |
| `setNumWorkers(num)` | Sets the number of workers.                                   |
| `getNumWorkers()`    | Gets the number of workers.                                   |
| `work`               | Process an event off the queue if it can.                     |

This interface is likely different from typical queue interfaces that exist in actual systems. This different interface allows the simulation to not worry about any weird differences that could affect actual queue behavior - for example, a LIFO-Queue vs a class based priority queue. This is important since it is the simulation that _drives_ the queue, rather than the queue or stage. More information is provided on the [simulation document](simulation.md).

### Worker Pool

The worker pool is a set of objects (workers) which pull events from the queue to be worked on by the stage. A worker becomes busy when it retrieves at least one event from the queue. A busy worker cannot retrieve additional events from the queue until it is freed. A busy worker is freed when the stage has completed working on the event(s) that the worker has. By default, a worker only dequeues a single event, but you can change this behavior by extending the Queue and Worker classes to permit this.

The worker pool affects the rate at which events are served and the number of events being worked on concurrently by the stage.
