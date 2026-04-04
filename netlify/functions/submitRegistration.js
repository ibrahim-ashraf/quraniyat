import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function handler(event, context) {
  try {
    const data = JSON.parse(event.body);

    data.createdAt = serverTimestamp();

    await addDoc(collection(db, data.type), data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "تم التسجيل بنجاح",
      })
    };

  } catch (error) {
    console.error("Registration Error:", error);

    return {
      statusCode: 500,
      body: "حدث خطأ في الخادم"
    };
  }
}