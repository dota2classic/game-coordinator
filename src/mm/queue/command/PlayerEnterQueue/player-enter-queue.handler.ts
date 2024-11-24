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
import { PlayerId } from "../../../../gateway/gateway/shared-types/player-id";
import { Dota2Version } from "../../../../gateway/gateway/shared-types/dota2version";
import { BalancerV0 } from "../../service/balance";

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

  private getExtendedInfo(
    players: PlayerId[],
    version: Dota2Version,
  ): Promise<PlayerInQueueEntity[]> {
    return Promise.all(
      players.map(async (partyMember) => {
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
        >(new GetPlayerInfoQuery(partyMember, version));

        return {
          playerId: partyMember,
          balanceScore: BalancerV0(
            mmr.mmr,
            mmr.recentWinrate,
            // mmr.recentKDA,
            mmr.gamesPlayed,
          ),
          banStatus: mmr.banStatus,
        } satisfies PlayerInQueueEntity;
      }),
    );
  }

  async execute(command: PlayerEnterQueueCommand) {
    const p = await this.partyRepository.getPartyOf(command.playerID);

    const formattedEntries = await this.getExtendedInfo(
      p.players,
      command.version,
    );

    try {
      this.logger.verbose(`PlayerEnterQueueResolved`, formattedEntries);

      this.ebus.publish(
        new PlayerEnterQueueResolvedEvent(
          p.id,
          formattedEntries,
          command.mode,
          command.version,
        ),
      );
    } catch (e) {
      this.logger.log(e);
      this.logger.error(
        `Party ${p.id} with ${p.players.length} players can't enter queue! Somebody is in game`,
      );
    }
  }
}
