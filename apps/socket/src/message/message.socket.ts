import { Logger } from '@nestjs/common';
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MESSAGE_EVENT } from './message.event';
import { MessageService } from './message.service';

type typeSocket = Socket & { user: any };
@WebSocketGateway({ cors: true })
export class MessageSocket implements OnGatewayInit {
  constructor(private readonly _messageService: MessageService) {}

  @WebSocketServer() private server: Server;
  private logger: Logger = new Logger('MessageGateway');

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  @SubscribeMessage(MESSAGE_EVENT.SEEN_MESSAGE_CONVERSATION_CSS)
  private async handleOnMessage(
    client: typeSocket,
    payload: {
      idConversation: string;
      idMessage: string;
    },
  ): Promise<void> {
    console.log('SEEN_MESSAGE_CSS', payload);
    const result = await this._messageService.getMessageDetail(
      payload.idMessage,
    );
    if (!!result) {
      result.subscribe((res) => {
        client.emit(MESSAGE_EVENT.SEEN_MESSAGE_CONVERSATION_SSC, res.data);
      });
      return;
    }
    client.to(client.id).emit(MESSAGE_EVENT.SEEN_MESSAGE_CONVERSATION_SSC, {
      message: 'get message fail',
      data: null,
    });

    // client
    //   .to(payload.idConversation)
    //   .emit(MESSAGE_EVENT.SEEN_MESSAGE_CONVERSATION_SSC, result);
  }

  @SubscribeMessage(MESSAGE_EVENT.JOIN_CONVERSATION_CSS)
  private async handleOnJoinRoomConversation(
    client: typeSocket,
    payload: {
      idConversation: string;
    },
  ): Promise<void> {
    console.log('JOIN_CONVERSATION_SSC', payload);
    client.join(payload.idConversation);
    client.to(client.id).emit(MESSAGE_EVENT.JOIN_CONVERSATION_SSC, {
      message: 'join room success',
      data: null,
    });
  }

  @SubscribeMessage(MESSAGE_EVENT.LEAVE_CONVERSATION_CSS)
  private async handleOnLeaveRoom(
    client: typeSocket,
    payload: {
      idConversation: string;
    },
  ): Promise<void> {
    console.log('LEAVE_CONVERSATION_SSC', payload);
    client.leave(payload.idConversation);
    client.to(client.id).emit(MESSAGE_EVENT.LEAVE_CONVERSATION_SSC, {
      message: 'leave room success',
      data: null,
    });
  }
}
