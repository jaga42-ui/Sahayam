const mongoose = require('mongoose');

/**
 * Blast — an emergency SOS, modelled as a state machine driven by the
 * escalation engine. `status` is the source of truth; `active` and `pingLevel`
 * are kept as legacy mirrors so older queries/clients keep working.
 */
const blastSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  category: { type: String, default: 'blood' },
  bloodGroup: { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [lng, lat]
  },
  responses: [{
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'on-the-way' },
    respondedAt: { type: Date, default: Date.now }
  }],

  // ── State machine ──────────────────────────────────────────────
  status: {
    type: String,
    enum: ['broadcasting', 'escalating', 'matched', 'fulfilled', 'expired', 'cancelled'],
    default: 'broadcasting',
  },
  escalationLevel: { type: Number, default: 1 },
  radiusMeters: { type: Number, default: 5000 },
  nextEscalationAt: { type: Date },        // when the escalation cron should widen the search
  firstResponseAt: { type: Date },         // for time-to-first-response metrics
  matchedAt: { type: Date },
  fulfilledAt: { type: Date },

  // ── Legacy mirrors (kept for backward compatibility) ───────────
  active: { type: Boolean, default: true },
  pingLevel: { type: Number, default: 1 },
  pingedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Drive the escalation cron efficiently.
blastSchema.index({ status: 1, nextEscalationAt: 1 });
blastSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Blast', blastSchema);
