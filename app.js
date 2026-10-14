(() => {
  const $ = s => document.querySelector(s);
  const ICONS = {
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M9 15l2 2 4-4"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    headset: '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 15a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2zM3 15a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.2a5 5 0 0 1 5 4.8"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    scale: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>'
  };
  const BENEFITS = [
    ['users', 'Reduced manual effort', 'Reminder, follow-up and feedback calls run on the agent, freeing front-desk and call-centre staff for complex cases.'],
    ['heart', 'Better patient engagement', 'Every patient can reach the agent in the browser, before visits and after discharge.'],
    ['check', 'Higher appointment adherence', 'The same agent that reminds and reschedules is the one visitors talk to on this page.'],
    ['gear', 'Operational efficiency', 'Each use case is tied to a live ElevenLabs agent and the hospital workflow it supports.'],
    ['scale', 'Scales on demand', 'Add a use case in the admin and it shows up here, ready for a real conversation.']
  ];
  const STEPS = [
    'Use case selected',
    'Connected to the ElevenLabs agent',
    'Speak or type — the agent replies live'
  ];

  let useCases = [];
  let filters = { directions: [], categories: [] };
  let selectedId = null;
  let conversation = null;
  let generation = 0;
  let connecting = false;
  let starting = false;
  let sessionKind = null;
  let connectWait = null;
  let cancelConnect = null;
  let pendingUser = '';
  let streamEl = null;
  let streamBuf = '';
  let seconds = 0;
  let timer = null;

  const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.chat}</svg>`;
  const selected = () => useCases.find(u => u.id === selectedId) || null;

  function iconFor(u, i) {
    const s = (u.categories || []).join(' ');
    if (/appointment-booking|rescheduling/.test(s)) return 'calendar';
    if (/reminders|cancellations/.test(s)) return 'bell';
    if (/prohealth/.test(s)) return 'heart';
    if (/no-show/.test(s)) return 'refresh';
    if (/post-discharge/.test(s)) return 'chat';
    if (/patient-support/.test(s)) return 'headset';
    return ['calendar', 'bell', 'heart', 'refresh', 'chat', 'headset'][i % 6];
  }

  function directionLabel(id) {
    const found = filters.directions.find(d => d.id === id);
    return found ? found.label : id || '';
  }

  function categoryLabels(ids) {
    return (ids || []).map(id => {
      const found = filters.categories.find(c => c.id === id);
      return found ? found.label : id;
    });
  }

  function option(value, label) {
    const el = document.createElement('option');
    el.value = value;
    el.textContent = label;
    return el;
  }

  function matches(u) {
    const direction = $('#directionFilter').value;
    const category = $('#categoryFilter').value;
    if (direction && u.direction !== direction) return false;
    if (category && !(u.categories || []).includes(category)) return false;
    return true;
  }

  function visibleUseCases() {
    return useCases.filter(matches);
  }

  function fillFilterSelects() {
    const direction = $('#directionFilter');
    const category = $('#categoryFilter');
    const directionValue = direction.value;
    const categoryValue = category.value;
    direction.replaceChildren(option('', 'All directions'));
    filters.directions.forEach(item => direction.append(option(item.id, item.label)));
    category.replaceChildren(option('', 'All use cases'));
    filters.categories.forEach(item => category.append(option(item.id, item.label)));
    direction.value = filters.directions.some(item => item.id === directionValue) ? directionValue : '';
    category.value = filters.categories.some(item => item.id === categoryValue) ? categoryValue : '';
  }

  function applyFilters() {
    const visible = visibleUseCases();
    document.querySelectorAll('#ucGrid .usecase').forEach(button => {
      const item = useCases.find(u => u.id === button.dataset.id);
      button.hidden = !item || !matches(item);
    });
    const empty = $('#filterEmpty');
    if (empty) empty.hidden = !useCases.length || visible.length > 0;
    const hint = $('#filterHint');
    if (hint) {
      hint.textContent = !useCases.length
        ? 'Add agents in the admin'
        : visible.length === useCases.length
          ? 'Filter, then choose an agent'
          : `${visible.length} of ${useCases.length} agents`;
    }
    if (typeof window.mountUseCaseDrag === 'function') window.mountUseCaseDrag();
    return visible;
  }

  async function api(path, opts) {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      ...opts
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function sdk() {
    const client = window.ElevenLabsClient;
    if (!client || !client.Conversation) {
      throw new Error('The ElevenLabs SDK did not load. Check your network and refresh the page.');
    }
    return client.Conversation;
  }

  function showChatError(message) {
    $('#chatError').textContent = message || '';
  }

  function setStatus(message) {
    $('#status').textContent = message || '';
  }

  function setLive(on, text) {
    $('#live').classList.toggle('on', on);
    $('#liveTxt').textContent = text;
  }

  function setWave(on) {
    document.querySelectorAll('.wave').forEach(w => w.classList.toggle('playing', on));
  }

  function setMode(label) {
    const el = $('#mood');
    el.className = 'mood' + (label === 'Listening' ? ' listening' : label === 'Speaking' || label === 'Typing' ? ' speaking' : '');
    el.textContent = label && label !== '—' ? 'Agent · ' + label : 'Agent —';
  }

  function renderTimer() {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    $('#timer').textContent = `${m}:${s}`;
  }

  function startTimer() {
    seconds = 0;
    renderTimer();
    clearInterval(timer);
    timer = setInterval(() => { seconds += 1; renderTimer(); }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
  }

  function setFlow(active) {
    document.querySelectorAll('#flow li').forEach((li, i) => {
      li.classList.toggle('done', i < active);
      li.classList.toggle('active', i === active);
    });
  }

  function scrollTranscript() {
    const box = $('#transcript');
    box.scrollTop = box.scrollHeight;
  }

  function emptyTranscript() {
    sawMessage = false;
    streamEl = null;
    streamBuf = '';
    const box = $('#transcript');
    box.replaceChildren();
    const empty = document.createElement('div');
    empty.className = 'empty';
    const title = document.createElement('b');
    title.textContent = 'Ready to talk to the agent';
    const copy = document.createElement('span');
    copy.textContent = ' Start a voice chat, or type a message. The transcript appears here as the conversation happens.';
    empty.append(title, copy);
    box.append(empty);
  }

  function addMsg(role, text) {
    const box = $('#transcript');
    const empty = box.querySelector('.empty');
    if (empty) empty.remove();
    const row = document.createElement('div');
    row.className = 'msg ' + (role === 'user' ? 'p' : 'a');
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = role === 'user' ? 'You' : 'Agent';
    const body = document.createElement('span');
    body.dataset.body = '1';
    body.textContent = text;
    row.append(who, body);
    box.append(row);
    scrollTranscript();
    return row;
  }

  function lastBody(role) {
    const nodes = $('#transcript').querySelectorAll('.msg.' + (role === 'user' ? 'p' : 'a') + ' [data-body]');
    return nodes.length ? nodes[nodes.length - 1] : null;
  }

  function updateControls() {
    const u = selected();
    const voiceLive = Boolean(conversation && sessionKind === 'voice');
    const canChat = Boolean(u && u.chatEnabled);
    $('#voiceBtn').disabled = connecting || voiceLive || !canChat;
    $('#voiceBtn').textContent = voiceLive ? 'Voice connected' : (connecting && sessionKind === 'voice' ? 'Connecting…' : 'Start voice chat');
    $('#endBtn').disabled = !conversation && !connecting;
    $('#muteMic').disabled = !voiceLive;
    if (!voiceLive) $('#muteMic').checked = false;
    $('#chatInput').disabled = connecting || !canChat;
    $('#sendBtn').disabled = $('#chatInput').disabled;
    $('#chatInput').placeholder = canChat ? 'Type a message to the agent' : 'Add an agent ID in the admin to chat';
    $('#startDemo').disabled = !canChat;
    $('#startDemo').textContent = canChat ? 'Start live conversation' : 'Agent not linked yet';
  }

  function hooks(gen) {
    return {
      onConnect() {
        if (gen !== generation) return;
        connecting = false;
        setLive(true, 'Live');
        startTimer();
        setFlow(2);
        setMode('Listening');
        updateControls();
        if (connectWait) {
          const done = connectWait;
          connectWait = null;
          done();
        }
      },
      onDisconnect(details) {
        if (gen !== generation) return;
        conversation = null;
        sessionKind = null;
        connecting = false;
        stopTimer();
        setWave(false);
        setLive(false, 'Ready');
        setMode('—');
        updateControls();
        const agent = document.querySelector('.node[data-node="agent"]');
        if (agent) agent.classList.remove('ping');
        if (details && details.reason === 'error' && details.message) showChatError(details.message);
      },
      onError(message) {
        if (gen !== generation) return;
        showChatError(typeof message === 'string' && message ? message : 'The agent connection hit an error.');
      },
      onModeChange(prop) {
        if (gen !== generation || !prop) return;
        const speaking = prop.mode === 'speaking';
        setWave(speaking);
        setMode(speaking ? 'Speaking' : 'Listening');
      },
      onStatusChange(prop) {
        if (gen !== generation || !prop) return;
        if (prop.status === 'connecting') setLive(false, 'Connecting');
        if (prop.status === 'connected') setLive(true, 'Live');
        if (prop.status === 'disconnected') setLive(false, 'Ready');
      },
      onAgentTyping() {
        if (gen !== generation) return;
        setMode('Typing');
      },
      onMessage(props) {
        if (gen !== generation || !props) return;
        const text = String(props.message || '').trim();
        if (!text) return;
        const role = props.role === 'user' || props.source === 'user' ? 'user' : 'agent';
        if (role === 'user' && pendingUser && text === pendingUser) {
          pendingUser = '';
          return;
        }
        if (role === 'agent' && streamEl) {
          streamEl.querySelector('[data-body]').textContent = text;
          streamEl = null;
          streamBuf = '';
          scrollTranscript();
          return;
        }
        const last = lastBody(role);
        if (last && last.textContent === text) return;
        addMsg(role, text);
      },
      onAgentChatResponsePart(part) {
        if (gen !== generation || !part || typeof part !== 'object') return;
        const text = typeof part.text === 'string' ? part.text : '';
        if (part.type === 'start') {
          streamBuf = '';
          streamEl = addMsg('agent', '…');
        } else if (part.type === 'delta') {
          streamBuf += text;
          if (!streamEl) streamEl = addMsg('agent', streamBuf || '…');
          else streamEl.querySelector('[data-body]').textContent = streamBuf || '…';
          scrollTranscript();
        } else if (part.type === 'stop' && streamEl) {
          streamEl.querySelector('[data-body]').textContent = streamBuf || text || '…';
          streamEl = null;
          streamBuf = '';
        }
      },
      onAgentResponseCorrection(props) {
        if (gen !== generation || !props) return;
        const corrected = props.corrected_agent_response || props.correctedAgentResponse;
        if (!corrected) return;
        const last = lastBody('agent');
        if (last) last.textContent = corrected;
      }
    };
  }

  function humanError(err) {
    if (!err) return 'Something went wrong.';
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return 'Microphone access was blocked. Allow the mic to talk, or type a message instead.';
    }
    if (err.name === 'NotFoundError') return 'No microphone was found. You can still type a message.';
    return err.message || 'Something went wrong.';
  }

  async function endSession() {
    generation += 1;
    if (cancelConnect) {
      const cancel = cancelConnect;
      cancelConnect = null;
      connectWait = null;
      cancel();
    }
    const current = conversation;
    conversation = null;
    sessionKind = null;
    connecting = false;
    pendingUser = '';
    streamEl = null;
    stopTimer();
    setWave(false);
    setLive(false, 'Ready');
    setMode('—');
    const agent = document.querySelector('.node[data-node="agent"]');
    if (agent) agent.classList.remove('ping');
    updateControls();
    if (current) {
      try { await current.endSession(); } catch (e) {}
    }
  }

  function waitForConnect() {
    return new Promise(resolve => {
      const timerId = setTimeout(() => resolve('timeout'), 20000);
      connectWait = () => { clearTimeout(timerId); resolve('ok'); };
      cancelConnect = () => { clearTimeout(timerId); resolve('cancelled'); };
    });
  }

  async function startVoice() {
    const u = selected();
    if (!u || connecting || starting) return false;
    if (!u.chatEnabled) {
      showChatError('Add an agent ID for this use case in the admin before starting a chat.');
      return false;
    }
    starting = true;
    try {
      await endSession();
      const gen = generation;
      connecting = true;
      sessionKind = 'voice';
      showChatError('');
      setLive(false, 'Connecting');
      setFlow(1);
      updateControls();
      try {
        const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
        probe.getTracks().forEach(track => track.stop());
        if (gen !== generation) return false;
        const cred = await api('/api/conversation', { method: 'POST', body: JSON.stringify({ id: u.id, mode: 'voice' }) });
        if (gen !== generation) return false;
        const ready = waitForConnect();
        conversation = await sdk().startSession({ conversationToken: cred.token, ...hooks(gen) });
        if (gen !== generation) {
          try { await conversation.endSession(); } catch (e) {}
          conversation = null;
          return false;
        }
        const result = await ready;
        if (result === 'timeout' && gen === generation) showChatError('The agent is taking longer than usual to connect. You can still try sending a message.');
        const node = document.querySelector('.node[data-node="agent"]');
        if (node && gen === generation) node.classList.add('ping');
        return gen === generation;
      } catch (err) {
        if (gen !== generation) return false;
        conversation = null;
        sessionKind = null;
        if (cancelConnect) cancelConnect();
        showChatError(humanError(err));
        setLive(false, 'Ready');
        return false;
      } finally {
        if (gen === generation) {
          connecting = false;
          updateControls();
        }
      }
    } finally {
      starting = false;
    }
  }

  async function startText() {
    const u = selected();
    if (!u || connecting || starting) return false;
    if (conversation) return true;
    if (!u.chatEnabled) {
      showChatError('Add an agent ID for this use case in the admin before starting a chat.');
      return false;
    }
    const gen = generation;
    connecting = true;
    sessionKind = 'text';
    showChatError('');
    setLive(false, 'Connecting');
    setFlow(1);
    updateControls();
    try {
      const cred = await api('/api/conversation', { method: 'POST', body: JSON.stringify({ id: u.id, mode: 'text' }) });
      if (gen !== generation) return false;
      const ready = waitForConnect();
      conversation = await sdk().startSession({ signedUrl: cred.signedUrl, textOnly: true, ...hooks(gen) });
      if (gen !== generation) {
        try { await conversation.endSession(); } catch (e) {}
        conversation = null;
        return false;
      }
      const result = await ready;
      if (result !== 'ok') {
        if (gen === generation && result === 'timeout') showChatError('The agent took too long to connect.');
        return false;
      }
      return true;
    } catch (err) {
      if (gen !== generation) return false;
      conversation = null;
      sessionKind = null;
      if (cancelConnect) cancelConnect();
      showChatError(humanError(err));
      setLive(false, 'Ready');
      return false;
    } finally {
      if (gen === generation) {
        connecting = false;
        updateControls();
      }
    }
  }

  async function sendText(text) {
    if (!text || connecting) return;
    const u = selected();
    if (!u || !u.chatEnabled) {
      showChatError('Add an agent ID for this use case in the admin before chatting.');
      return;
    }
    if (!conversation) {
      const ok = await startText();
      if (!ok || !conversation) return;
    }
    pendingUser = text;
    addMsg('user', text);
    try {
      if (typeof conversation.sendUserActivity === 'function') conversation.sendUserActivity();
      conversation.sendUserMessage(text);
    } catch (err) {
      showChatError(humanError(err));
    }
  }

  function renderCards() {
    const grid = $('#ucGrid');
    grid.replaceChildren();
    if (!useCases.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-cases';
      empty.textContent = 'No use cases yet. Add them on the admin page.';
      grid.append(empty);
      return;
    }
    useCases.forEach((u, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'usecase';
      button.dataset.id = u.id;
      button.setAttribute('aria-pressed', String(u.id === selectedId));
      const ico = document.createElement('span');
      ico.className = 'uc-ico';
      ico.innerHTML = svg(iconFor(u, i));
      const txt = document.createElement('span');
      txt.className = 'uc-txt';
      const strong = document.createElement('strong');
      strong.textContent = u.title;
      const cats = document.createElement('small');
      cats.className = 'uc-cats';
      cats.textContent = categoryLabels(u.categories).join(' · ');
      const small = document.createElement('small');
      small.textContent = u.description;
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = directionLabel(u.direction);
      txt.append(strong, tag, cats, small);
      const kbd = document.createElement('kbd');
      kbd.textContent = String(i + 1);
      button.append(ico, txt, kbd);
      button.addEventListener('click', () => select(u.id));
      grid.append(button);
    });
    const empty = document.createElement('div');
    empty.id = 'filterEmpty';
    empty.className = 'empty-cases';
    empty.hidden = true;
    empty.textContent = 'No agents match these filters.';
    grid.append(empty);
    applyFilters();
  }

  function markSelected() {
    document.querySelectorAll('#ucGrid .usecase').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.id === selectedId));
    });
  }

  function renderDetails() {
    const u = selected();
    const count = $('#trustCount');
    if (count) count.textContent = useCases.length === 1 ? '1 use case' : `${useCases.length} use cases`;
    renderChips();
    if (!u) {
      $('#demoTitle').textContent = 'Choose a use case';
      $('#demoTag').textContent = 'Add a title, description, and agent ID in the admin.';
      $('#ptName').textContent = 'No use case yet';
      $('#ptMeta').textContent = '';
      $('#ucDesc').textContent = '';
      $('#connectCopy').textContent = 'Use cases added in the admin show up here automatically.';
      $('#connectHint').textContent = '';
      $('#valueTitle').textContent = 'What a live agent delivers';
      $('#kpis').replaceChildren();
      $('#archNote').textContent = 'Add a use case to connect a live agent.';
      updateControls();
      return;
    }
    $('#demoTitle').textContent = u.title;
    $('#demoTag').textContent = u.description;
    $('#ptName').textContent = u.title;
    $('#ptMeta').textContent = [directionLabel(u.direction), ...categoryLabels(u.categories)].filter(Boolean).join(' · ');
    $('#ucDesc').textContent = u.description;
    $('#connectCopy').textContent = u.description;
    $('#connectHint').textContent = u.chatEnabled ? 'Live ElevenLabs agent' : 'Add an agent ID to chat';
    $('#valueTitle').textContent = 'What ' + u.title.toLowerCase() + ' delivers';
    const kpis = $('#kpis');
    kpis.replaceChildren(
      kpi(u.chatEnabled ? 'Live' : '—', u.chatEnabled ? 'In-browser chat with this ElevenLabs agent' : 'Add an agent ID to enable live chat'),
      kpi('Voice', 'Speak with the agent in the browser'),
      kpi('24×7', categoryLabels(u.categories).join(' · ') || u.title)
    );
    $('#archNote').textContent = `The “${u.title}” conversation runs on its ElevenLabs agent in the browser on this page.`;
    const liveNodes = new Set(['patient', 'telephony', 'agent']);
    document.querySelectorAll('.node').forEach(node => {
      const on = liveNodes.has(node.dataset.node);
      node.classList.toggle('on', on);
      node.classList.toggle('off', !on);
    });
    updateControls();
  }

  function kpi(value, label) {
    const wrap = document.createElement('div');
    wrap.className = 'kpi';
    const b = document.createElement('b');
    b.textContent = value;
    const span = document.createElement('span');
    span.textContent = label;
    wrap.append(b, span);
    return wrap;
  }

  function renderChips() {
    const box = $('#demoChips');
    const ask = $('#askChips');
    box.replaceChildren();
    ask.replaceChildren();
    const u = selected();
    if (u) {
      [directionLabel(u.direction), ...categoryLabels(u.categories), u.chatEnabled ? 'Live ElevenLabs agent' : 'Agent not linked'].filter(Boolean).forEach(text => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = text;
        box.append(chip);
      });
    }
    useCases.slice(0, 6).forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = item.title;
      button.addEventListener('click', () => {
        $('#askInput').value = item.title;
        routeAsk(item.title);
      });
      ask.append(button);
    });
  }

  function renderBenefits() {
    $('#benefits').replaceChildren(...BENEFITS.map(([name, title, copy]) => {
      const card = document.createElement('div');
      card.className = 'benefit';
      const ico = document.createElement('span');
      ico.className = 'bi';
      ico.innerHTML = svg(name);
      const b = document.createElement('b');
      b.textContent = title;
      const p = document.createElement('p');
      p.textContent = copy;
      card.append(ico, b, p);
      return card;
    }));
  }

  function renderFlow() {
    const list = $('#flow');
    list.replaceChildren();
    STEPS.forEach((step, i) => {
      const li = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.textContent = String(i + 1);
      li.append(dot, document.createTextNode(step));
      list.append(li);
    });
    setFlow(selected() ? 0 : -1);
  }

  async function select(id, opts) {
    if (!id && !selectedId) {
      markSelected();
      renderDetails();
      return;
    }
    const keepTranscript = opts && opts.keepTranscript;
    if (id === selectedId && keepTranscript) {
      markSelected();
      renderDetails();
      return;
    }
    if (conversation || connecting) await endSession();
    selectedId = id;
    markSelected();
    renderDetails();
    if (!keepTranscript) {
      emptyTranscript();
      renderFlow();
      setFlow(selected() ? 0 : -1);
      showChatError('');
      setMode('—');
      seconds = 0;
      renderTimer();
      setLive(false, 'Ready');
    }
  }

  function score(u, query) {
    const hay = `${u.title} ${directionLabel(u.direction)} ${categoryLabels(u.categories).join(' ')} ${u.description}`.toLowerCase();
    return query.toLowerCase().split(/[^a-z0-9+]+/).filter(w => w.length > 2).reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
  }

  function routeAsk(query) {
    const q = String(query || '').trim();
    if (!q) return;
    const exact = useCases.find(u => u.title.toLowerCase() === q.toLowerCase());
    let best = exact || null;
    let bestScore = exact ? 99 : 0;
    if (!best) {
      useCases.forEach(u => {
        const n = score(u, q);
        if (n > bestScore) { bestScore = n; best = u; }
      });
    }
    if (!best) {
      $('#askAns').textContent = 'No matching use case yet. Add one in the admin, or pick a card above.';
      return;
    }
    $('#directionFilter').value = best.direction || '';
    const categories = best.categories || [];
    $('#categoryFilter').value = categories.includes($('#categoryFilter').value) ? $('#categoryFilter').value : (categories[0] || '');
    applyFilters();
    select(best.id);
    $('#askAns').textContent = '';
    const ans = document.createElement('span');
    ans.append('Showing ');
    const b = document.createElement('b');
    b.textContent = best.title;
    ans.append(b, '.');
    $('#askAns').append(ans);
    $('#demo').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#chatInput').focus({ preventScroll: true });
  }

  async function loadUseCases(opts) {
    const data = await api('/api/use-cases');
    const next = Array.isArray(data.useCases) ? data.useCases : [];
    const keep = opts && opts.preserve && selectedId && next.some(u => u.id === selectedId);
    useCases = next;
    if (data.filters) filters = data.filters;
    fillFilterSelects();
    if (!keep) {
      if (conversation || connecting) await endSession();
      emptyTranscript();
      showChatError('');
    }
    renderCards();
    const visible = visibleUseCases();
    if (!keep || (selectedId && !visible.some(u => u.id === selectedId))) {
      selectedId = visible[0] ? visible[0].id : null;
    }
    markSelected();
    renderDetails();
    if (!keep) {
      renderFlow();
      setFlow(selected() ? 0 : -1);
    }
  }

  function buildWave(el, n) {
    for (let i = 0; i < n; i += 1) {
      const bar = document.createElement('i');
      bar.style.setProperty('--h', (5 + Math.abs(Math.sin(i * 0.58) * 19) + Math.abs(Math.cos(i * 0.19) * 6)) + 'px');
      bar.style.setProperty('--d', ((i % 9) * -0.07) + 's');
      el.append(bar);
    }
  }

  buildWave($('#callWave'), 40);
  renderBenefits();
  renderFlow();
  emptyTranscript();
  renderTimer();

  $('#chatForm').addEventListener('submit', async e => {
    e.preventDefault();
    const text = $('#chatInput').value.trim();
    if (!text) return;
    $('#chatInput').value = '';
    await sendText(text);
  });
  $('#chatInput').addEventListener('input', () => {
    if (conversation && typeof conversation.sendUserActivity === 'function') conversation.sendUserActivity();
  });
  $('#voiceBtn').addEventListener('click', () => startVoice());
  $('#endBtn').addEventListener('click', () => endSession());
  $('#muteMic').addEventListener('change', () => {
    if (conversation && sessionKind === 'voice' && typeof conversation.setMicMuted === 'function') {
      conversation.setMicMuted($('#muteMic').checked);
    }
  });
  $('#startDemo').addEventListener('click', async () => {
    $('#demo').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (selected() && selected().chatEnabled) await startVoice();
    else showChatError('Add an agent ID for this use case in the admin before starting a chat.');
  });
  $('#directionFilter').addEventListener('change', async () => {
    const visible = applyFilters();
    if (!visible.some(u => u.id === selectedId)) await select(visible[0] ? visible[0].id : null);
    else markSelected();
  });
  $('#categoryFilter').addEventListener('change', async () => {
    const visible = applyFilters();
    if (!visible.some(u => u.id === selectedId)) await select(visible[0] ? visible[0].id : null);
    else markSelected();
  });
  $('#askForm').addEventListener('submit', e => {
    e.preventDefault();
    routeAsk($('#askInput').value);
  });
  $('#resetBtn').addEventListener('click', async () => {
    if (typeof window.resetUseCaseOrder === 'function') window.resetUseCaseOrder();
    await endSession();
    $('#directionFilter').value = '';
    $('#categoryFilter').value = '';
    applyFilters();
    const visible = visibleUseCases();
    selectedId = visible[0] ? visible[0].id : null;
    $('#askInput').value = '';
    $('#askAns').textContent = '';
    showChatError('');
    renderCards();
    renderDetails();
    emptyTranscript();
    renderFlow();
    setFlow(selected() ? 0 : -1);
    seconds = 0;
    renderTimer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStatus('Demo reset.');
  });
  $('#presenterBtn').addEventListener('click', () => {
    const on = document.body.classList.toggle('presenter');
    $('#presenterBtn').setAttribute('aria-pressed', String(on));
    if (on) $('#demo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadUseCases({ preserve: true }).catch(() => {});
    }
  });

  loadUseCases().catch(err => {
    const grid = $('#ucGrid');
    grid.replaceChildren();
    const empty = document.createElement('div');
    empty.className = 'empty-cases';
    empty.textContent = err.message || 'Could not load use cases. Start the server with npm start.';
    grid.append(empty);
  });
})();
