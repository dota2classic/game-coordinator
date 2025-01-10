import { Injectable } from "@nestjs/common";
import { Histogram, PrometheusContentType } from "prom-client";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Cron, CronExpression } from "@nestjs/schedule";
import * as client from 'prom-client';
import { PlayerId } from "../gateway/gateway/shared-types/player-id";
import { MatchmakingMode } from "../gateway/gateway/shared-types/matchmaking-mode";

interface EnteredQueue {
  pid: PlayerId;
  mode: MatchmakingMode;
  partySize: number;
  enterTime: number;
}

type QueueLeaveReason = "found" | "left";

@Injectable()
export class MetricsService {
  private readonly map = new Map<string, EnteredQueue>();

  constructor(
    @InjectMetric("d2c_queue_time") private readonly df: Histogram,
    private readonly pushgateway: client.Pushgateway<PrometheusContentType>,
  ) {}

  public enterQueue(
    player: PlayerId,
    mode: MatchmakingMode,
    partySize: number,
  ) {
    this.map.set(player.value, {
      pid: player,
      mode,
      partySize,
      enterTime: Date.now(),
    });
  }

  public leaveQueue(player: PlayerId, reason: QueueLeaveReason) {
    const ex = this.map.get(player.value);
    if (!ex) return;

    const diffMillis = Date.now() - ex.enterTime;

    this.recordQueueTime(ex.mode, ex.partySize, diffMillis / 1000, reason);
  }

  public recordQueueTime(
    mode: MatchmakingMode,
    partySize: number,
    duration: number,
    endReason: QueueLeaveReason,
  ) {
    this.df
      .labels(mode.toString(), partySize.toString(), endReason)
      .observe(duration);


    console.log("Recoreded ", duration)
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  private async pushMetrics() {
    await this.pushgateway.pushAdd({
      jobName: "game-coordinator",
    });
  }

  @Cron(CronExpression.EVERY_WEEKEND)
  private clearMetrics() {
    this.df.reset();
  }
}
