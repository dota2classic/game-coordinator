import {CommandHandler, EventBus, ICommandHandler, QueryBus,} from "@nestjs/cqrs";
import {Logger} from "@nestjs/common";
import {PlayerEnterQueueCommand} from "src/gateway/gateway/commands/player-enter-queue.command";
import {PartyRepository} from "src/mm/party/repository/party.repository";
import {PlayerEnterQueueResolvedEvent} from "src/mm/queue/event/player-enter-queue-resolved.event";
import {GetPlayerInfoQuery} from "src/gateway/gateway/queries/GetPlayerInfo/get-player-info.query";
import {Dota2Version} from "src/gateway/gateway/shared-types/dota2version";
import {GetPlayerInfoQueryResult} from "src/gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";
import {PlayerInQueueEntity} from "src/mm/queue/model/entity/player-in-queue.entity";
import {MatchmakingBannedEvent} from "src/gateway/gateway/events/matchmaking-banned.event";

@CommandHandler(PlayerEnterQueueCommand)
export class PlayerEnterQueueHandler
  implements ICommandHandler<PlayerEnterQueueCommand> {
  private readonly logger = new Logger(PlayerEnterQueueHandler.name);

  constructor(
    private readonly ebus: EventBus,
    private readonly partyRepository: PartyRepository,
    private readonly qbus: QueryBus,
  ) {}

  async execute(command: PlayerEnterQueueCommand) {
    const p = await this.partyRepository.getPartyOf(command.playerID);

    const formattedEntries: PlayerInQueueEntity[] = await Promise.all(
      p.players.map(async t => {
        const mmr = await this.qbus.execute<
          GetPlayerInfoQuery,
          GetPlayerInfoQueryResult
        >(new GetPlayerInfoQuery(t, Dota2Version.Dota_681));
        return {
          playerId: t,
          mmr: mmr.mmr,
          recentWinrate: mmr.recentWinrate,
          gamesPlayed: mmr.summary.rankedGamesPlayed,
          banStatus: mmr.banStatus,
        };
      }),
    );

    let any1Banned = false;

    const banStuff = formattedEntries.map(async t => {
      if (t.banStatus.isBanned) {
        any1Banned = true;
        await this.ebus.publish(
          new MatchmakingBannedEvent(t.playerId, t.banStatus),
        );
      }
    });

    await Promise.all(banStuff);


    if (!any1Banned)
      this.ebus.publish(
        new PlayerEnterQueueResolvedEvent(p.id, formattedEntries, command.mode),
      );
  }
}
