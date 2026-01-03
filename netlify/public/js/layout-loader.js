async function loadFragment(url, targetId) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`فشل تحميل ${url}`);
    const html = await res.text();
    document.getElementById(targetId).innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadFragment("/partials/header.html", "site-header");
  loadFragment("/partials/footer.html", "site-footer");
});
