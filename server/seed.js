import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "./models/User.js";
import Circle from "./models/Circle.js";
import Post from "./models/Post.js";
import Comment from "./models/Comment.js";
import Mood from "./models/Mood.js";
import Journal from "./models/Journal.js";
import Notification from "./models/Notification.js";

dotenv.config();

const MONGO = process.env.MONGO_URI;
if (!MONGO) {
  console.error("MONGO_URI not set in .env");
  process.exit(1);
}

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sample = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
};

const defaultPassword = "password123";

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const userProfiles = [
  { name: "Aisha Khan", username: "aisha", bio: "Post-grad studying cognitive science. Loves mindfulness and green tea.", interests: ["mindfulness","anxiety","study-tips"] },
  { name: "Ravi Patel", username: "ravi", bio: "Software dev & night-owl. I try to keep productive habits consistent.", interests: ["productivity","career","study-tips"] },
  { name: "Emily Chen", username: "emilyc", bio: "Journaler, runner, always trying new wellness routines.", interests: ["journaling","fitness","wellness"] },
  { name: "Leo Martins", username: "leo", bio: "Final-year student balancing projects and exam prep.", interests: ["exam-prep","productivity","motivation"] },
  { name: "Sara Gomez", username: "sara", bio: "Therapy advocate and study buddy seeker.", interests: ["anxiety","support","mindfulness"] },
  { name: "Olu Adebayo", username: "olu", bio: "Runner, grad student, coffee fanatic.", interests: ["fitness","productivity","wellness"] },
  { name: "Maya Singh", username: "maya", bio: "UX designer learning for exams and life.", interests: ["design","productivity","mindfulness"] },
  { name: "Tom Baker", username: "tom", bio: "Part-time tutor, full-time learner.", interests: ["study-tips","motivation","career"] },
  { name: "Lina Park", username: "lina", bio: "Meditation + slow mornings enthusiast.", interests: ["mindfulness","journaling","wellness"] },
  { name: "Carlos Ruiz", username: "carlos", bio: "Exam season survivor; here to share tips.", interests: ["exam-prep","study-tips","support"] },
  { name: "Nina Rossi", username: "nina", bio: "Career pivoter focusing on mental health.", interests: ["career","anxiety","wellness"] },
  { name: "Ethan Wood", username: "ethan", bio: "Organized chaos. Productivity experiments welcome.", interests: ["productivity","study-tips","motivation"] },
  { name: "Priya Shah", username: "priya", bio: "Daily journal keeper and tea brewer.", interests: ["journaling","mindfulness","wellness"] },
  { name: "Ahmed Farouk", username: "ahmed", bio: "Exam prep coach; sleep > cramming.", interests: ["exam-prep","productivity","study-tips"] },
  { name: "Zara Lee", username: "zara", bio: "Fitness & mindfulness balanced life.", interests: ["fitness","wellness","mindfulness"] },
];

const circleDefs = [
  { name: "Study Support", description: "A friendly place to share study plans, resources and accountability.", tags: ["study-tips","accountability"] },
  { name: "Productivity Club", description: "Share productivity systems, hacks and morning routines.", tags: ["productivity","habits"] },
  { name: "Mindfulness Hub", description: "Resources and short practices for staying present.", tags: ["mindfulness","meditation"] },
  { name: "Anxiety Support Circle", description: "Peer support for anxiety and coping strategies.", tags: ["anxiety","support"] },
  { name: "Fitness & Wellness", description: "Workouts, nutrition tips and wellness check-ins.", tags: ["fitness","wellness"] },
  { name: "Daily Journaling", description: "Share prompts, excerpts and journaling challenges.", tags: ["journaling","reflection"] },
  { name: "Career Guidance", description: "CV tips, interview practice and mentorship.", tags: ["career","mentorship"] },
  { name: "Exam Stress Relief", description: "Calm strategies and realistic study schedules for exams.", tags: ["exam-prep","stress-management"] },
];

const postTopics = [
  "study habits",
  "productivity",
  "stress management",
  "mindfulness",
  "motivation",
  "wellness",
];

const lorem = (seed, sentences = 3) => {
  const base = [
    "I found breaking study sessions into 25-minute sprints made a huge difference.",
    "Today I tried a breathing exercise before studying and my focus improved.",
    "Consistency beats intensity when it comes to building habits.",
    "I struggle with motivation — small rewards help me start tasks.",
    "Going for a short run clears my head and boosts energy for evening study.",
    "Setting realistic goals for the day reduces anxiety around exams.",
    "Journaling each night has helped me notice patterns in my mood.",
    "Pairing study with active recall has improved retention significantly.",
    "Mindfulness practice helps me manage intrusive thoughts during work.",
    "A quick stretch break each hour prevents burnout and keeps me productive.",
  ];
  const out = [];
  for (let i = 0; i < sentences; i++) out.push(base[(seed + i) % base.length]);
  return out.join(" ");
};

async function main() {
  await mongoose.connect(MONGO);
  console.log("Connected to Mongo for seeding");

  // Append-only seeding: DO NOT DELETE or DROP existing data.
  // We'll create demo users/circles/posts only if they do not already exist.
  const users = [];
  let createdUsers = 0;
  let skippedUsers = 0;
  for (let i = 0; i < userProfiles.length; i++) {
    const p = userProfiles[i];
    // Use demo-prefixed username/email to avoid colliding with real users
    const demoUsername = `demo_user_${i + 1}`;
    const email = `${demoUsername}@example.com`;

    let existingUser = await User.findOne({ username: demoUsername });
    if (existingUser) {
      users.push(existingUser);
      skippedUsers++;
      continue;
    }

    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&rounded=true`;

    const u = new User({
      username: demoUsername,
      email,
      password: passwordHash,
      displayName: p.name,
      bio: p.bio,
      interests: p.interests,
      profilePicture,
      authProvider: "local",
    });
    await u.save();
    users.push(u);
    createdUsers++;
  }
  console.log(`Users: created=${createdUsers} skipped=${skippedUsers}`);
  const userById = new Map(users.map((user) => [String(user._id), user]));

  // Create demo circles (idempotent)
  const circles = [];
  let createdCircles = 0;
  let skippedCircles = 0;
  for (let i = 0; i < circleDefs.length; i++) {
    const def = circleDefs[i];
    // demo prefix for circle names
    const demoCircleName = `demo_${def.name.toLowerCase().replace(/\s+/g, "_")}`;

    let existingCircle = await Circle.findOne({ name: demoCircleName });
    if (existingCircle) {
      circles.push(existingCircle);
      skippedCircles++;
      continue;
    }

    const creator = rand(users);
    const members = sample(users, 6 + Math.floor(Math.random() * 6)).map(u => u._id);
    if (!members.map(m => m.toString()).includes(creator._id.toString())) members.push(creator._id);
    const admins = [creator._id];

    const c = new Circle({
      name: demoCircleName,
      description: def.description,
      tags: def.tags,
      creator: creator._id,
      admins,
      members,
      visibility: "public",
    });
    await c.save();
    circles.push(c);
    createdCircles++;
  }
  console.log(`Circles: created=${createdCircles} skipped=${skippedCircles}`);

  // Create demo posts (idempotent)
  const posts = [];
  let createdPosts = 0;
  let skippedPosts = 0;
  const totalPosts = 50; // requirement: 50 demo posts
  for (let i = 0; i < totalPosts; i++) {
    const circle = rand(circles);
    const author = rand(users);
    const topic = rand(postTopics);
    // demo-prefixed title ensures idempotency
    const title = `demo_post_${i + 1} - ${topic}`;
    const content = lorem(i, 3 + Math.floor(Math.random() * 3));

    const existingPost = await Post.findOne({ title });
    if (existingPost) {
      posts.push(existingPost);
      skippedPosts++;
      continue;
    }

    const p = new Post({ title, content, author: author._id, circle: circle._id });
    await p.save();
    posts.push(p);
    createdPosts++;

    // Notify a small sample of circle members about new post (idempotent by message+user)
    const audience = sample(circle.members.map(m => m.toString() !== author._id.toString() ? m : null).filter(Boolean), Math.min(4, circle.members.length - 1));
    for (const uid of audience) {
      const message = `${author.displayName || author.username} posted in ${circle.name}: ${title}`;
      const exists = await Notification.findOne({ user: uid, message });
      if (!exists) {
        const n = new Notification({ user: uid, type: "post", message, link: `/circles/${circle._id}` });
        await n.save();
      }
    }
  }
  console.log(`Posts: created=${createdPosts} skipped=${skippedPosts}`);

  // Create comments (idempotent)
  const comments = [];
  let createdComments = 0;
  let skippedComments = 0;
  for (const post of posts) {
    const count = 3 + Math.floor(Math.random() * 3); // 3-5 comments
    for (let j = 0; j < count; j++) {
      const author = rand(users);
      const content = `demo_comment_${post._id}_${j + 1}: ` + lorem(j + post._id.toString().length, 1 + Math.floor(Math.random() * 2));

      const exists = await Comment.findOne({ content, author: author._id, post: post._id });
      if (exists) {
        skippedComments++;
        comments.push(exists);
        continue;
      }

      const cm = new Comment({ content, author: author._id, post: post._id });
      await cm.save();
      comments.push(cm);
      createdComments++;

      // Notify post author about comment (idempotent by message+user)
      const postAuthor = userById.get(String(post.author));
      if (postAuthor && String(postAuthor._id) !== String(author._id)) {
        const message = `${author.displayName || author.username} commented on your post: ${post.title}`;
        const nexists = await Notification.findOne({ user: postAuthor._id, message });
        if (!nexists) {
          const n = new Notification({ user: postAuthor._id, type: 'comment', message, link: `/circles/${post.circle}` });
          await n.save();
        }
      }
    }
  }
  console.log(`Comments: created=${createdComments} skipped=${skippedComments}`);

  // Create 30 days of moods per demo user (idempotent)
  const moods = [];
  let createdMoods = 0;
  let skippedMoods = 0;
  for (const u of users) {
    for (let d = 0; d < 30; d++) {
      const date = daysAgo(d);
      // Weighted mood
      const r = Math.random();
      const moodVal = r < 0.55 ? 'neutral' : r < 0.85 ? 'good' : 'bad';
      const exists = await Mood.findOne({ user: u._id, date });
      if (exists) {
        skippedMoods++;
        continue;
      }
      const entry = new Mood({ user: u._id, mood: moodVal, visibility: 'private', date, isUpdated: false });
      await entry.save();
      moods.push(entry);
      createdMoods++;
    }
  }
  console.log(`Moods: created=${createdMoods} skipped=${skippedMoods}`);

  // Create journals per demo user (idempotent)
  const journals = [];
  let createdJournals = 0;
  let skippedJournals = 0;
  for (const u of users) {
    const count = 5 + Math.floor(Math.random() * 6);
    for (let k = 0; k < count; k++) {
      const title = `demo_journal_${u.username}_${k + 1}`;
      const body = lorem(k + u._id.toString().length, 3 + Math.floor(Math.random() * 3));
      const date = daysAgo(10 + Math.floor(Math.random() * 120));
      const visibility = Math.random() < 0.8 ? 'private' : 'circles';
      const sharedCircles = visibility === 'circles' ? sample(circles, 1 + Math.floor(Math.random() * 2)).map(c => c._id) : [];

      const exists = await Journal.findOne({ user: u._id, title });
      if (exists) {
        skippedJournals++;
        journals.push(exists);
        continue;
      }

      const j = new Journal({ user: u._id, title, body, date, visibility, sharedCircles });
      await j.save();
      journals.push(j);
      createdJournals++;
    }
  }
  console.log(`Journals: created=${createdJournals} skipped=${skippedJournals}`);

  // Create sample notifications: join requests and approvals (idempotent)
  let createdNotifications = 0;
  let skippedNotifications = 0;
  for (const c of circles) {
    const requester = rand(users);
    // Add a demo join request record to circle.joinRequests only if not already present
    if (!c.joinRequests) c.joinRequests = [];
    if (!c.joinRequests.map(x => x.toString()).includes(requester._id.toString())) {
      // append demo marker to join request array (safe append)
      c.joinRequests.push(requester._id);
      try {
        await c.save();
      } catch (e) {
        // ignore save errors
      }
    }

    const msg1 = `${requester.displayName || requester.username} requested to join ${c.name}`;
    const exists1 = await Notification.findOne({ user: c.creator, message: msg1 });
    if (!exists1) {
      const n = new Notification({ user: c.creator, type: 'circle', message: msg1, link: `/circles/${c._id}` });
      await n.save();
      createdNotifications++;
    } else skippedNotifications++;

    // simulate approval for a random subset (create notification only, do not modify members if they already exist)
    if (Math.random() < 0.6) {
      const msg2 = `Your request to join ${c.name} was approved`;
      const exists2 = await Notification.findOne({ user: requester._id, message: msg2 });
      if (!exists2) {
        const n2 = new Notification({ user: requester._id, type: 'circle', message: msg2, link: `/circles/${c._id}` });
        await n2.save();
        createdNotifications++;
      } else skippedNotifications++;
    }
  }

  console.log(`Notifications: created=${createdNotifications} skipped=${skippedNotifications}`);

  // Summary
  console.log('Seeding summary:');
  console.log(`  Users created: ${createdUsers}, skipped: ${skippedUsers}`);
  console.log(`  Circles created: ${createdCircles}, skipped: ${skippedCircles}`);
  console.log(`  Posts created: ${createdPosts}, skipped: ${skippedPosts}`);
  console.log(`  Comments created: ${createdComments}, skipped: ${skippedComments}`);
  console.log(`  Journals created: ${createdJournals}, skipped: ${skippedJournals}`);
  console.log(`  Moods created: ${createdMoods}, skipped: ${skippedMoods}`);
  console.log(`  Notifications created: ${createdNotifications}, skipped: ${skippedNotifications}`);

  console.log('Seeding complete.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed error', err);
  process.exit(1);
});
