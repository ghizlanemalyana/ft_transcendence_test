import { PrismaClient, ParticipantRole } from "@prisma/client";
import { ChatGateway } from "../chat/chatGateway";

export class ChatService {
  constructor(private prisma: PrismaClient, private chatGateway: ChatGateway) {}

  async createConversation(userId: number, dto: { name?: string; type?: "DIRECT" | "GROUP"; members?: number[] }) {
    const type = dto.type || "GROUP";

    const participants = dto.members
      ? dto.members.map((id) => ({
          userId: id,
          role: ParticipantRole.MEMBER,
        }))
      : [];

    participants.push({
      userId,
      role: ParticipantRole.OWNER,
    });

    const conversation = await this.prisma.conversation.create({
      data: {
        name: dto.name,
        type,
        participants: {
          create: participants,
        },
      },
      include: {
        participants: { include: { user: true } },
      },
    });

    this.chatGateway.handleMemberJoinRoomChat(userId, conversation.id);
    return conversation;
  }


  async joinConversation(userId: number, conversationId: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.type !== "GROUP") {
      throw new Error("Conversation not found or not joinable");
    }

    const existing = await this.prisma.participant.findUnique({
      where: {
        userId_conversationId: { userId, conversationId },
      },
    });

    if (existing) return existing;

    const participant = await this.prisma.participant.create({
      data: {
        userId,
        conversationId,
        role: ParticipantRole.MEMBER,
      },
    });

    this.chatGateway.handleMemberJoinRoomChat(userId, conversationId);
    return participant;
  }

  async sendMessage(userId: number, dto: { conversationId: number; content: string }) {
    const participant = await this.prisma.participant.findUnique({
      where: {
        userId_conversationId: {
          userId,
          conversationId: dto.conversationId,
        },
      },
    });

    if (!participant || participant.banned || participant.muted) {
      throw new Error("You are not allowed to send messages");
    }

    const message = await this.prisma.message.create({
      data: {
        content: dto.content,
        senderId: userId,
        conversationId: dto.conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    this.chatGateway.handleEmitNewMessage(message);
    return message;
  }

  async getConversation(userId: number, conversationId: number) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: { include: { user: true } },
      },
    });

    if (!conversation) throw new Error("Conversation not found");

    this.chatGateway.handleMemberJoinRoomChat(userId, conversationId);
    return conversation;
  }

  async getConversationMessages(userId: number, conversationId: number) {
    const participant = await this.prisma.participant.findUnique({
      where: {
        userId_conversationId: { userId, conversationId },
      },
    });

    if (!participant) throw new Error("Access denied");

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: { sender: true },
    });
  }

  async leaveConversation(userId: number, conversationId: number) {
    const participant = await this.prisma.participant.findUnique({
      where: {
        userId_conversationId: { userId, conversationId },
      },
    });

    if (!participant) throw new Error("Not in conversation");

    await this.prisma.participant.delete({
      where: {
        userId_conversationId: { userId, conversationId },
      },
    });

    this.chatGateway.handleRemoveSocketIdFromRoom(userId, conversationId);
    return { success: true };
  }

  async muteUser(adminId: number, dto: { conversationId: number; userId: number; mute: boolean }) {
    await this.checkAdmin(adminId, dto.conversationId);

    return this.prisma.participant.update({
      where: {
        userId_conversationId: {
          userId: dto.userId,
          conversationId: dto.conversationId,
        },
      },
      data: { muted: dto.mute },
    });
  }

  async banUser(adminId: number, dto: { conversationId: number; userId: number; ban: boolean }) {
    await this.checkAdmin(adminId, dto.conversationId);

    const result = await this.prisma.participant.update({
      where: {
        userId_conversationId: {
          userId: dto.userId,
          conversationId: dto.conversationId,
        },
      },
      data: { banned: dto.ban },
    });

    this.chatGateway.handleRemoveSocketIdFromRoom(dto.userId, dto.conversationId);
    return result;
  }

  async setAdmin(adminId: number, dto: { conversationId: number; userId: number }) {
    await this.checkOwner(adminId, dto.conversationId);

    return this.prisma.participant.update({
      where: {
        userId_conversationId: {
          userId: dto.userId,
          conversationId: dto.conversationId,
        },
      },
      data: { role: ParticipantRole.ADMIN },
    });
  }


  private async checkAdmin(userId: number, conversationId: number) {
    const participant = await this.prisma.participant.findUnique({
      where: {
        userId_conversationId: { userId, conversationId },
      },
    });

    if (!participant || (participant.role !== "ADMIN" && participant.role !== "OWNER")) {
      throw new Error("Admin rights required");
    }
  }

  private async checkOwner(userId: number, conversationId: number) {
    const participant = await this.prisma.participant.findUnique({
      where: {
        userId_conversationId: { userId, conversationId },
      },
    });

    if (!participant || participant.role !== "OWNER") {
      throw new Error("Owner rights required");
    }
  }
}
