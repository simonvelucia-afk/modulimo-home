// MODULIMO — Formulaire de capture de leads Pointe Est
// Validation basique, honeypot anti-spam, soumission sans rechargement.
// Les textes (étiquettes, messages) vivent dans le HTML via [data-lang].
(function () {
  'use strict';

  // URL de l'Edge Function (projet Central) — constante à remplacer au besoin.
  var FN_URL = 'https://bpxscgrbxjscicpnheep.supabase.co/functions/v1/submit-lead-pointe-est';
  // Clé anon publique — même projet que js/theme.js.
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJweHNjZ3JieGpzY2ljcG5oZWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYxNzIsImV4cCI6MjA5MDk3MjE3Mn0._M6HHhCwKuuqAzicDZzJp7ul0M3KpDBBDb6ImDWWcLo';
  var CONSENT_TEXT_VERSION = '2026-06-v1';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function fieldWrap(input) {
    var el = input;
    while (el && el !== document.body) {
      if (el.classList && el.classList.contains('lf-field')) return el;
      el = el.parentNode;
    }
    return null;
  }

  function setStatus(form, kind) {
    form.querySelectorAll('.lf-status').forEach(function (s) {
      s.classList.toggle('is-visible', s.getAttribute('data-status') === kind);
    });
  }

  function setup(form) {
    form.setAttribute('novalidate', 'novalidate');
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstName = form.elements.first_name;
      var lastName = form.elements.last_name;
      var email = form.elements.email;
      var message = form.elements.message;
      var consent = form.elements.consent;
      var honeypot = form.elements.website;
      var btn = form.querySelector('button[type="submit"]');

      // Validation basique avec marquage visuel des champs fautifs
      var invalid = [];
      if (!firstName.value.trim()) invalid.push(firstName);
      if (!lastName.value.trim()) invalid.push(lastName);
      if (!EMAIL_RE.test(email.value.trim())) invalid.push(email);
      if (!consent.checked) invalid.push(consent);

      [firstName, lastName, email, consent].forEach(function (input) {
        var wrap = fieldWrap(input);
        if (wrap) wrap.classList.toggle('lf-invalid', invalid.indexOf(input) !== -1);
      });

      if (invalid.length) {
        setStatus(form, 'invalid');
        invalid[0].focus();
        return;
      }
      setStatus(form, '');

      var lang = document.documentElement.getAttribute('lang') || 'fr';
      var payload = {
        first_name: firstName.value.trim(),
        last_name: lastName.value.trim(),
        email: email.value.trim(),
        message: message ? message.value.trim() : '',
        consent: true,
        consent_text_version: CONSENT_TEXT_VERSION,
        website: honeypot ? honeypot.value : '',
        locale: lang,
        source_page: window.location.pathname,
        user_agent: navigator.userAgent
      };

      btn.disabled = true;
      form.classList.add('lf-sending');

      fetch(FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': 'Bearer ' + ANON_KEY
        },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('http_' + res.status);
        return res.json();
      }).then(function () {
        form.classList.remove('lf-sending');
        form.classList.add('is-done');
        if (typeof window.trackFeature === 'function') {
          window.trackFeature('leads', 'lead_submitted', { form_page: window.location.pathname });
        }
      }).catch(function (err) {
        console.error('[lead-form]', err);
        form.classList.remove('lf-sending');
        btn.disabled = false;
        setStatus(form, 'fail');
      });
    });
  }

  document.querySelectorAll('form.lead-form').forEach(setup);
})();
