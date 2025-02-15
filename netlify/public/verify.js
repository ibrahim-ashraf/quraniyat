import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCCT4dqipC6rJuzsp-2PIhXa2kzRzdg-K4",
  authDomain: "quraniyat-1713513000615.firebaseapp.com",
  // authDomain: "571ea39c--quraniyat.netlify.live",
  projectId: "quraniyat-1713513000615",
  storageBucket: "quraniyat-1713513000615.firebasestorage.app",
  messagingSenderId: "266135615301",
  appId: "1:266135615301:web:ff505be2b547298ccc302c",
  measurementId: "G-ZPW2DDHZJX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.useDeviceLanguage();
auth.settings.appVerificationDisabledForTesting = true;
window.recaptchaVerifier = new RecaptchaVerifier(auth, 'send-code-button', {
  'size': 'invisible',
  'callback': (response) => {
    // reCAPTCHA solved, allow signInWithPhoneNumber.
    sendVerificationCode();
    // alert('أدخل الرمز الاختباري')
  }
});

function sendVerificationCode() {
  const phoneNumber = document.getElementById('phoneNumber').value;
  const appVerifier = window.recaptchaVerifier;

  signInWithPhoneNumber(auth, phoneNumber, appVerifier)
    .then((confirmationResult) => {
      window.confirmationResult = confirmationResult;
      // alert('تم إرسال رمز التحقق إلى هاتفك.');
      alert('أدخل الرمز الاختباري.');
    }).catch((error) => {
      console.error(error);
      alert('فشل في إرسال رمز التحقق.');
    });
}

function verifyCode() {
  const code = document.getElementById('verificationCode').value;
  confirmationResult.confirm(code).then((result) => {
    const user = result.user;
    alert('تم التحقق من رقم الهاتف بنجاح!');
  }).catch((error) => {
    console.error(error);
    alert('فشل في التحقق من رمز الهاتف.');
  });
}
