async function sendPhoneOtp(event) {
    event.preventDefault(); // Prevent form submission

    const phoneInput = document.getElementById('phone');
    const phoneNumber = phoneInput.value;

    const response = await fetch('/.netlify/functions/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: phoneNumber,
        channel: 'sms',
        body: 'Your verification code is: 12345' // Replace with actual code
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);
    } else {
      alert(data.error);
    }
}


async function verifyPhoneOtp(event) {
    event.preventDefault(); // Prevent form submission

    const phoneInput = document.getElementById('phone');
    const phoneNumber = phoneInput.value;
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
      alert(data.message);
    } else {
      alert(data.error);
    }
}


function submitForm() {
    // Add any additional logic before form submission
    document.forms["verification"].submit();
}