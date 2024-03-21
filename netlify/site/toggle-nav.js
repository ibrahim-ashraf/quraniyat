const toggleNavBtn = document.getElementById("toggle_nav_btn");
const nav = document.getElementById("nav");

toggleNavBtn.addEventListener("click", function() {
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
});
