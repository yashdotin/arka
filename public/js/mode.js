document.addEventListener("DOMContentLoaded", () => {
  const lightBtn = document.getElementById('lightBtn');
  const softBtn = document.getElementById('softBtn');

  function setTheme(theme) {
    // Remove all theme classes
    document.body.classList.remove('light', 'soft');

    if (theme === 'light') {
      document.body.classList.add('light');
      setActiveBtn(lightBtn);
    } else if (theme === 'soft') {
      document.body.classList.add('soft');
      setActiveBtn(softBtn);
    }

    // Save preference
    localStorage.setItem('theme', theme);
  }

  function setActiveBtn(btn) {
    [lightBtn, softBtn].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  // Attach click events
  lightBtn.addEventListener('click', () => setTheme('light'));
  softBtn.addEventListener('click', () => setTheme('soft'));

  // Apply saved theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
});
