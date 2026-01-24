import { SocketServer } from "../realtime/socketServer";
import { Conversation, Participant, Message } from "@prisma/client";

export class ChatGateway {
  constructor(private socketServer: SocketServer) {}

  private roomName(conversationId: number) {
    return `chatRoom_${conversationId}`;
  }

  handleMemberJoinRoomChat(userId: number, conversationId: number) {
    this.joinRoom(userId, conversationId);
  }

  handleEmitUpdateConversation(conversation: Conversation & { participants: Participant[] }, senderId: number) {
    this.emitConversationUpdate(conversation, senderId);
  }

  handleEmitNewMessage(message: Message) {
    this.emitNewMessage(message);
  }

  handleRemoveSocketIdFromRoom(userId: number, conversationId: number) {
    this.leaveRoom(userId, conversationId);
  }

  joinRoom(userId: number, conversationId: number) {
    const socketId = this.socketServer.getSocketIdFromUserId(userId);
    if (!socketId) return;

    this.socketServer
      .getIO()
      .in(socketId)
      .socketsJoin(this.roomName(conversationId));
  }

  leaveRoom(userId: number, conversationId: number) {
    const socketId = this.socketServer.getSocketIdFromUserId(userId);
    if (!socketId) return;

    this.socketServer
      .getIO()
      .in(socketId)
      .socketsLeave(this.roomName(conversationId));
  }

  emitNewMessage(message: Message) {
    const senderSocket = this.socketServer.getSocketIdFromUserId(message.senderId);

    this.socketServer
      .getIO()
      .to(this.roomName(message.conversationId))
      .except(senderSocket)
      .emit("newMessage", message);
  }

  emitConversationUpdate(conversation: Conversation & { participants: Participant[] }, senderId: number) {
    const senderSocket = this.socketServer.getSocketIdFromUserId(senderId);

    const sockets = conversation.participants
      .map(p => this.socketServer.getSocketIdFromUserId(p.userId))
      .filter(Boolean);

    this.socketServer
      .getIO()
      .to(sockets)
      .except(senderSocket)
      .emit("updateConversation", conversation);
  }
}




