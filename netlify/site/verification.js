let phoneInput;
let phoneNumber;


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
    var phoneInputField = document.getElementById("phone");
    phoneInput = window.intlTelInput(phoneInputField, {
        initialCountry: "auto",
        geoIpLookup: getIp,
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
    });
}


async function sendPhoneOtp(event) {
    event.preventDefault();

    phoneNumber = phoneInput.getNumber();

    const response = await fetch('/.netlify/functions/sendMessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            to: phoneNumber,
            channel: 'sms'
        })
    });

    const data = await response.json();

    if (response.ok) {
        alert(`تم إرسال رمز التحقق إلى ${phoneNumber}.`);
    } else {
        alert(`فشل إرسال الرمز. نص الخطأ: ${data.error}`);
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


function submitForm() {
    // Add any additional logic before form submission
    document.forms["verification"].submit();
}