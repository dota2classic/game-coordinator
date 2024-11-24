import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { randomUser } from "@test/values";
import { BalanceService } from "../mm/queue/service/balance.service";
import { BalancerV0 } from "../mm/queue/service/balance";

export const randomPiq = () =>
  new PlayerInQueueEntity(
    randomUser(),
    BalancerV0(
      (1 - Math.exp(Math.random()) / 2.7) * Math.random() * 4000 + 1000,
      Math.random(),
      Math.floor(Math.random() * 500),
    ),
    undefined,
  );
