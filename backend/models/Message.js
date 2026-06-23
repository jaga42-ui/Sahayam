const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Null for a direct donor-to-donor chat (radar "message a donor"); set for a
  // donation/SOS-based conversation.
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', default: null },
  content: { type: String, required: true },
  
  // Advanced Features
  messageType: { 
    type: String, 
    enum: ["text", "image", "location_ping", "system_alert"], 
    default: "text" 
  },
  metadata: { type: mongoose.Schema.Types.Mixed },

  read: { type: Boolean, default: false }
}, { timestamps: true });

// 👉 THE SCALE FIX: Compound Index for the new MongoDB Chat Aggregation Pipeline
messageSchema.index({ donationId: 1, createdAt: -1 });

// 👉 Query optimizers for fetching inbox messages directly based on User IDs
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);