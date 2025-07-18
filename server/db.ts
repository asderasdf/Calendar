import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';
import 'dotenv/config';
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to provision a database?'
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL,
    ssl: {
    rejectUnauthorized: false, // مهم لـ Neon 
  },
 });
export const db = drizzle(pool, { schema });
