const pageTitle = document.title;
const pageUrl = encodeURIComponent(window.location.href);
const shareText = `${pageTitle}: ${pageUrl}`;

function shareOnFacebook() {
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}&quote=${shareText}`;
    window.open(fbShareUrl, 'facebook-share-dialog', 'width=626,height=436');
}

function shareOnTwitter() {
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${shareText}`;
    window.open(twitterShareUrl, 'twitter-share-dialog', 'width=626,height=436');
}

function shareOnWhatsApp() {
    const whatsappShareUrl = `https://wa.me/?text=${shareText}`;
    window.open(whatsappShareUrl, 'whatsapp-share-dialog', 'width=626,height=436');
}
