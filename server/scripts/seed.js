
import mongoose from 'mongoose';
import { config } from '../src/config.js';
import Question from '../src/models/Question.js';
import Challenge from '../src/models/Challenge.js';

const T = (input, expectedOutput) => ({ input, expectedOutput });

const questions = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    day: 1,
    topic: 'Hashing',
    difficulty: 'Easy',
    published: true,
    statement: 'Given an array of integers and a target, print the indices (0-based, smaller first) of the two numbers that add up to the target. Exactly one valid pair exists.',
    constraints: '2 <= n <= 10^5; -10^9 <= a[i] <= 10^9',
    inputFormat: 'Line 1: n. Line 2: n integers. Line 3: target.',
    outputFormat: 'Two space-separated indices, smaller first.',
    sampleInput: '4\n2 7 11 15\n9',
    sampleOutput: '0 1',
    explanation: 'a[0] + a[1] = 9.',
    starterCode: {
      javascript: "const lines = require('fs').readFileSync(0, 'utf8').split(/\\s+/).map(Number);\nconst n = lines[0];\nconst a = lines.slice(1, n + 1);\nconst target = lines[n + 1];\n// TODO: print the two indices\n",
      python: "n = int(input())\na = list(map(int, input().split()))\ntarget = int(input())\n# TODO: print the two indices\n",
      c: "#include <stdio.h>\n\nint main() {\n    int n, target;\n    scanf(\"%d\", &n);\n    static int a[100000];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &a[i]);\n    scanf(\"%d\", &target);\n    // TODO: print the two indices\n    return 0;\n}\n",
      cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n, target;\n    cin >> n;\n    vector<int> a(n);\n    for (auto &x : a) cin >> x;\n    cin >> target;\n    // TODO: print the two indices\n    return 0;\n}\n"
    },
    sampleTests: [
      T('4\n2 7 11 15\n9\n', '0 1'),
      T('3\n3 2 4\n6\n', '1 2')
    ],
    hiddenTests: [
      T('2\n3 3\n6\n', '0 1'),
      T('5\n-1 -2 -3 -4 -5\n-8\n', '2 4'),
      T('6\n1 5 9 14 20 3\n17\n', '3 5')
    ]
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    day: 2,
    topic: 'Stacks',
    difficulty: 'Easy',
    published: true,
    statement: 'Given a string made only of ()[]{} characters, print "true" if every bracket is closed in the correct order, otherwise "false".',
    constraints: '1 <= length <= 10^4',
    inputFormat: 'A single line containing the string.',
    outputFormat: 'true or false',
    sampleInput: '()[]{}',
    sampleOutput: 'true',
    explanation: 'Every opener is closed by the matching closer in order.',
    starterCode: {
      javascript: "const s = require('fs').readFileSync(0, 'utf8').trim();\n// TODO: print true or false\n",
      python: "s = input().strip()\n# TODO: print true or false\n",
      c: "#include <stdio.h>\n\nint main() {\n    static char s[10005];\n    scanf(\"%10000s\", s);\n    // TODO: print true or false\n    return 0;\n}\n",
      cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    // TODO: print true or false\n    return 0;\n}\n"
    },
    sampleTests: [
      T('()[]{}\n', 'true'),
      T('(]\n', 'false')
    ],
    hiddenTests: [
      T('([)]\n', 'false'),
      T('{[]}\n', 'true'),
      T('(((\n', 'false'),
      T(']\n', 'false')
    ]
  }
];

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB.');

  // Create the main 75-day challenge if it does not exist.
  await Challenge.updateOne(
    { key: 'main' },
    {
      $setOnInsert: {
        key: 'main',
        startDate: new Date().toISOString().slice(0, 10),
        timezone: 'Asia/Kolkata',
        totalDays: 75
      }
    },
    { upsert: true }
  );

  console.log('Main challenge initialized.');

  // Ensure indexes exist before seeding questions.
  await Question.init();

  for (const q of questions) {
    await Question.updateOne(
      { slug: q.slug },
      { $set: q },
      { upsert: true }
    );
  }

  console.log(`Seeded ${questions.length} questions.`);
}

main()
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
