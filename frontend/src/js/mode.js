export function applyThemeOnLoad() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.className = savedTheme === 'dark'
      ? "fas fa-sun theme-icon-sun"
      : "fas fa-moon theme-icon-moon";
  }
}

export function toggleTheme() {
  const html = document.documentElement;
  const icon = document.getElementById("theme-icon");
  const currentTheme = html.getAttribute("data-theme") || "light";
  if (currentTheme === "dark") {
    html.setAttribute("data-theme", "light");
    if (icon) icon.className = "fas fa-moon theme-icon-moon";
    localStorage.setItem("theme", "light");
  } else {
    html.setAttribute("data-theme", "dark");
    if (icon) icon.className = "fas fa-sun theme-icon-sun";
    localStorage.setItem("theme", "dark");
  }
}
