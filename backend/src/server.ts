import Fastify from 'fastify';
import prisma from './utils/prisma';

const fastify = Fastify({ logger: true });

fastify.get('/', async () => {
  return { message: 'Backend is working ✅' };
});

fastify.get('/db-test', async () => {
  const result = await prisma.$queryRaw`SELECT 1`;
  return {
    message: 'Database connected ✅',
    result,
  };
});
fastify.get('/add-message', async () => {
  const newMessage = await prisma.message.create({
    data: {
      content: "Hello from the debug session!",
      sender: {
        create: { username: "Tester", email: "test@test.com" }
      },
      conversation: {
        create: { name: "Debug Chat" }
      }
    }
  });
  return { message: 'Message added to DB! ✅', data: newMessage };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();



