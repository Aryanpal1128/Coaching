import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import { Badge } from '../models/Badge.js';
import { Question } from '../models/Question.js';
import { Answer } from '../models/Answer.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { TeacherProfile } from '../models/TeacherProfile.js';
import { evaluateAnswerWithAI } from '../services/aiEvaluation.service.js';
import { calculateAnswerRankingScore } from '../services/ranking.service.js';
import logger from '../config/logger.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding...');

    await User.deleteMany({});
    await Subject.deleteMany({});
    await Badge.deleteMany({});
    await Question.deleteMany({});
    await Answer.deleteMany({});
    await StudentProfile.deleteMany({});
    await TeacherProfile.deleteMany({});

    logger.info('Database cleared.');

    // 1. Create Subjects
    const math = await Subject.create({ name: 'Mathematics', code: 'MATH101', description: 'Algebra, Calculus, and Geometry' });
    const physics = await Subject.create({ name: 'Physics', code: 'PHYS101', description: 'Mechanics, Quantum Physics, and Optics' });
    const cs = await Subject.create({ name: 'Computer Science', code: 'CS101', description: 'Data Structures, Algorithms, and Web Systems' });

    // 2. Create Badges
    await Badge.create([
      { name: '🌱 Beginner', description: 'Earned at 0 points', icon: '🌱', minReputation: 0, category: 'REPUTATION' },
      { name: '📘 Learner', description: 'Earned at 101 points', icon: '📘', minReputation: 101, category: 'REPUTATION' },
      { name: '⚡ Contributor', description: 'Earned at 301 points', icon: '⚡', minReputation: 301, category: 'REPUTATION' },
      { name: '🔥 Expert', description: 'Earned at 701 points', icon: '🔥', minReputation: 701, category: 'REPUTATION' },
      { name: '👑 Master', description: 'Earned at 1501 points', icon: '👑', minReputation: 1501, category: 'REPUTATION' }
    ]);

    // 3. Create Admin User
    const admin = await User.create({
      name: 'System Admin',
      username: 'admin',
      email: 'admin@ailearning.com',
      password: 'adminPassword123',
      role: 'ADMIN',
      isVerified: true
    });

    // 4. Create Teacher User
    const teacher = await User.create({
      name: 'Prof. Alan Turing',
      username: 'alanturing',
      email: 'teacher@ailearning.com',
      password: 'teacherPassword123',
      role: 'TEACHER',
      isVerified: true,
      reputation: 850,
      level: 'Expert',
      badge: '🔥 Expert'
    });
    await TeacherProfile.create({ user: teacher._id, title: 'Professor of Computer Science', subjectsTaught: [cs._id] });

    // 5. Create Student User
    const student = await User.create({
      name: 'Ada Lovelace',
      username: 'adalovelace',
      email: 'student@ailearning.com',
      password: 'studentPassword123',
      role: 'STUDENT',
      isVerified: true,
      reputation: 350,
      level: 'Contributor',
      badge: '⚡ Contributor'
    });
    await StudentProfile.create({ user: student._id, subjectsOfInterest: [cs._id, math._id] });

    // 6. Create Question
    const question = await Question.create({
      title: 'What is the difference between BFS and DFS in Graph Traversal?',
      description: 'Can someone explain when to use Breadth-First Search vs Depth-First Search with time complexities?',
      tags: ['graph', 'algorithms', 'dfs', 'bfs'],
      subject: cs._id,
      difficulty: 'Medium',
      askedBy: student._id
    });

    // 7. Create Answer
    const answerText = 'Breadth-First Search (BFS) explores the graph layer by layer using a Queue (FIFO), which is ideal for finding the shortest path in unweighted graphs. Depth-First Search (DFS) explores as deep as possible using a Stack (LIFO or recursion), which is best for topological sorting and cycle detection. Both run in O(V + E) time complexity.';
    const answer = await Answer.create({
      question: question._id,
      author: teacher._id,
      answerText,
      timeTakenSeconds: 180,
      isTeacherEndorsed: true,
      endorsedByTeacher: teacher._id
    });

    const aiEval = await evaluateAnswerWithAI(question.title, question.description, answerText);
    answer.aiAccuracyScore = aiEval.accuracyScore;
    answer.aiEvaluation = aiEval;
    await answer.save();

    await calculateAnswerRankingScore(answer._id);

    logger.info('Database seeded successfully with sample Admin, Teacher, Student, Question, and AI Evaluated Answer!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding error: ' + error.message);
    process.exit(1);
  }
};

seedDatabase();
