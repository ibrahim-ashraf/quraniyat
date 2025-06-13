import networkService from './network-service.js';
import { retry } from './utils.js';

let verificationTimer;
const resendTimeout = 300; // مدة الانتظار بالثواني قبل إعادة الإرسال (5 دقائق)
const VERIFIED_EMAILS_KEY = 'verifiedEmails';

// وظائف إدارة التخزين في الجلسة
function getVerifiedEmails() {
  const stored = sessionStorage.getItem(VERIFIED_EMAILS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function addVerifiedEmail(email) {
  const emails = getVerifiedEmails();
  if (!emails.includes(email)) {
    emails.push(email);
    sessionStorage.setItem(VERIFIED_EMAILS_KEY, JSON.stringify(emails));
  }
}

function isEmailVerified(email) {
  return getVerifiedEmails().includes(email);
}

export function initializeEmailVerification(emailInput) {
  if (!emailInput) return;

  // مراقبة تغيير البريد الإلكتروني
  emailInput.addEventListener('input', () => {
    const verificationMethods = document.querySelector('.email-verification-methods');
    const emailVerified = document.getElementById('email-verified');
    const verificationStep = document.getElementById('email-verification-step');

    const email = emailInput.value.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (isValid) {
      if (isEmailVerified(email)) {
        verificationMethods.style.display = 'none';
        verificationStep.style.display = 'none';
        emailVerified.style.display = 'block';
      } else {
        verificationMethods.style.display = 'block';
        verificationStep.style.display = 'none';
        emailVerified.style.display = 'none';
      }
    } else {
      verificationMethods.style.display = 'none';
      verificationStep.style.display = 'none';
      emailVerified.style.display = 'none';
    }
  });
}

export function initializeEmailVerificationListeners() {
  // زر إرسال رمز التحقق
  document.getElementById('verify-email-btn')?.addEventListener('click', () => {
    const emailInput = document.getElementById('contact-email');
    sendVerificationEmail(emailInput.value.trim());
  });

  // زر التحقق من الرمز
  document.getElementById('verify-email-code-button')?.addEventListener('click', () => {
    const emailInput = document.getElementById('contact-email');
    const code = document.getElementById('email-verification-code').value;
    verifyEmailCode(emailInput.value.trim(), code);
  });

  // زر إعادة إرسال الرمز
  document.getElementById('resend-email-code')?.addEventListener('click', () => {
    const emailInput = document.getElementById('contact-email');
    clearInterval(verificationTimer);
    sendVerificationEmail(emailInput.value.trim(), true);
  });
}

export async function sendVerificationEmail(email, isResend = false) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('يرجى إدخال بريد إلكتروني صالح');
    return;
  }

  try {
    showLoader();
    const response = await retry(() =>
      networkService.post('verifyMessage', {
        email,
        method: 'email' // تحديد القناة كـ email لـ Twilio Verify
      })
    );

    if (response.success) {
      document.querySelector('.email-verification-methods').style.display = 'none';
      document.getElementById('email-verification-step').style.display = 'block';
      startEmailResendTimer();
      showError('تم إرسال رمز التحقق. يرجى التحقق من بريدك الإلكتروني.', 'success');
    }
  } catch (error) {
    showError(getErrorMessage(error));
  } finally {
    hideLoader();
  }
}

export function startEmailResendTimer() {
  const timerElement = document.getElementById('email-timer');
  const resendButton = document.getElementById('resend-email-code');
  let timeLeft = resendTimeout;

  resendButton.disabled = true;

  verificationTimer = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (timeLeft <= 0) {
      clearInterval(verificationTimer);
      resendButton.disabled = false;
      timerElement.textContent = '00:00';
    }
    timeLeft--;
  }, 1000);
}

export async function verifyEmailCode(email, code) {
  if (!code) {
    showError('يرجى إدخال رمز التحقق');
    return;
  }

  try {
    showLoader();
    const response = await retry(() =>
      networkService.post('verifyMessage', {
        email,
        verify: true,
        code
      })
    );

    if (response.success) {
      document.getElementById('email-verification-step').style.display = 'none';
      document.getElementById('email-verified').style.display = 'block';

      // حفظ البريد في قائمة العناوين المتحقق منها في الجلسة
      addVerifiedEmail(email);

      if (verificationTimer) {
        clearInterval(verificationTimer);
      }

      showError('تم التحقق من البريد الإلكتروني بنجاح', 'success');
    }
  } catch (error) {
    showError(getErrorMessage(error));
    document.getElementById('email-verification-code').value = '';

    if (error.code === 'code_expired') {
      if (verificationTimer) {
        clearInterval(verificationTimer);
      }
      document.getElementById('resend-email-code').disabled = false;
      document.getElementById('email-timer').textContent = '00:00';
    }
  } finally {
    hideLoader();
  }
}

function showError(message, type = 'error') {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.className = `message ${type}`;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }
}

function showLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'block';
  }
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
}

function getErrorMessage(error) {
  switch (error.code) {
    case 'invalid_email':
      return 'البريد الإلكتروني غير صالح';
    case 'code_expired':
      return 'انتهت صلاحية رمز التحقق';
    case 'invalid_code':
      return 'رمز التحقق غير صحيح';
    case 'too_many_attempts':
      return 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً';
    case 'network_error':
      return 'حدث خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت';
    default:
      return error.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى';
  }
}