import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { randomUser } from "@test/values";

export const randomPiq = (maxMmr: number = 5000) =>
  new PlayerInQueueEntity(
    randomUser(),
    (1 - Math.exp(Math.random()) / 2.7) * Math.random() * 4000 + 1000,
    Math.random(),
    Math.random(),
    Math.random() * 500,
    undefined,
    0,
  );
