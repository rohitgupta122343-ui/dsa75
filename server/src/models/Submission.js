import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  language: { type: String, enum: ['javascript', 'python', 'c', 'cpp'], required: true },
  code: { type: String, required: true, maxlength: 65536 },
  verdict: { type: String, required: true, enum: ['accepted','wrong_answer','compilation_error','runtime_error','time_limit_exceeded','memory_limit_exceeded','internal_error'] },
  passed: Number, total: Number, timeMs: Number, memoryKb: Number,
  stderr: String, compileOutput: String,
  dayKey: { type: String, required: true }, // YYYY-MM-DD in challenge timezone, fixed at creation
}, { timestamps: true });
schema.index({ user: 1, createdAt: -1 });
schema.index({ user: 1, question: 1, createdAt: -1 });
schema.index({ user: 1, dayKey: 1 });
export default mongoose.model('Submission', schema);
