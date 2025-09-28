const sidebarToggleBtns = document.querySelectorAll(".sidebar-toggle");
const sidebar = document.querySelector(".sidebar");
const searchForm = document.querySelector(".search-form");
const themeToggleBtn = document.querySelector(".theme-toggle");
const themeIcon = themeToggleBtn.querySelector(".theme-icon");
const menuLinks = document.querySelectorAll(".menu-link");
// Updates the theme icon based on current theme and sidebar state
const updateThemeIcon = () => {
  const isDark = document.body.classList.contains("dark-theme");
  themeIcon.textContent = sidebar.classList.contains("collapsed") ? (isDark ? "light_mode" : "dark_mode") : "dark_mode";

  const headerLogo= document.querySelector('.header-logo');
  if (isDark) {
    headerLogo.src = "../images/logo2.svg"; // Logo for dark theme
  } else {
    headerLogo.src = "../images/logo2.png"; // Logo for light theme
  }
};
// Apply dark theme if saved or system prefers, then update icon
const savedTheme = localStorage.getItem("theme");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const shouldUseDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
document.body.classList.toggle("dark-theme", shouldUseDarkTheme);
updateThemeIcon();
// Toggle between themes on theme button click
themeToggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateThemeIcon();
});
// Toggle sidebar collapsed state on buttons click
sidebarToggleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    updateThemeIcon();
  });
});
// Expand the sidebar when the search form is clicked
searchForm.addEventListener("click", () => {
  if (sidebar.classList.contains("collapsed")) {
    sidebar.classList.remove("collapsed");
    searchForm.querySelector("input").focus();
  }
});
// Expand sidebar by default on large screens
if (window.innerWidth > 768) sidebar.classList.remove("collapsed");

// Highlight the active menu link based on current URL
const currentPath = window.location.pathname.split("/").pop();
menuLinks.forEach((link) => {
  const linkPath = link.getAttribute("href");
  //optimize for localhost vs deployed paths
  if (linkPath === "./" + currentPath) {
    link.classList.add("active");
  } else {
    link.classList.remove("active");
  }
});

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/login/logout", {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (data.ok) {
        alert("Sesión cerrada correctamente.");
        window.location.href = "../index.html";;
      } else {
        alert("No se pudo cerrar sesión: " + data.error);
      }
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      alert("Error al conectar con el servidor.");
    }
  });
}


