import dns from 'node:dns';
import mongoose from 'mongoose';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGO_URI = process.env.MONGO_URI as string;

export async function connectDb(): Promise<void> {
  await mongoose.connect(MONGO_URI, { family: 4 });
  console.log('Connected to MongoDB');
}
