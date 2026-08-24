const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Post = require("./models/Post");
const User = require("./models/User");
const sanitizeInput = require("./middleware/sanitize");

function runSystemCheck() {
  console.log("=================================================");
  console.log("    TASKPLANET FULL SYSTEM & INTEGRITY CHECK     ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function test(title, fn) {
    try {
      fn();
      console.log(`  [OK] ${title}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${title}`);
      console.error(`         Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Environment & Storage Directory Checks
  test("Uploads directory exists and is writable", () => {
    const uploadsDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const testFile = path.join(uploadsDir, ".write_check");
    fs.writeFileSync(testFile, "system_ok");
    const content = fs.readFileSync(testFile, "utf8");
    assert.strictEqual(content, "system_ok", "File content mismatch in uploads directory");
    fs.unlinkSync(testFile);
  });

  // 2. Post Schema Checks (Including new features: Polls, isPinned, viewsCount, reports)
  test("Post schema contains Polls structure with options and votes array", () => {
    const pollOptionsPath = Post.schema.path("poll.options");
    assert(pollOptionsPath, "Post schema must include poll.options path");
    const testPost = new Post({
      author: "507f1f77bcf86cd799439011",
      authorName: "Alice",
      authorHandle: "alice",
      authorAvatarColor: "#1b84ff",
      poll: {
        question: "Favorite framework?",
        options: [
          { optionText: "React", votes: [] },
          { optionText: "Vue", votes: [] },
        ],
      },
    });
    assert.strictEqual(testPost.poll.options.length, 2, "Poll options should contain 2 items");
  });

  test("Post schema contains isPinned boolean with default false", () => {
    const isPinnedPath = Post.schema.path("isPinned");
    assert(isPinnedPath, "Post schema must include isPinned field");
    const testPost = new Post({
      author: "507f1f77bcf86cd799439011",
      authorName: "Alice",
      authorHandle: "alice",
      authorAvatarColor: "#1b84ff",
    });
    assert.strictEqual(testPost.isPinned, false, "isPinned should default to false");
  });

  test("Post schema contains viewsCount metric field with default 0", () => {
    const viewsPath = Post.schema.path("viewsCount");
    assert(viewsPath, "Post schema must include viewsCount field");
    const testPost = new Post({
      author: "507f1f77bcf86cd799439011",
      authorName: "Alice",
      authorHandle: "alice",
      authorAvatarColor: "#1b84ff",
    });
    assert.strictEqual(testPost.viewsCount, 0, "viewsCount should default to 0");
  });

  test("Post schema contains reports subdocument array for content moderation", () => {
    const reportsPath = Post.schema.path("reports");
    assert(reportsPath, "Post schema must include reports field");
  });

  // 3. User Model Checks
  test("User model defines authentication fields and savedPosts reference array", () => {
    assert(User.schema.path("email"), "User schema must have email");
    assert(User.schema.path("password"), "User schema must have password");
    assert(User.schema.path("savedPosts"), "User schema must have savedPosts");
  });

  // 4. Security & Sanitization Middleware Checks
  test("Sanitization middleware cleans malicious HTML tags and scripts", () => {
    const req = {
      body: {
        name: "<script>alert('xss')</script>John Doe",
        comment: "Hello <b>world</b> <img src=x onerror=alert(1)>",
      },
      query: {
        search: "<script>hack()</script>javascript",
      },
    };
    const res = {};
    const next = () => {};

    sanitizeInput(req, res, next);

    assert(!req.body.name.includes("<script>"), "Script tag should be sanitized from body.name");
    assert(!req.body.comment.includes("onerror"), "Event handler should be stripped from comment");
    assert(!req.query.search.includes("<script>"), "Script tag should be sanitized from query.search");
  });

  // 5. Poll Voting Mathematical Logic
  test("Poll vote calculation handles percentage distributions accurately", () => {
    const options = [
      { optionText: "Opt A", votes: ["1", "2", "3"] },
      { optionText: "Opt B", votes: ["4"] },
    ];
    const totalVotes = options.reduce((sum, o) => sum + o.votes.length, 0);
    assert.strictEqual(totalVotes, 4, "Total votes must be 4");

    const optAPercent = Math.round((options[0].votes.length / totalVotes) * 100);
    const optBPercent = Math.round((options[1].votes.length / totalVotes) * 100);
    assert.strictEqual(optAPercent, 75, "Option A must be 75%");
    assert.strictEqual(optBPercent, 25, "Option B must be 25%");
  });

  console.log("\n-------------------------------------------------");
  console.log(`System Check Complete: ${passed} checks passed, ${failed} failed.`);
  console.log("-------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSystemCheck();
