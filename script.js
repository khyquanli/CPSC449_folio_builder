// Fetch navbar.html and inject it into #navbar div
fetch("navbar.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("navbar").innerHTML = data;
    })
    .catch(error => console.error("Error loading navbar:", error));

// Scroll reveal effect for Our Team page
const hiddenElements = document.querySelectorAll('.hidden');
function revealOnScroll() {
    hiddenElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
            el.classList.add('show');
        }
    });
}
window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);
