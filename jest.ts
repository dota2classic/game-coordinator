import { EventBus, IEvent } from "@nestjs/cqrs";
import { deepStrictEqual } from "assert";
import { inspect } from "util";
import Mock = jest.Mock;

expect.extend({
  toEmit(bus: EventBus, ...events: IEvent[]): jest.CustomMatcherResult {

    if(events === undefined){
      events = [];
    }

    const p = bus.publish as Mock;
    let expected = p.mock.calls.length

    expect(events.length || 0).toEqual(expected)

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      const p = bus.publish as Mock;
      let expected = p.mock.calls[i][0];

      try {
        deepStrictEqual(e, expected);
      } catch (e) {
        const message: () => string = () =>
          `Received event at [${i}] expected to be ${inspect(
            expected,
          )} but was ${inspect(e)}`;

        return {
          message,
          pass: false,
        };
      }
    }

    return {
      message: () => "",
      pass: true,
    };
  },
});
