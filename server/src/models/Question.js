import mongoose from 'mongoose';
export const TOPICS = ['Arrays','Strings','Hashing','Searching','Sorting','Two Pointers','Sliding Window','Recursion','Backtracking','Linked Lists','Stacks','Queues','Binary Search','Trees','Binary Search Trees','Heaps','Graphs','Greedy Algorithms','Dynamic Programming','Bit Manipulation'];
const testCase = new mongoose.Schema({ input: { type: String, default: '' }, expectedOutput: { type: String, required: true } }, { _id: false });
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  statement: { type: String, required: true },
  topic: { type: String, enum: TOPICS, required: true, index: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true, index: true },
  day: { type: Number, min: 1, max: 75, required: true, index: true },
  constraints: String, inputFormat: String, outputFormat: String,
  sampleInput: String, sampleOutput: String, explanation: String,
  starterCode: { javascript: String, python: String, c: String, cpp: String },
  sampleTests: { type: [testCase], default: [] },
  hiddenTests: { type: [testCase], default: [] },
  published: { type: Boolean, default: false, index: true },
}, { timestamps: true });
export default mongoose.model('Question', schema);
