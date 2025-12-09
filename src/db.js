require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

// Create a pg Pool using the same DATABASE_URL as Prisma
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Pass adapter into PrismaClient (required in Prisma 7)
const prisma = new PrismaClient({
  adapter,
});

module.exports = prisma;
