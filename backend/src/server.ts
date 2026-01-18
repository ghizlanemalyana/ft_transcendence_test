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



