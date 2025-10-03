 function toggleForms() {
      let loginForm = document.getElementById("loginForm");
      let registerForm = document.getElementById("registerForm");
      if (loginForm.style.display === "none") {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
      } else {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
      }
    }