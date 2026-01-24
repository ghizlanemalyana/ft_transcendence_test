import { FastifyInstance } from "fastify";
import { ChatService } from "../chat/chatService";

export function chatController(chatService: ChatService) {
  return async function (fastify: FastifyInstance) {

    fastify.post("/conversation/create", async (request: any, reply) => {
      try {
        const { userId, name, type, members } = request.body;

        const conversation = await chatService.createConversation(
          Number(userId),
          { name, type, members }
        );

        return reply.status(200).send(conversation);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    });

    fastify.post("/conversation/:id/join", async (request: any, reply) => {
      try {
        const userId = Number(request.body.userId);
        const conversationId = Number(request.params.id);

        const participant = await chatService.joinConversation(
          userId,
          conversationId
        );

        return reply.status(200).send(participant);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    });


    fastify.put("/conversation/:id/leave", async (request: any, reply) => {
      try {
        const userId = Number(request.body.userId);
        const conversationId = Number(request.params.id);

        const result = await chatService.leaveConversation(
          userId,
          conversationId
        );

        return reply.status(200).send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    });

    fastify.post("/conversation/:id/message", async (request: any, reply) => {
      try {
        const userId = Number(request.body.userId);
        const conversationId = Number(request.params.id);
        const content = request.body.content;

        const message = await chatService.sendMessage(userId, {
          conversationId,
          content,
        });

        return reply.status(200).send(message);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    });


    fastify.put("/conversation/:id/mute", async (request: any, reply) => {
      try {
        const conversationId = Number(request.params.id);
        const { adminId, userId, mute } = request.body;

        const result = await chatService.muteUser(
          Number(adminId),
          { conversationId, userId: Number(userId), mute }
        );

        return reply.send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    });

    fastify.put("/conversation/:id/admin", async (request: any, reply) => {
      try {
        const conversationId = Number(request.params.id);
        const { adminId, userId } = request.body;

        const result = await chatService.setAdmin(
          Number(adminId),
          { conversationId, userId: Number(userId) }
        );

        return reply.send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    });

    fastify.put("/conversation/:id/ban", async (request: any, reply) => {
      try {
        const conversationId = Number(request.params.id);
        const { adminId, userId, ban } = request.body;

        const result = await chatService.banUser(
          Number(adminId),
          { conversationId, userId: Number(userId), ban }
        );

        return reply.send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    });

    fastify.get("/conversation/:id/messages", async (request: any, reply) => {
      try {
        const userId = Number(request.query.userId);
        const conversationId = Number(request.params.id);

        const messages = await chatService.getConversationMessages(
          userId,
          conversationId
        );

        return reply.status(200).send(messages);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    });
  };
}





