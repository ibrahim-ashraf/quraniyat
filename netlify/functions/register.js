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
    // =========================
    // 1️⃣ قراءة البيانات
    // =========================
    const data = JSON.parse(event.body);

    // =========================
    // 2️⃣ التحقق من البيانات الأساسية
    // =========================
    if (!data.name || !data.phone || !data.package || !data.sessionDuration) {
      return {
        statusCode: 400,
        body: "بيانات ناقصة"
      };
    }

    // =========================
    // 4️⃣ تجهيز البيانات للحفظ
    // =========================
    const studentData = {
      type: data.type || "students",
      name: data.name,
      gender: data.gender || null,
      birthdate: data.birthDate,
      nationality: data.nationality || null,
      residence: data.residence || null,
      phone: data.phone,
      email: data.email,
      package: data.package,
      sessionDuration: data.sessionDuration,
      price: data.price,
      notes: data.notes,
      createdAt: serverTimestamp(),
      createdAtISO: new Date().toISOString()
    };

    // =========================
    // 5️⃣ الحفظ في Firebase
    // =========================
    await addDoc(collection(db, studentData.type), studentData);

    // =========================
    // 6️⃣ الرد
    // =========================
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