const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const User = require('../models/User');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
      });
    }
  } catch (error) { console.log('Firebase setup failed:', error.message); }
}

const createEvent = asyncHandler(async (req, res) => {
  const { title, description, category, eventDate, startTime, endTime, locationText, lat, lng } = req.body;
  let imageUrl = req.file ? req.file.path : ''; 

  if (!title || !description || !eventDate || !locationText || !lat || !lng) {
    res.status(400); throw new Error('Please fill all required event fields and provide GPS coordinates');
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  const event = await Event.create({
    organizationId: req.user._id,
    title, description, category, eventDate, startTime, endTime, locationText, image: imageUrl,
    location: { type: 'Point', coordinates: [parsedLng, parsedLat] }
  });

  try {
    const nearbyUsers = await User.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parsedLng, parsedLat] },
          $maxDistance: 10000 
        }
      },
      _id: { $ne: req.user._id }, 
      fcmToken: { $exists: true, $ne: null }
    }).limit(1000); // 👉 THE FIX: Max 1000 notifications to prevent queue locks

    const tokens = nearbyUsers.map(u => u.fcmToken);

    if (tokens.length > 0) {
      const message = {
        notification: {
          title: `📢 Local Event: ${title}`,
          body: `Happening near you on ${new Date(eventDate).toLocaleDateString()}. Open Sahayam to view details.`,
        },
        tokens: tokens,
      };

      admin.messaging().sendEachForMulticast(message)
        .then(response => console.log(`📢 Event Blast sent to ${response.successCount} nearby users.`))
        .catch(err => console.error('Firebase Event Push Error', err));
    }
  } catch (pushError) {
    console.error('Failed to process event push notifications', pushError);
  }

  await event.populate('organizationId', 'name profilePic');
  res.status(201).json(event);
});

const getEvents = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let query = { eventDate: { $gte: today } };

  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: 10000 
      }
    };
  }

  // 👉 THE FIX: Limit public feed so map loading remains instant
  const events = await Event.find(query)
    .populate('organizationId', 'name profilePic')
    .limit(100); 

  res.json(events);
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) { res.status(404); throw new Error('Event not found'); }
  if (event.organizationId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(401); throw new Error('Not authorized to delete this event');
  }

  await event.deleteOne();
  res.json({ id: req.params.id });
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) { res.status(404); throw new Error('Event not found'); }
  
  if (event.organizationId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(401); throw new Error('Not authorized to edit this event');
  }

  const { title, description, category, eventDate, startTime, endTime, locationText, lat, lng } = req.body;
  let imageUrl = req.file ? req.file.path : event.image; 

  event.title = title || event.title;
  event.description = description || event.description;
  event.category = category || event.category;
  event.eventDate = eventDate || event.eventDate;
  event.startTime = startTime || event.startTime;
  event.endTime = endTime || event.endTime;
  event.locationText = locationText || event.locationText;
  event.image = imageUrl;

  if (lat && lng) {
    event.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
  }

  const updatedEvent = await event.save();
  await updatedEvent.populate('organizationId', 'name profilePic');
  res.json(updatedEvent);
});

module.exports = { createEvent, getEvents, deleteEvent, updateEvent };