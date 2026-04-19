import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema({
  first_name: { type: String, required: true },
  last_name:  { type: String, required: true },
  age:        { type: Number, required: true },
  created_at: { type: Number, default: () => Math.floor(Date.now() / 1000) },
  updated_at: { type: Number, default: () => Math.floor(Date.now() / 1000) },
});

export type IUser = InferSchemaType<typeof userSchema>;

export const User = model('User', userSchema);
