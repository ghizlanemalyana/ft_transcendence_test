import { Server } from "socket.io";
import { FastifyInstance } from "fastify";

type ConnectedUser = {
  userId: number;
  socketId: string;
};

export class SocketServer {
  private io!: Server;
  private users = new Map<number, string>();

  init(fastify: FastifyInstance) {
    this.io = new Server(fastify.server, {
      cors: { origin: "*" },
    });

    this.io.on("connection", (socket) => {

      const userId = Number(socket.handshake.auth?.userId);

      if (!userId || Number.isNaN(userId)) {
        socket.disconnect();
        return;
      }

      this.users.set(userId, socket.id);
      console.log(`User ${userId} connected`);

      socket.on("disconnect", () => {
        this.users.delete(userId);
        console.log(`User ${userId} disconnected`);
      });
    });
  }

  getIO() {
    return this.io;
  }

  getSocketIdFromUserId(userId: number) {
    return this.users.get(userId);
  }
}
