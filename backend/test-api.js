const assert = require("assert");
const Post = require("./models/Post");
const User = require("./models/User");

function runUnitTests() {
  console.log("Starting backend schema and logic validation tests...\n");

  let passed = 0;
  let failed = 0;

  function it(description, fn) {
    try {
      fn();
      console.log(`  PASS: ${description}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL: ${description}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // 1. Post Schema Validation
  it("Post model should have defined schema indexes", () => {
    assert(Post.schema, "Post model must have schema");
    assert(Post.schema.indexes().length > 0, "Post model must define indexes for pagination & search");
  });

  // 2. User Schema Validation
  it("User model should include profile customization fields and savedPosts array", () => {
    assert(User.schema.path("bio"), "User schema must have bio field");
    assert(User.schema.path("location"), "User schema must have location field");
    assert(User.schema.path("website"), "User schema must have website field");
    assert(User.schema.path("savedPosts"), "User schema must have savedPosts field");
  });

  // 3. Post Likes and Comments Structure
  it("Post schema should support like and comment subdocuments with user attribution", () => {
    const postInstance = new Post({
      author: "507f1f77bcf86cd799439011",
      authorName: "Test User",
      authorHandle: "testuser",
      authorAvatarColor: "#1b84ff",
      text: "Test content",
    });

    assert(Array.isArray(postInstance.likes), "likes must be an array");
    assert(Array.isArray(postInstance.comments), "comments must be an array");
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runUnitTests();
