import { MetricsService } from "./metrics.service";
import { PartyQueueStateUpdatedHandler } from "./event-handler/party-queue-state-updated.handler";
import { makeHistogramProvider } from "@willsoto/nestjs-prometheus";
import { Provider } from "@nestjs/common";
import { MetricsQueueEndGameFoundHandler } from "./event-handler/metrics-queue-end-game-found.handler";
import { MetricsQueueEndLeftHandler } from "./event-handler/metrics-queue-end-left.handler";

export const MetricsProviders: Provider[] = [
  MetricsService,
  PartyQueueStateUpdatedHandler,
  MetricsQueueEndGameFoundHandler,
  MetricsQueueEndLeftHandler,

  makeHistogramProvider({
    name: "d2c_queue_time",
    help: "123",
    labelNames: ["mode", "party_size", "end_reason"],
    buckets: [1, 5, 10, 30, 60, 120, 60 * 5, 60 * 30, 60 * 60, 60 * 180],
  }),
];
