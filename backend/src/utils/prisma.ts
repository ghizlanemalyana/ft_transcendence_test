import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
const connectionString = "postgresql://transcendence_user:ghizlane4074.M@localhost:5432/transcendence_db";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;


//-> i have to change it later to

// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// export default prisma;

//  url      = env("DATABASE_URL")