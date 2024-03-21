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