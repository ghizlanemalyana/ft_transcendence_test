import Fastify from "fastify";
import prisma from "./utils/prisma";
import { SocketServer } from "./realtime/socketServer";
import { ChatGateway } from "./chat/chatGateway";
import { ChatService } from "./chat/chatService";
import { chatController } from "./chat/chatController";

const fastify = Fastify({ logger: true });

const socketServer = new SocketServer();
socketServer.init(fastify);

const chatGateway = new ChatGateway(socketServer);
const chatService = new ChatService(prisma, chatGateway);

fastify.register(chatController(chatService));

const start = async () => {
  await fastify.listen({ port: 3001, host: "0.0.0.0" });
  console.log("Server running on http://localhost:3001");
};

start();
