function createVerificationCode() {
      return Math.floor(Math.random() * 10);
    }
let verificationCode = "";
for (let i = 0; i < 5; i++) {
    verificationCode += createVerificationCode();
    }

document.getElementById("verification_code").value = verificationCode;

localStorage.setItem("registrationNumber", registrationNumber);

function showOtherCountryInput() {
    var countrySelect = document.getElementById("country");
var otherCountryInput = document.getElementById("other_country");
var nationalIdInput = document.getElementById("national_id");
    // Get the country select element
    var countrySelect = document.getElementById("country");

    // Get the other country input element
    var otherCountryInput = document.getElementById("other_country");

    // Check the value of the country select element
    if (countrySelect.value == "أخرى") {
      // Show the other country input
      otherCountryInput.style.display = "block";
  
      // Make the other country input required
      otherCountryInput.required = true;
    } else {
      // Hide the other country input
      otherCountryInput.style.display = "none";

      // Make the other country input not required
      otherCountryInput.required = false;
    }
  
  // Check the value of the country select element
  if (countrySelect.value == "مصر") {
    // Set the placeholder of the national ID input to "الرقم القومي"
    nationalIdInput.placeholder = "الرقم القومي";
  } else {
    // Set the placeholder of the national ID input to "رقم بطاقة الهوية الوطنية"
    nationalIdInput.placeholder = "رقم بطاقة الهوية الوطنية";
  }
}