import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { PlayerEnterQueueCommand } from "gateway/gateway/commands/player-enter-queue.command";
import { PartyRepository } from "mm/party/repository/party.repository";
import { PlayerEnterQueueResolvedEvent } from "mm/queue/event/player-enter-queue-resolved.event";
import { GetPlayerInfoQuery } from "gateway/gateway/queries/GetPlayerInfo/get-player-info.query";
import { GetPlayerInfoQueryResult } from "gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { BalanceService } from "../../service/balance.service";
import { GetSessionByUserQueryResult } from "../../../../gateway/gateway/queries/GetSessionByUser/get-session-by-user-query.result";
import { GetSessionByUserQuery } from "../../../../gateway/gateway/queries/GetSessionByUser/get-session-by-user.query";
import { QueueException } from "../../exception/queue.exception";

@CommandHandler(PlayerEnterQueueCommand)
export class PlayerEnterQueueHandler
  implements ICommandHandler<PlayerEnterQueueCommand>
{
  private readonly logger = new Logger(PlayerEnterQueueHandler.name);

  constructor(
    private readonly ebus: EventBus,
    private readonly partyRepository: PartyRepository,
    private readonly qbus: QueryBus,
  ) {}

  async execute(command: PlayerEnterQueueCommand) {
    const p = await this.partyRepository.getPartyOf(command.playerID);

    try {
      const formattedEntries: PlayerInQueueEntity[] = await Promise.all(
        p.players.map(async (partyMember) => {
          const isInGame = await this.qbus.execute<
            GetSessionByUserQuery,
            GetSessionByUserQueryResult
          >(new GetSessionByUserQuery(partyMember));

          if (isInGame.serverUrl) {
            throw new QueueException("Can't queue while in game!");
          }

          const mmr = await this.qbus.execute<
            GetPlayerInfoQuery,
            GetPlayerInfoQueryResult
          >(new GetPlayerInfoQuery(partyMember, command.version));

          return {
            playerId: partyMember,
            balanceScore: BalanceService.getScore(
              mmr.mmr,
              mmr.recentWinrate,
              mmr.recentKDA,
              mmr.gamesPlayed,
            ),
            banStatus: mmr.banStatus,
          } satisfies PlayerInQueueEntity;
        }),
      );


      this.logger.verbose(
        `PlayerEnterQueueResolved ${JSON.stringify(formattedEntries)}`,
      );

      this.ebus.publish(
        new PlayerEnterQueueResolvedEvent(
          p.id,
          formattedEntries,
          command.mode,
          command.version,
        ),
      );
    } catch (e) {
      this.logger.error(
        `Party ${p.id} with ${p.players.length} can't enter queue! Somebody is in game`,
      );
    }
  }
}
