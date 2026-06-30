/**
 * Location update — a donor's saved location must be real. Reject the [0,0]
 * Null Island default and garbage coordinates (which would make the donor
 * unreachable by $geoNear matching), and accept genuine coordinates.
 */
const { connect, clearDatabase, closeDatabase } = require("./helpers/memoryDb");
const User = require("../models/User");
const { updateLocation } = require("../controllers/authController");

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

let seq = 0;
async function makeDonor() {
  seq += 1;
  return User.create({
    name: "Donor",
    email: `donor${seq}@test.local`,
    password: "Secret123!",
    phone: `+9198765432${(10 + seq).toString().slice(-2)}`,
    activeRole: "donor",
  });
}

function callUpdate(body, userId) {
  return new Promise((resolve) => {
    let statusCode = 200;
    const req = { body, user: { _id: userId } };
    const res = {
      status(c) { statusCode = c; return this; },
      json(d) { resolve({ statusCode, data: d }); },
    };
    updateLocation(req, res, (err) => resolve({ statusCode, error: err }));
  });
}

test("rejects the [0,0] Null Island default", async () => {
  const u = await makeDonor();
  const { statusCode, error } = await callUpdate({ lat: 0, lng: 0 }, u._id);
  expect(statusCode).toBe(400);
  expect(error.message).toMatch(/valid location/i);
});

test("rejects missing / garbage coordinates", async () => {
  const u = await makeDonor();
  const { statusCode } = await callUpdate({ lat: "abc", lng: undefined }, u._id);
  expect(statusCode).toBe(400);
});

test("accepts real coordinates, saves them, and reports hasLocation", async () => {
  const u = await makeDonor();
  const { statusCode, data } = await callUpdate({ lat: 12.97, lng: 77.59, addressText: "Bengaluru" }, u._id);
  expect(statusCode).toBe(200);
  expect(data.hasLocation).toBe(true);
  const saved = await User.findById(u._id);
  expect(saved.location.coordinates).toEqual([77.59, 12.97]);
});
