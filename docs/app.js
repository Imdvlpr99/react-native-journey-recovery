document.addEventListener('DOMContentLoaded', () => {
  // 1. Copy code snippet handler
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const codeBlock = btn.closest('.code-container')?.querySelector('code');
      if (!codeBlock) return;

      try {
        await navigator.clipboard.writeText(codeBlock.innerText);
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.color = '#34d399';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.color = '';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code: ', err);
      }
    });
  });

  // 2. Active section spy for sidebar navigation
  const sections = document.querySelectorAll('.doc-section');
  const navLinks = document.querySelectorAll('.nav-link');

  const observerOptions = {
    root: null,
    rootMargin: '-80px 0px -70% 0px',
    threshold: 0,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));

  // 3. Search filter for documentation topics
  const searchInput = document.getElementById('docsSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = (e.target.value || '').toLowerCase().trim();
      navLinks.forEach((link) => {
        const text = link.textContent.toLowerCase();
        const matches = text.includes(term);
        link.style.display = matches ? 'block' : 'none';
      });

      // Filter groups
      document.querySelectorAll('.nav-group').forEach((group) => {
        const visibleLinks = group.querySelectorAll('.nav-link[style*="display: block"]');
        const hasVisible = term === '' || visibleLinks.length > 0;
        group.style.display = hasVisible ? 'block' : 'none';
      });
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const firstMatch = document.querySelector('.nav-link[style*="display: block"]');
        if (firstMatch) {
          firstMatch.click();
          searchInput.blur();
        }
      }
    });
  }

  // 4. Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        sidebar.classList.remove('open');
      });
    });
  }

  // 5. Global hotkey for search (Ctrl+K or Cmd+K)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput?.focus();
    }
  });
});
