const dateTime = new Date();

function setBirthDate() {
    const maxDate = new Date(dateTime.getFullYear() - 18, dateTime.getMonth(), dateTime.getDate() + 1 ).toISOString().split("T")[0];
    const minDate = new Date(dateTime.getFullYear() - 30, dateTime.getMonth(), dateTime.getDate() + 1).toISOString().split("T")[0];

    document.getElementById("birth_date").max = maxDate;
    document.getElementById("birth_date").min = minDate;

    document.getElementById("birth_date_min").textContent = maxDate;
    document.getElementById("birth_date_max").textContent = minDate;
}

function createChallengeCode() {
    let challengeCode = "";
    let challengeCodeNumbers = Math.floor(Math.random() * 3) + 4;

    for (let i = 0; i < challengeCodeNumbers; i++) {
        challengeCode += Math.floor(Math.random() * 10);
    }

    document.getElementById("challenge_code_numbers").textContent = challengeCodeNumbers;
    document.getElementById("challenge_code").textContent = challengeCode;
    document.getElementById("challenge_code_hidden").value = challengeCode;

    // localStorage.setItem("registrationNumber", registrationNumber);
}

function showOtherCountryInput() {
    const countrySelect = document.getElementById("country");
    const otherCountryInput = document.getElementById("other_country");

    if (countrySelect.selectedIndex === countrySelect.options.length - 1) {
        otherCountryInput.style.display = "block";
        otherCountryInput.required = true;
    } else {
        otherCountryInput.style.display = "none";
        otherCountryInput.required = false;
    }
}

function displayDateTime() {
    const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

    let dddd = days[dateTime.getDay()];
    let dd = dateTime.getDate();
    let mmmm = months[dateTime.getMonth()];
    let yyyy = dateTime.getFullYear();
    let dateText = `${dddd}، ${dd} ${mmmm} ${yyyy}`;
    let time = dateTime.toLocaleTimeString()
    document.getElementById("date_time").innerHTML = `${date}، ${time}`;

    setInterval(displayDateTime, 1000);
}
