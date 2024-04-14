const dateTime = new Date();

let supabaseClient;

async function getSupabaseCreds() {
    const response = await fetch('/.netlify/functions/supabaseCreds');
    const { supabaseUrl, supabaseKey } = await response.json();
    return { supabaseUrl, supabaseKey };
}

async function initializeSupabase() {
    const { supabaseUrl, supabaseKey } = await getSupabaseCreds();
    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}

async function insertData() {
    initializeSupabase();

    const { error } = await supabaseClient
        .from('users')
        .insert({
            name: 'Esraa',
            gender: 'Female',
            age: 4
        })

    if (error) {
        alert('Error inserting data:', error)
    } else {
        alert('Data inserted successfully!')
    }
}

function toggleNavigationMenu() {
    const toggleNavBtn = document.getElementById("toggle_nav_btn");
    const nav = document.getElementById("nav");

    if (nav.style.display === "none") {
        nav.style.display = "block";
        toggleNavBtn.textContent = "إغلاق قائمة التنقل";
        toggleNavBtn.setAttribute("aria-expanded", "true");
        toggleNavBtn.setAttribute("aria-label", "إغلاق قائمة التنقل");
    } else {
        nav.style.display = "none";
        toggleNavBtn.textContent = "فتح قائمة التنقل";
        toggleNavBtn.setAttribute("aria-expanded", "false");
        toggleNavBtn.setAttribute("aria-label", "فتح قائمة التنقل");
    }
}

function setBirthDateRange() {
    const maxDate = new Date(dateTime.getFullYear() - 18, dateTime.getMonth(), dateTime.getDate() + 1 ).toISOString().split("T")[0];
    const minDate = new Date(dateTime.getFullYear() - 30, dateTime.getMonth(), dateTime.getDate() + 1).toISOString().split("T")[0];

    document.getElementById("birth_date").max = maxDate;
    document.getElementById("birth_date").min = minDate;

    return {
        minDate: minDate,
        maxDate: maxDate
    };
}

function createChallengeCode() {
    let challengeCode = "";
    let challengeCodeNumbers = Math.floor(Math.random() * 3) + 4;

    for (let i = 0; i < challengeCodeNumbers; i++) {
        challengeCode += Math.floor(Math.random() * 10);
    }

    document.getElementById("challenge_code_hidden").value = challengeCode;

    return {
        challengeCode: challengeCode,
        challengeCodeNumbers: challengeCodeNumbers
    };
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

function sharePage() {
  const pageTitle = encodeURIComponent(document.title);
  const pageUrl = encodeURIComponent(window.location.href);
  const shareText = `${pageTitle}${encodeURIComponent(": ")}${pageUrl}`;

  whatsapp = document.getElementById("whatsapp");
  telegram = document.getElementById("telegram");
  facebook = document.getElementById("facebook");
  twitter = document.getElementById("twitter");
  email = document.getElementById("email");

  whatsapp.href = `https://wa.me/?text=${shareText}`;
  telegram.href = `https://t.me/share/url?url=${pageUrl}&text=${shareText}`
  facebook.href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}&quote=${shareText}`
  twitter.href = `https://twitter.com/intent/tweet?text=${shareText}`
  email.href = `mailto:?subject=${pageTitle}&body=${pageUrl}`
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
