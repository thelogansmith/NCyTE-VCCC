/**
 * CTA Chatbot Widget
 * Cybersecurity Training Academy — AI Support Assistant
 * Calls /proxy.aspx on the same origin. No API keys in this file.
 */
(function () {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────────────────────────
  const PROXY_URL = '/proxy.aspx';          // same-origin proxy, key lives in web.config
  const MODEL     = 'PLACEHOLDER_MODEL';    // e.g. mistral:7b  — set in web.config instead
  const MAX_HISTORY = 10;                   // message pairs kept in context

  const SYSTEM_PROMPT = `You are ARIA (Automated Response & Intelligence Assistant), the support chatbot for the Cybersecurity Training Academy (CTA). CTA offers professional cybersecurity education and hands-on training tools.

Our offerings include:
COURSES: Certified Ethical Hacker prep, Network Defense Fundamentals, Penetration Testing Essentials.
CERTIFICATIONS: CTA Certified Security Analyst (CCSA), CTA Network Defense Professional (CNDP).
HARDWARE TOOLS FOR SALE: Flipper Zero (multi-tool RF device), Raspberry Pi 5 (portable lab platform), Wi-Fi Pineapple (wireless auditing device), HackRF One (software-defined radio), USB Rubber Ducky.

Your role:
- Answer questions about CTA courses, certifications, and tools.
- Help visitors understand which course or certification suits their experience level.
- Explain what hardware tools are used for in a security context.
- Direct purchasing questions to the store at store.cta.local.
- Be concise, professional, and knowledgeable. Never invent pricing or dates not provided to you.
- If asked about something unrelated to cybersecurity training or CTA, politely redirect.`;

  // ── STATE ────────────────────────────────────────────────────────────────────
  let history   = [];
  let isOpen    = false;
  let isTyping  = false;

  // ── INJECT STYLES ────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');

    #cta-chat-root * { box-sizing: border-box; margin: 0; padding: 0; }

    #cta-chat-root {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 99999;
      font-family: 'Rajdhani', sans-serif;
    }

    /* ── TOGGLE BUTTON ── */
    #cta-chat-toggle {
      width: 58px;
      height: 58px;
      border-radius: 4px;
      border: 2px solid #00ff9d;
      background: #0a0e1a;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 18px rgba(0,255,157,0.35), inset 0 0 12px rgba(0,255,157,0.05);
      transition: box-shadow 0.2s, transform 0.15s;
      position: relative;
    }
    #cta-chat-toggle:hover {
      box-shadow: 0 0 28px rgba(0,255,157,0.6), inset 0 0 16px rgba(0,255,157,0.1);
      transform: scale(1.05);
    }
    #cta-chat-toggle svg { width: 26px; height: 26px; }

    /* unread pip */
    #cta-chat-pip {
      position: absolute;
      top: -5px; right: -5px;
      width: 12px; height: 12px;
      border-radius: 50%;
      background: #00ff9d;
      box-shadow: 0 0 8px #00ff9d;
      display: none;
      animation: pip-pulse 1.4s ease-in-out infinite;
    }
    @keyframes pip-pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:.6; transform:scale(1.3); }
    }

    /* ── WINDOW ── */
    #cta-chat-window {
      position: absolute;
      bottom: 72px;
      right: 0;
      width: 360px;
      height: 520px;
      background: #080c18;
      border: 1px solid #00ff9d44;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 40px rgba(0,255,157,0.15), 0 20px 60px rgba(0,0,0,0.7);
      transform-origin: bottom right;
      animation: chat-open 0.2s ease forwards;
    }
    @keyframes chat-open {
      from { opacity:0; transform: scale(0.92) translateY(10px); }
      to   { opacity:1; transform: scale(1)    translateY(0); }
    }
    #cta-chat-window.closing {
      animation: chat-close 0.18s ease forwards;
    }
    @keyframes chat-close {
      from { opacity:1; transform: scale(1)    translateY(0); }
      to   { opacity:0; transform: scale(0.92) translateY(10px); }
    }

    /* ── HEADER ── */
    #cta-chat-header {
      background: #0a0e1a;
      border-bottom: 1px solid #00ff9d33;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    #cta-chat-avatar {
      width: 34px; height: 34px;
      border-radius: 4px;
      border: 1px solid #00ff9d66;
      background: linear-gradient(135deg, #001a0d, #003320);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    #cta-chat-avatar svg { width: 18px; height: 18px; }
    #cta-chat-title { flex: 1; }
    #cta-chat-title strong {
      display: block;
      font-size: 14px; font-weight: 700; letter-spacing: 0.08em;
      color: #00ff9d;
      text-transform: uppercase;
    }
    #cta-chat-title span {
      font-size: 11px; color: #4a7a62; letter-spacing: 0.05em;
      font-family: 'Share Tech Mono', monospace;
    }
    #cta-online-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #00ff9d;
      box-shadow: 0 0 6px #00ff9d;
      animation: pip-pulse 2s ease-in-out infinite;
    }
    #cta-chat-close {
      background: none; border: none; cursor: pointer;
      color: #4a7a62; font-size: 18px; line-height: 1;
      padding: 2px 4px; border-radius: 2px;
      transition: color 0.15s;
    }
    #cta-chat-close:hover { color: #00ff9d; }

    /* ── MESSAGES ── */
    #cta-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scrollbar-width: thin;
      scrollbar-color: #00ff9d22 transparent;
    }
    #cta-chat-messages::-webkit-scrollbar { width: 4px; }
    #cta-chat-messages::-webkit-scrollbar-track { background: transparent; }
    #cta-chat-messages::-webkit-scrollbar-thumb { background: #00ff9d33; border-radius: 2px; }

    .cta-msg {
      max-width: 85%;
      padding: 10px 13px;
      border-radius: 4px;
      font-size: 13.5px;
      line-height: 1.55;
      animation: msg-in 0.18s ease;
    }
    @keyframes msg-in {
      from { opacity:0; transform: translateY(6px); }
      to   { opacity:1; transform: translateY(0); }
    }
    .cta-msg-bot {
      align-self: flex-start;
      background: #0d1526;
      border: 1px solid #00ff9d22;
      color: #c8e8d8;
      border-left: 2px solid #00ff9d;
    }
    .cta-msg-user {
      align-self: flex-end;
      background: #002a15;
      border: 1px solid #00ff9d44;
      color: #e8fff4;
    }
    .cta-msg-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.1em;
      margin-bottom: 4px;
      opacity: 0.5;
      text-transform: uppercase;
    }

    /* typing indicator */
    .cta-typing {
      display: flex; gap: 5px; align-items: center; padding: 4px 0;
    }
    .cta-typing span {
      width: 6px; height: 6px; border-radius: 50%;
      background: #00ff9d;
      animation: bounce 1.1s ease-in-out infinite;
    }
    .cta-typing span:nth-child(2) { animation-delay: 0.18s; }
    .cta-typing span:nth-child(3) { animation-delay: 0.36s; }
    @keyframes bounce {
      0%,80%,100% { transform: translateY(0); opacity:0.4; }
      40%         { transform: translateY(-6px); opacity:1; }
    }

    /* ── INPUT AREA ── */
    #cta-chat-footer {
      border-top: 1px solid #00ff9d22;
      background: #0a0e1a;
      padding: 12px;
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-shrink: 0;
    }
    #cta-chat-input {
      flex: 1;
      background: #080c18;
      border: 1px solid #00ff9d33;
      border-radius: 4px;
      color: #c8e8d8;
      font-family: 'Rajdhani', sans-serif;
      font-size: 13.5px;
      padding: 9px 12px;
      resize: none;
      outline: none;
      min-height: 40px;
      max-height: 100px;
      transition: border-color 0.15s, box-shadow 0.15s;
      line-height: 1.4;
    }
    #cta-chat-input::placeholder { color: #2a5a3a; }
    #cta-chat-input:focus {
      border-color: #00ff9d66;
      box-shadow: 0 0 8px rgba(0,255,157,0.12);
    }
    #cta-chat-send {
      width: 40px; height: 40px; flex-shrink: 0;
      background: #001a0d;
      border: 1px solid #00ff9d66;
      border-radius: 4px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, box-shadow 0.15s;
      color: #00ff9d;
    }
    #cta-chat-send:hover {
      background: #002a15;
      box-shadow: 0 0 10px rgba(0,255,157,0.3);
    }
    #cta-chat-send:disabled {
      opacity: 0.35; cursor: not-allowed;
      box-shadow: none;
    }
    #cta-chat-send svg { width: 16px; height: 16px; }

    #cta-chat-hint {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: #2a5a3a;
      text-align: center;
      padding: 0 12px 8px;
      letter-spacing: 0.04em;
    }
  `;
  document.head.appendChild(style);

  // ── BUILD DOM ─────────────────────────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'cta-chat-root';

  root.innerHTML = `
    <div id="cta-chat-window" style="display:none;">
      <div id="cta-chat-header">
        <div id="cta-chat-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="#00ff9d" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div id="cta-chat-title">
          <strong>ARIA</strong>
          <span>CTA Support Assistant</span>
        </div>
        <div id="cta-online-dot"></div>
        <button id="cta-chat-close" aria-label="Close chat">✕</button>
      </div>

      <div id="cta-chat-messages"></div>

      <div id="cta-chat-footer">
        <textarea id="cta-chat-input" rows="1"
          placeholder="Ask about courses, certs, or tools…"
          aria-label="Chat input"></textarea>
        <button id="cta-chat-send" aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <div id="cta-chat-hint">Powered by CTA AI · Internal Use</div>
    </div>

    <button id="cta-chat-toggle" aria-label="Open support chat">
      <div id="cta-chat-pip"></div>
      <svg viewBox="0 0 24 24" fill="none" stroke="#00ff9d" stroke-width="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
  `;

  document.body.appendChild(root);

  // ── REFS ──────────────────────────────────────────────────────────────────────
  const win     = root.querySelector('#cta-chat-window');
  const toggle  = root.querySelector('#cta-chat-toggle');
  const closeBtn= root.querySelector('#cta-chat-close');
  const msgs    = root.querySelector('#cta-chat-messages');
  const input   = root.querySelector('#cta-chat-input');
  const sendBtn = root.querySelector('#cta-chat-send');
  const pip     = root.querySelector('#cta-chat-pip');

  // ── HELPERS ───────────────────────────────────────────────────────────────────
  function addMessage(role, text) {
    const wrap = document.createElement('div');
    wrap.className = 'cta-msg ' + (role === 'bot' ? 'cta-msg-bot' : 'cta-msg-user');
    wrap.innerHTML = `
      <div class="cta-msg-label">${role === 'bot' ? 'ARIA' : 'YOU'}</div>
      <div>${escapeHtml(text).replace(/\n/g, '<br>')}</div>
    `;
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return wrap;
  }

  function addTypingIndicator() {
    const wrap = document.createElement('div');
    wrap.className = 'cta-msg cta-msg-bot';
    wrap.id = 'cta-typing-indicator';
    wrap.innerHTML = `
      <div class="cta-msg-label">ARIA</div>
      <div class="cta-typing">
        <span></span><span></span><span></span>
      </div>
    `;
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTypingIndicator() {
    const el = document.getElementById('cta-typing-indicator');
    if (el) el.remove();
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setLoading(state) {
    isTyping = state;
    sendBtn.disabled = state;
    input.disabled   = state;
  }

  // ── OPEN / CLOSE ──────────────────────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    pip.style.display = 'none';
    win.style.display = 'flex';
    win.classList.remove('closing');
    input.focus();
    // Greet on first open
    if (msgs.children.length === 0) {
      addMessage('bot',
        'Hello! I\'m ARIA, your CTA support assistant. I can help with courses, certifications, and security tools. What can I help you with today?'
      );
    }
  }

  function closeChat() {
    win.classList.add('closing');
    setTimeout(() => {
      win.style.display = 'none';
      win.classList.remove('closing');
      isOpen = false;
    }, 180);
  }

  toggle.addEventListener('click', () => isOpen ? closeChat() : openChat());
  closeBtn.addEventListener('click', closeChat);

  // Show pip after 4s if not opened
  setTimeout(() => {
    if (!isOpen) pip.style.display = 'block';
  }, 4000);

  // ── SEND ──────────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isTyping) return;

    input.value = '';
    input.style.height = 'auto';
    addMessage('user', text);

    // Maintain rolling history
    history.push({ role: 'user', content: text });
    if (history.length > MAX_HISTORY * 2) history = history.slice(-MAX_HISTORY * 2);

    setLoading(true);
    addTypingIndicator();

    try {
      const response = await fetch(PROXY_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history
          ]
        })
      });

      removeTypingIndicator();

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      const data  = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim()
                 || 'I\'m having trouble connecting right now. Please try again shortly.';

      addMessage('bot', reply);
      history.push({ role: 'assistant', content: reply });

    } catch (err) {
      removeTypingIndicator();
      addMessage('bot', 'Sorry, I\'m unable to connect right now. Please try again or contact support directly.');
      console.error('[CTA Chatbot]', err);
    }

    setLoading(false);
    input.focus();
  }

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  input.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

})();
