/**
 * Spin up an in-memory MongoDB for integration tests. Real Mongo semantics
 * (geoNear, conditional findOneAndUpdate atomicity, indexes) — no external
 * services, nothing written to a real database.
 */
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongod;

async function connect() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Build declared indexes (notably the 2dsphere geo indexes) so $geoNear works.
  await Promise.all(Object.values(mongoose.connection.models).map((m) => m.init()));
}

async function clearDatabase() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
}

module.exports = { connect, clearDatabase, closeDatabase };
