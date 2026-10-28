import mongoose from 'mongoose';
import { config } from './config.js';
import { createApp } from './app.js';

await mongoose.connect(config.mongoUri);
await Promise.all(Object.values(mongoose.models).map((m) => m.init())); // build unique indexes
createApp().listen(config.port, () => console.log(`API listening on :${config.port}`));
