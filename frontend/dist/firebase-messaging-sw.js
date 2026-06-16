importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 👉 INJECTED YOUR ACTUAL FIREBASE KEYS
const firebaseConfig = {
  apiKey: "AIzaSyD4B7cjaeF2IfdYTBO9O_EdWpZW-yRL8Ic",
  authDomain: "hopelink-57e20.firebaseapp.com",
  projectId: "hopelink-57e20",
  storageBucket: "hopelink-57e20.firebasestorage.app",
  messagingSenderId: "304854115504",
  appId: "1:304854115504:web:a670a1824eaa359f4b8775",
  measurementId: "G-9D0THCJLHP"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 1. WAKES UP THE PHONE WHEN APP IS CLOSED
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || "Sahayam Alert";
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png', // Ensure you have logo.png in your public folder
    badge: '/logo.png',
    vibrate: [200, 100, 200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 2. TELEPORTS USER TO INBOX WHEN THEY TAP THE NOTIFICATION
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Closes the notification on the phone
  
  // Dynamically grabs your base URL and adds /chat/inbox
  const targetUrl = self.location.origin + '/chat/inbox';
  
  event.waitUntil(
    clients.openWindow(targetUrl)
  );
});