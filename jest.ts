import { EventBus, IEvent } from "@nestjs/cqrs";
import { deepStrictEqual } from "assert";
import { inspect } from "util";
import Mock = jest.Mock;

expect.extend({
  toEmit(bus: EventBus, ...events: IEvent[]): jest.CustomMatcherResult {
    if (events === undefined) {
      events = [];
    }

    const p = bus.publish as Mock;


    for (let i = 0; i < events.length; i++) {
      const expected = events[i];

      // for some reason they are emitted in reversed order
      // let actual = p.mock.calls[p.mock.calls.length - i - 1][0];
      let actual = p.mock.calls[i][0];

      try {
        deepStrictEqual(actual, expected);
      } catch (_) {
        const message: () => string = () =>
          `Received event at [${i}] expected to be ${inspect(
            expected,
          )} but was ${inspect(actual)}`;

        return {
          message,
          pass: false,
        };
      }
    }

    let actual = p.mock.calls.length;

    expect(actual).toEqual(events.length || 0);

    return {
      message: () => "",
      pass: true,
    };
  },
});
