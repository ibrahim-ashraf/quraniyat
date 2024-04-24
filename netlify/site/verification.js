const phoneInputField = document.getElementById("phone");

let phoneInput;
let phoneNumber;
let verificationChannel;
let phoneOtpSent;
let verificationCode;


function getIp(callback) {
    fetch('https://ipinfo.io/json?token=749548b0cb1e56', { headers: { 'Accept': 'application/json' }})
    .then((resp) => resp.json())
    .catch(() => {
        return {
            country: 'us',
        };
    })

    .then((resp) => callback(resp.country));
}


function initialIntlTelInput() {
    phoneInput = window.intlTelInput(phoneInputField, {
        initialCountry: "auto",
        geoIpLookup: getIp,
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
    });
}


async function sendPhoneOtp(event) {
    event.preventDefault();

    phoneNumber = phoneInput.getNumber();
    alert(phoneNumber)

    const response = await fetch('/.netlify/functions/sendMessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            to: phoneNumber,
            channel: verificationChannel
        })
    });

    const data = await response.json();

    if (response.ok) {
        alert(`تم إرسال رمز التحقق إلى ${phoneNumber}.`);
    } else {
        alert(`فشل إرسال الرمز. نص الخطأ: ${data.error}`);
        console.log(data);
    }
}


async function verifyPhoneOtp(event) {
    event.preventDefault();

    const codeInput = document.getElementById('phone_verification_code_edit');
    const verificationCode = codeInput.value;

    const response = await fetch('/.netlify/functions/verifyMessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            to: phoneNumber,
            code: verificationCode
        })
    });

    const data = await response.json();

    if (response.ok) {
        alert(`تم التحقق من ${phoneNumber} بنجاح.`);
    } else {
        alert(`فشل التحقق. نص الخطأ: ${data.error}`);
    }
}


function createVerificationCode() {
    let verificationCode = "";

    for (let i = 0; i < 6; i++) {
        verificationCode += Math.floor(Math.random() * 10);
    }

    return verificationCode;
}


async function sendEmailOtp(event) {
    event.preventDefault();

    emailjs.init({
        publicKey: "6PZw9nri_ADHR5lRq"
    });

    const nameInput = document.getElementById('name');
    const name = nameInput.value;
    const emailInput = document.getElementById('email');
    const email = emailInput.value;
    verificationCode = createVerificationCode();

    const serviceId = 'verify';
    const templateId = 'verify_emails';
    const templateParams = {
        to_name: name,
        to_email: email,
        verification_code: verificationCode
    };

    emailjs.send(serviceId, templateId, templateParams)
    .then(function(response) {
        alert('Verification email sent successfully!');
    }, function(error) {
        alert('Failed to send verification email. Error: ' + error.text);
    });
}


function verifyEmailOtp(event) {
    event.preventDefault();

    const emailInput = document.getElementById('email');
    const email = emailInput.value;
    const codeInput = document.getElementById('email_verification_code_edit');
    const code = codeInput.value;

    if (code === verificationCode) {
        alert('Email verification successful!');
    } else {
        alert('Invalid verification code.');
    }
}


function submitForm() {
    // Add any additional logic before form submission
    document.forms["verification"].submit();
}