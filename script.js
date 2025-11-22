/* ===== NAVBAR INJECTION ===== */
fetch("navbar.html")
  .then(r => r.text())
  .then(html => {
    const host = document.getElementById("navbar");
    if (host) {
      host.innerHTML = html;      // only inject if it exists
      updateNavbarState();
    }
  })
  .catch(err => console.error("Error loading navbar:", err));

function updateNavbarState() {
  fetch("/checkSession")
    .then(res => res.json())
    .then(data => {

      const loggedOut = document.getElementById("loggedOutNav");
      const loggedIn  = document.getElementById("loggedInNav");

      if (!loggedOut || !loggedIn) {
        console.warn("Navbar IDs not found — check navbar.html markup.");
        return;
      }

      if (data.loggedIn) {
        loggedOut.style.display = "none";
        loggedIn.style.display = "flex";
      } else {
        loggedOut.style.display = "flex";
        loggedIn.style.display = "none";
      }
    })
    .catch(err => console.error("Session check failed:", err));
}

/* ===== SIDEBAR INJECTION (shared left menu) ===== */
fetch("sidebar.html")
  .then((r) => r.text())
  .then((html) => {
    const host = document.getElementById("sidebarHost");
    if (host) {
      host.innerHTML = html;
    }
  })
  .catch((err) => console.error("Error loading sidebar:", err));

/* ===== OUR TEAM: REVEAL ON SCROLL ===== */
function revealOnScroll() {
  document.querySelectorAll('.hidden').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      el.classList.add('show');
    }
  });
}
window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

/* ===== PRICING: MONTHLY/YEARLY TOGGLE ===== */
document.querySelectorAll('.pb-toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const cycle = btn.dataset.cycle; // 'monthly' or 'yearly'
    document.querySelectorAll('.pb-toggle-btn')
      .forEach(b => b.classList.toggle('is-active', b === btn));
    document.querySelectorAll('.pb-amount').forEach(el => {
      const value = el.getAttribute(`data-${cycle}`) || el.textContent;
      el.textContent = value;
    });
  });
});

const openPanels = new Set();
let lastOpener = null;

// Utility: close all panels
function closeAllPanels() {
  document.querySelectorAll('.panel').forEach(p => p.hidden = true);
  openPanels.clear();
  lastOpener = null;
}

// Utility: position panel near opener
function positionPanel(panel, opener) {
  const sb = document.querySelector('.sidebar');
  const sbRect = sb.getBoundingClientRect();
  const opRect = opener.getBoundingClientRect();

  // Place panel to the right of the item, aligned to its top
  panel.style.position = 'fixed';
  panel.style.top  = `${opRect.top}px`;
  panel.style.left = `${sbRect.right + 8}px`; 
  panel.style.zIndex = 1000;
}

document.addEventListener('click', (e) => {
  const opener = e.target.closest('.sidebar .item[data-panel]');
  const clickedPanel = e.target.closest('.panel');

  if (opener) {
    e.preventDefault();
    const id = opener.getAttribute('data-panel');
    const panel = document.getElementById(id);
    if (!panel) return;

    const wasOpen = !panel.hidden;
    closeAllPanels();
    if (!wasOpen) {
      positionPanel(panel, opener);
      panel.hidden = false;
      openPanels.add(id);
      lastOpener = opener;
    }
    return;
  }

  if (clickedPanel) return;

  if (openPanels.size) {
    closeAllPanels();
  }
});

// Close on Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openPanels.size) {
    closeAllPanels();
  }
});

/* === PROFILE DROPDOWN TOGGLE (NAVBAR) === */
document.addEventListener("click", (e) => {
  const menu = document.querySelector("#loggedInNav");
  const icon = document.querySelector("#loggedInNav .profile-icon");
  const dropdown = document.querySelector("#loggedInNav .profile-dropdown");

  if (!menu || !icon || !dropdown) return;

  // If user clicks the profile image → toggle dropdown
  if (icon.contains(e.target)) {
    menu.classList.toggle("open");
    return;
  }

  // If user clicks outside → close dropdown
  if (!menu.contains(e.target)) {
    menu.classList.remove("open");
  }
});

/* === GLOBAL NAVBAR LOGOUT HANDLER === */
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("#logoutBtn");
  if (!btn) return;

  try {
    const res = await fetch("/logout", { method: "POST" });
    if (res.ok) window.location.href = "/";
    else alert("Logout failed.");
  } catch (err) {
    console.error("Logout error:", err);
  }
});
