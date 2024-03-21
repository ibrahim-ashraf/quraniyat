const pageTitle = encodeURIComponent(document.title);
const pageUrl = encodeURIComponent(window.location.href);
const shareText = `${pageTitle}${encodeURIComponent(": ")}${pageUrl}`;

whatsapp = document.getElementById("whatsapp");
telegram = document.getElementById("telegram");
facebook = document.getElementById("facebook");
twitter = document.getElementById("twitter");
email = document.getElementById("email");

whatsapp.href = `whatsapp://send?text=${shareText}`;
telegram.href = `https://t.me/share/url?url=${pageUrl}&text=${shareText}`
facebook.href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`
twitter.href = `https://twitter.com/intent/tweet?url=${pageUrl}&text=${shareText}`
email.href = `mailto:?subject=${pageTitle}&amp;body=${pageUrl}`