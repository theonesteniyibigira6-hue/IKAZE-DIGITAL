// IKAZE DIGITAL — main bootstrap
// Loader, year stamp, contact form validation, tiny helpers.

(() => {
  'use strict';

  // ---- Loader ----
  const loader = document.getElementById('loader');
  const hideLoader = () => loader && loader.classList.add('is-hidden');

  // Hide after DOM ready + short minimum for graceful reveal
  const MIN_LOADER_MS = 300;
  const started = performance.now();
  window.addEventListener('load', () => {
    const elapsed = performance.now() - started;
    setTimeout(hideLoader, Math.max(0, MIN_LOADER_MS - elapsed));
  });
  // Safety: never let loader get stuck
  setTimeout(hideLoader, 4000);

  // ---- Year ----
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ---- Contact form ----
  const form = document.getElementById('contactForm');
  if (form) {
    const status = form.querySelector('.form-status');

    const setStatus = (msg, type) => {
      status.textContent = msg;
      status.classList.remove('is-error', 'is-success');
      if (type) status.classList.add(type);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('');

      // Honeypot check
      if (form.elements.website && form.elements.website.value) {
        // Silently pretend success (bot filled the trap)
        setStatus('Thank you. We will be in touch.', 'is-success');
        form.reset();
        return;
      }

      const data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone.value.trim(),
        service: form.elements.service.value,
        message: form.elements.message.value.trim(),
      };

      // Client-side validation (NOT a substitute for server-side)
      if (!data.name || data.name.length > 120) return setStatus('Please enter a valid name.', 'is-error');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return setStatus('Please enter a valid email.', 'is-error');
      if (!data.message || data.message.length < 10) return setStatus('Please describe your project (10+ characters).', 'is-error');
      if (data.message.length > 5000) return setStatus('Message is too long.', 'is-error');

      // NOTE: This endpoint is a placeholder. Replace with your real
      // backend (Firebase Cloud Function, Formspree, or your own API).
      // NEVER trust this client-side check — the backend must re-validate.
      try {
        setStatus('Sending…');
        // Example wire-up (commented out until backend exists):
        //
        // const res = await fetch('/api/contact', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(data),
        // });
        // if (!res.ok) throw new Error('Request failed');

        // For now, provide an honest fallback: open the user's mail client.
        // This is NOT a real submission — it's a graceful degradation.
        const subject = encodeURIComponent(`New project enquiry — ${data.service}`);
        const body = encodeURIComponent(
          `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nService: ${data.service}\n\n${data.message}`
        );
        window.location.href = `mailto:theonesteniyibigira6@gmail.com?subject=${subject}&body=${body}`;

        setStatus('Your email client should open shortly. You can also write to us directly at theonesteniyibigira6@gmail.com.', 'is-success');
        form.reset();
      } catch (err) {
        setStatus('Something went wrong. Please email us directly at theonesteniyibigira6@gmail.com.', 'is-error');
      }
    });
  }
})();
