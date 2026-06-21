import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyD4B7cjaeF2IfdYTBO9O_EdWpZW-yRL8Ic",
  authDomain: "hopelink-57e20.firebaseapp.com",
  projectId: "hopelink-57e20",
  storageBucket: "hopelink-57e20.firebasestorage.app",
  messagingSenderId: "304854115504",
  appId: "1:304854115504:web:a670a1824eaa359f4b8775",
  measurementId: "G-9D0THCJLHP"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestFirebaseToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      
      // Register the FCM worker at its OWN dedicated scope, not "/". The PWA's
      // workbox service worker owns "/", and a scope can hold only one worker —
      // registering FCM at "/" let workbox clobber it on every load, silently
      // killing push delivery. A separate scope lets both coexist.
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope'
      });

      // 👉 Hand the registered worker directly to Firebase
      const currentToken = await getToken(messaging, { 
        vapidKey: 'BDCZCEH2kk3zEgnxGe9KGUjFuleKJMCmLyDP-zqBxJPGyn5hoCRdGoYWbL8qgiWQ3YV6wh1v94UVus5jFjVTlgU',
        serviceWorkerRegistration: registration 
      });

      if (currentToken) {
        console.log("🔥 Token Generated Successfully linked to Background Worker");
        return currentToken;
      }
    } else {
      console.log("Notification permission not granted.");
    }
    return null;
  } catch (error) {
    console.error('An error occurred while retrieving token: ', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

// When a push arrives while the app is OPEN (foreground), Firebase does not
// auto-display it — we have to. This shows it as a real system notification so
// it lands in the notification center just like a background push.
let foregroundBound = false;
export const initForegroundMessages = () => {
  if (foregroundBound) return;
  foregroundBound = true;
  onMessage(messaging, async (payload) => {
    const title = payload?.notification?.title || "Sahayam";
    const body = payload?.notification?.body || "";
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          reg.showNotification(title, {
            body,
            icon: "/logo.png",
            badge: "/logo.png",
            vibrate: [200, 100, 200],
          });
        }
      }
    } catch (e) {
      console.error("Foreground notification failed:", e);
    }
  });
};