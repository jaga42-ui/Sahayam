// This listens for the push event sent from your Node.js backend
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json(); // We will send a JSON object from the backend
    
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png', // The tiny icon in the Android status bar
      vibrate: [200, 100, 200, 100, 200, 100, 200], // A unique vibration pattern
      data: {
        url: data.url || '/' // Where to take the user when they click it
      }
    };

    // Paint the notification on the screen!
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// This listens for when the user taps/clicks the notification
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Clear the notification from the tray
  
  // Open the app to the correct URL (like a specific chat room)
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});