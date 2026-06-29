/**
 * SOS validation gate — an emergency listing fans out push + email to real
 * donors, so createDonation must reject garbage *before* broadcasting. It needs
 * a valid blood group and a genuinely pinned location, not the [0,0] Null
 * Island default that a missing GPS pin silently falls back to.
 */
jest.mock("../services/donorMatching", () => ({
  findEligibleDonors: jest.fn().mockResolvedValue([]),
  findCompatibleDonors: jest.fn().mockResolvedValue([]),
}));
jest.mock("../utils/notify", () => ({
  notifyDonors: jest.fn().mockResolvedValue({ push: 0, email: 0 }),
}));

const mongoose = require("mongoose");
const { connect, clearDatabase, closeDatabase } = require("./helpers/memoryDb");
const Donation = require("../models/Donation");
const { createDonation } = require("../controllers/donationController");

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

const user = { _id: new mongoose.Types.ObjectId(), activeRole: "receiver" };

// Drive the express-async-handler controller, capturing the status code and
// either the JSON body or the error handed to next().
function submitSOS(body) {
  return new Promise((resolve) => {
    let statusCode = 200;
    const req = { body, user, file: null, app: { get: () => ({ emit: () => {} }) } };
    const res = {
      status(code) { statusCode = code; return this; },
      json(data) { resolve({ statusCode, data }); },
    };
    createDonation(req, res, (err) => resolve({ statusCode, error: err }));
  });
}

const wellFormed = {
  listingType: "request",
  isEmergency: "true",
  bloodGroup: "O+",
  quantity: "2 Units",
  title: "URGENT: O+ Needed!",
  description: "Accident case, needs blood urgently",
  addressText: "City Hospital, Bengaluru",
  lat: "12.9716",
  lng: "77.5946",
};

test("rejects an emergency with no pinned location instead of broadcasting", async () => {
  const { statusCode, error } = await submitSOS({ ...wellFormed, lat: undefined, lng: undefined });
  expect(statusCode).toBe(400);
  expect(error.message).toMatch(/pinned location/i);
  expect(await Donation.countDocuments()).toBe(0);
});

test("rejects the [0,0] Null Island fallback", async () => {
  const { statusCode, error } = await submitSOS({ ...wellFormed, lat: "0", lng: "0" });
  expect(statusCode).toBe(400);
  expect(error.message).toMatch(/pinned location/i);
});

test("rejects an invalid / missing blood group", async () => {
  const { statusCode, error } = await submitSOS({ ...wellFormed, bloodGroup: "" });
  expect(statusCode).toBe(400);
  expect(error.message).toMatch(/blood group/i);
});

test("accepts a well-formed emergency and creates it", async () => {
  const { statusCode, data } = await submitSOS(wellFormed);
  expect(statusCode).toBe(201);
  expect(data).toBeTruthy();
  expect(await Donation.countDocuments({ isEmergency: true })).toBe(1);
});
