/* Tutoring site engine.
   One file runs every student page. Content comes from site/data/<student>/*.json.
   Plain JavaScript, no frameworks, no build step. */
(function () {
  'use strict';

  var STUDENT_ID = window.STUDENT_ID;
  var DATA = '../data/' + STUDENT_ID + '/';
  var S = { student: null, weeks: {}, lang: 'en', cleanup: null };
  var main;

  /* ---------------- helpers ---------------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (arguments.length > 2) { for (var a = 1; a < arguments.length; a++) add(el, arguments[a]); return; }
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  function key(k) { return 'tut_' + STUDENT_ID + '_' + k; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtTime(sec) { sec = Math.round(sec); return Math.floor(sec / 60) + ':' + pad(sec % 60); }

  /* Turn "3/4" into a stacked fraction. Everything stays as text nodes (safe). */
  function rich(str) {
    var frag = document.createDocumentFragment();
    var re = /(\d+)\/(\d+)/g, last = 0, m;
    str = String(str);
    while ((m = re.exec(str))) {
      if (m.index > last) frag.appendChild(document.createTextNode(str.slice(last, m.index)));
      frag.appendChild(h('span', { class: 'frac', 'aria-label': m[1] + ' over ' + m[2] }, h('span', null, m[1]), h('span', null, m[2])));
      last = re.lastIndex;
    }
    if (last < str.length) frag.appendChild(document.createTextNode(str.slice(last)));
    return frag;
  }

  /* ---------------- language ---------------- */
  var UI = {
    en: {
      hi: 'Hi {n}!', thisWeek: 'This Week', anytime: 'Practice Anytime', past: 'Past Weeks', print: 'Print this week',
      back: '← Back', start: 'Start', next: 'Next →', again: 'Play again', check: 'Check', hear: '🔊 Hear it', slow: '🐢 Slow',
      letter: '💡 Letter hint', practice: 'Practice mode', test: 'Test mode', all: 'All words', words: 'words',
      notQuite: 'Not quite. The answer is:', wordIs: 'Not quite. The word is:', tryLater: 'This word will come back later.',
      allCorrect: 'You spelled every word correctly!', testDone: 'Test finished!', yourScore: 'Your score',
      missedWords: 'Words to practise', know: '✅ I know it', learning: '😅 Still learning', shuffle: '🔀 Shuffle',
      tapFlip: 'Tap the card to flip it', knowAll: 'You know all the cards!', practiseLearning: 'Practise the "still learning" cards',
      time: 'Time', best: 'Best time', newBest: 'New best time!', mistakes: 'Mistakes', points: 'points', streak: 'Streak',
      timeUp: "Time's up!", correctOf: 'correct', question: 'Question', of: 'of', finish: 'Finish',
      kwFirst: 'Key words first', ready: "I'm ready to read →", toQs: 'Answer the questions →', readMe: '🔊 Read to me',
      writeTask: 'Write a complete sentence', checklist: 'Checklist', capital: 'Starts with a capital letter', stop: 'Ends with a full stop',
      noNames: 'No names', sense: 'It makes sense (tick this yourself)', done: "I'm finished", model: 'Example answer',
      hint: '💡 Hint', step1: 'Show Step 1', nextStep: 'Show next step', answer: 'Answer', why: '✅ WHY', step: 'Step',
      prev: '← Previous', tryPaper: 'Try it on paper first. Then check each step.',
      tables: 'Times Tables Sprint', chooseTables: 'Choose your tables', accRound: '1. Accuracy round (no timer)', speedRound: '2. Speed round (60 seconds)',
      accFirst: 'Get the answers right first. Then go for speed!', spellingBank: 'All my spelling words', cardsBank: 'All my key words',
      noWeek: 'Your teacher will add this week soon.', loadError: 'Sorry, this page could not load. Check your internet and try again.',
      typeHere: 'Type the word here', saved: 'Your score is saved.', week: 'Week', firstTry: 'right first time',
      groups: 'Choose a list'
    },
    zh: {
      hi: '你好，{n}！', thisWeek: '本周', anytime: '随时练习', past: '以前的周', print: '打印本周',
      back: '← 返回', start: '开始', next: '下一个 →', again: '再玩一次', check: '检查', hear: '🔊 听', slow: '🐢 慢速',
      letter: '💡 字母提示', practice: '练习模式', test: '考试模式', all: '全部单词', words: '个词',
      notQuite: '差一点！正确答案是：', wordIs: '差一点！这个词是：', tryLater: '这个词等一下会再出现。',
      allCorrect: '你把所有单词都拼对了！', testDone: '考试完成！', yourScore: '你的分数',
      missedWords: '要多练习的词', know: '✅ 我会了', learning: '😅 还在学', shuffle: '🔀 打乱',
      tapFlip: '点卡片翻面', knowAll: '你全部都会了！', practiseLearning: '练习“还在学”的卡片',
      time: '时间', best: '最好成绩', newBest: '新纪录！', mistakes: '错误', points: '分', streak: '连对',
      timeUp: '时间到！', correctOf: '题答对', question: '第', of: '题，共', finish: '完成',
      kwFirst: '先学关键词', ready: '我准备好读了 →', toQs: '去回答问题 →', readMe: '🔊 读给我听',
      writeTask: '写一个完整的句子', checklist: '检查表', capital: '句首是大写字母', stop: '句尾有句号',
      noNames: '没有写名字', sense: '句子通顺（自己打勾）', done: '我写完了', model: '参考答案',
      hint: '💡 提示', step1: '显示第 1 步', nextStep: '显示下一步', answer: '答案', why: '✅ 为什么', step: '第几步',
      prev: '← 上一题', tryPaper: '先在纸上做，再一步一步检查。',
      tables: '乘法口诀冲刺', chooseTables: '选择乘法表', accRound: '1. 准确练习（不计时）', speedRound: '2. 速度挑战（60 秒）',
      accFirst: '先做对，再做快！', spellingBank: '我所有的拼写词', cardsBank: '我所有的关键词',
      noWeek: '老师很快会添加本周内容。', loadError: '对不起，页面没有打开。请检查网络再试一次。',
      typeHere: '在这里输入单词', saved: '你的成绩已保存。', week: '周', firstTry: '第一次就对',
      groups: '选择单词表'
    }
  };
  function bilingual() { return !!(S.student && S.student.bilingual); }
  function T(k) { var L = (bilingual() && S.lang === 'zh') ? UI.zh : UI.en; return L[k] != null ? L[k] : UI.en[k]; }
  /* Pick text for a value that may be "string" or {en, zh}. */
  function tx(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return (bilingual() && S.lang === 'zh' && v.zh) ? v.zh : (v.en || '');
  }
  /* Instructions, hints and explanations: in 中文 mode show Chinese with English underneath. */
  function bi(v, isRich) {
    if (v == null) return null;
    if (typeof v === 'string') return isRich ? rich(v) : v;
    if (bilingual() && S.lang === 'zh' && v.zh) {
      return h('span', null, isRich ? rich(v.zh) : v.zh, h('span', { class: 'zh-sub', lang: 'en' }, isRich ? rich(v.en) : v.en));
    }
    return isRich ? rich(v.en) : v.en;
  }
  function praise() {
    var en = ['Great job!', 'Well done!', 'Brilliant!', 'You got it!', 'Super!', 'Amazing work!', 'Fantastic!', 'Yes! Keep going!'];
    var zh = ['太棒了！', '做得好！', '真厉害！', '答对了！', '非常好！', '了不起！', '好极了！', '对了！继续加油！'];
    var i = Math.floor(Math.random() * en.length);
    return (bilingual() && S.lang === 'zh') ? zh[i] + ' ' + en[i] : en[i];
  }

  /* "By completing this I can now..." line at the end of every activity */
  function canNow(a) {
    if (!a || !a.canNow) return null;
    return h('div', { class: 'box teach', style: 'text-align:left' }, h('b', null, '🌟 '), bi(a.canNow));
  }

  /* ---------------- speech ---------------- */
  var voices = [];
  function loadVoices() { try { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch (e) { voices = []; } }
  if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function pickVoice() {
    var want = (S.student && S.student.voice) || 'en-GB';
    var norm = function (l) { return String(l || '').replace('_', '-'); };
    return voices.filter(function (v) { return norm(v.lang) === want; })[0] ||
      voices.filter(function (v) { return /^en-/.test(norm(v.lang)); })[0] || null;
  }
  function say(text, slow) {
    if (!window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-GB';
      u.rate = slow ? 0.5 : 0.9;
      speechSynthesis.speak(u);
    } catch (e) { /* no speech on this device */ }
  }
  function stopSpeech() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }

  /* ---------------- scores ---------------- */
  var QKEY = key('scoreQueue');
  function localTime() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function record(activity, week, score, total, seconds, missed) {
    var q = lsGet(QKEY, []);
    q.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      time: localTime(), student: S.student.name, week: week, activity: activity,
      score: score, total: total, seconds: Math.round(seconds || 0), missed: (missed || []).join(', ')
    });
    lsSet(QKEY, q);
    flush();
  }
  var flushing = false;
  /* Google Form method: each score becomes one form answer, fields separated by tabs. */
  function formLine(r) {
    return [r.time, r.student, r.week, r.activity, r.score, r.total, r.seconds, r.missed, r.id]
      .map(function (v) { return String(v == null ? '' : v).replace(/[\t\n\r]+/g, ' '); }).join('\t');
  }
  function sendBatch(q) {
    var form = window.SCORE_FORM;
    if (form && form.url && form.entry) {
      return Promise.all(q.map(function (r) {
        var body = new URLSearchParams(); body.append(form.entry, formLine(r));
        return fetch(form.url, { method: 'POST', mode: 'no-cors', body: body });
      }));
    }
    return fetch(window.SCORE_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(q) });
  }
  function flush() {
    var ready = window.SCORE_URL || (window.SCORE_FORM && window.SCORE_FORM.url);
    if (!ready || flushing || navigator.onLine === false) return;
    var q = lsGet(QKEY, []);
    if (!q.length) return;
    flushing = true;
    sendBatch(q)
      .then(function () {
        var sent = {}; q.forEach(function (r) { sent[r.id] = 1; });
        lsSet(QKEY, lsGet(QKEY, []).filter(function (r) { return !sent[r.id]; }));
      })
      .catch(function () { /* offline: keep for later */ })
      .then(function () { flushing = false; });
  }
  window.addEventListener('online', flush);

  /* ---------------- data ---------------- */
  function getJSON(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function loadWeek(id) {
    if (S.weeks[id]) return Promise.resolve(S.weeks[id]);
    return getJSON(DATA + id + '.json').then(function (w) { S.weeks[id] = w; return w; });
  }
  function weekIds() { return (S.student.weeks || []).slice().sort().reverse(); }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function weekLabel(id) {
    var p = id.split('-'), a = new Date(+p[0], +p[1] - 1, +p[2]), b = new Date(a.getTime() + 6 * 864e5);
    if (bilingual() && S.lang === 'zh') {
      return (a.getMonth() + 1) + '月' + a.getDate() + '日至' + (b.getMonth() === a.getMonth() ? '' : (b.getMonth() + 1) + '月') + b.getDate() + '日';
    }
    return a.getDate() + (a.getMonth() === b.getMonth() ? '' : ' ' + MONTHS[a.getMonth()]) + ' to ' + b.getDate() + ' ' + MONTHS[b.getMonth()];
  }

  /* ---------------- frame + router ---------------- */
  var ICONS = { spelling: '🔤', flashcards: '🃏', match: '🧩', quiz: '⚡', reading: '📖', guided: '🧮' };

  function frame() {
    document.body.appendChild(h('header', { class: 'topbar' },
      h('div', { class: 'hello', id: 'hello' }),
      bilingual() ? h('div', { class: 'lang', role: 'group', 'aria-label': 'Language' },
        h('button', { id: 'lang-en', onclick: function () { setLang('en'); } }, 'EN'),
        h('button', { id: 'lang-zh', onclick: function () { setLang('zh'); } }, '中文')) : null));
    main = h('main', { class: 'wrap', id: 'main' });
    document.body.appendChild(main);
    paintFrame();
  }
  function paintFrame() {
    document.getElementById('hello').textContent = T('hi').replace('{n}', S.student.name);
    if (bilingual()) {
      document.getElementById('lang-en').className = S.lang === 'en' ? 'on' : '';
      document.getElementById('lang-zh').className = S.lang === 'zh' ? 'on' : '';
    }
  }
  function setLang(l) { S.lang = l; lsSet(key('lang'), l); paintFrame(); route(); }

  function show() {
    clear(main);
    for (var i = 0; i < arguments.length; i++) add(main, arguments[i]);
  }
  function backLink(href) { return h('a', { class: 'back', href: href || '#/' }, T('back')); }

  function route() {
    if (S.cleanup) { try { S.cleanup(); } catch (e) {} S.cleanup = null; }
    stopSpeech();
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    window.scrollTo(0, 0);
    if (parts[0] === 'w' && parts[1]) {
      return loadWeek(parts[1]).then(function (w) {
        if (parts[2]) renderActivity(w, parts[2]); else renderWeek(w, false);
      }).catch(renderError);
    }
    if (parts[0] === 'tables') return renderTables();
    if (parts[0] === 'bank') return renderBank(parts[1]);
    renderHome();
  }
  function renderError() { show(h('div', { class: 'card empty' }, h('p', null, T('loadError')), backLink())); }

  /* ---------------- home ---------------- */
  function weekBlock(w) {
    var tiles = h('div', { class: 'tiles' });
    (w.activities || []).forEach(function (a) {
      var icon = a.icon || ICONS[a.type] || '⭐';
      tiles.appendChild(h('a', { class: 'tile', href: '#/w/' + w.week + '/' + a.id },
        h('span', { class: 'ico', 'aria-hidden': 'true' }, icon), h('span', null, tx(a.title)),
        a.subtitle ? h('span', { class: 'sub' }, tx(a.subtitle)) : null));
    });
    return h('div', null,
      h('div', { class: 'card week-head' },
        h('h2', null, tx(w.title)),
        h('p', { class: 'muted' }, weekLabel(w.week)),
        w.message ? h('div', { class: 'box teach' }, bi(w.message)) : null,
        h('div', { class: 'row' }, h('a', { class: 'btn ghost', href: 'print.html?w=' + w.week, target: '_blank', rel: 'noopener' }, '🖨️ ' + T('print')))),
      tiles);
  }
  function renderHome() {
    var ids = weekIds();
    var thisWeek = h('section', null, h('h2', { class: 'section-title' }, '⭐ ' + T('thisWeek')));
    var past = h('section', null);
    if (!ids.length) thisWeek.appendChild(h('div', { class: 'card empty' }, T('noWeek')));
    else {
      var holder = h('div', null, h('p', { class: 'muted' }, '…'));
      thisWeek.appendChild(holder);
      loadWeek(ids[0]).then(function (w) { clear(holder); holder.appendChild(weekBlock(w)); }).catch(function () { clear(holder); holder.appendChild(h('p', null, T('loadError'))); });
      if (ids.length > 1) {
        past.appendChild(h('h2', { class: 'section-title' }, '📚 ' + T('past')));
        ids.slice(1).forEach(function (id) {
          var link = h('a', { class: 'list-link', href: '#/w/' + id }, h('span', null, weekLabel(id)), h('span', null, '→'));
          past.appendChild(link);
          loadWeek(id).then(function (w) { link.firstChild.textContent = weekLabel(id) + ': ' + tx(w.title); }).catch(function () {});
        });
      }
    }
    var anytime = h('section', null,
      h('h2', { class: 'section-title' }, '🏃 ' + T('anytime')),
      h('div', { class: 'tiles' },
        h('a', { class: 'tile', href: '#/tables' }, h('span', { class: 'ico' }, '✖️'), h('span', null, T('tables'))),
        h('a', { class: 'tile', href: '#/bank/spelling' }, h('span', { class: 'ico' }, '🔤'), h('span', null, T('spellingBank'))),
        h('a', { class: 'tile', href: '#/bank/cards' }, h('span', { class: 'ico' }, '🃏'), h('span', null, T('cardsBank')))));
    show(thisWeek, anytime, past);
  }
  function renderWeek(w) { show(backLink(), weekBlock(w)); }

  function activityHeader(a, backHref) {
    return [backLink(backHref), h('h1', null, (a.icon || ICONS[a.type] || '') + ' ' + tx(a.title)),
      a.intro ? h('div', { class: 'box teach' }, bi(a.intro)) : null];
  }
  function renderActivity(w, id) {
    var a = (w.activities || []).filter(function (x) { return x.id === id; })[0];
    if (!a) return renderError();
    var ctx = { week: w.week, name: tx(a.title), en: (typeof a.title === 'string' ? a.title : a.title.en), back: '#/' };
    var area = h('div');
    show(activityHeader(a, ctx.back), area);
    var fn = ACT[a.type];
    if (!fn) return area.appendChild(h('p', null, 'Unknown activity.'));
    fn(a, ctx, area);
  }

  /* ================= ACTIVITIES ================= */
  var ACT = {};

  /* ---------- 1. SPELLING ---------- */
  ACT.spelling = function (a, ctx, area) {
    var groups = a.groups || [];
    var chosen = 'all';
    function words() { return a.words.filter(function (w) { return chosen === 'all' || w.group === chosen; }); }
    function startScreen() {
      clear(area);
      var chips = h('div', { class: 'chips' });
      function paint() {
        clear(chips);
        [{ id: 'all', en: T('all') }].concat(groups).forEach(function (g) {
          var n = a.words.filter(function (w) { return g.id === 'all' || w.group === g.id; }).length;
          chips.appendChild(h('button', { class: 'chip' + (chosen === g.id ? ' on' : ''), style: 'padding:6px 14px',
            onclick: function () { chosen = g.id; paint(); } }, (g.id === 'all' ? g.en : tx(g)) + ' (' + n + ')'));
        });
      }
      paint();
      add(area, [
        groups.length ? h('div', { class: 'card' }, h('h3', null, T('groups')), chips) : null,
        h('div', { class: 'card' },
          h('div', { class: 'box teach' }, bi({ en: 'Practice mode: hear the word, type it, use hints. Missed words come back until you get them all right.', zh: '练习模式：听单词，输入，可以用提示。拼错的词会再出现，直到全部拼对。' })),
          h('div', { class: 'box teach' }, bi({ en: 'Test mode: like a real spelling test. No hints. Each word once. Your score is sent to your teacher.', zh: '考试模式：像真正的听写。没有提示，每个词一次。成绩会发给老师。' })),
          h('div', { class: 'row center' },
            h('button', { class: 'btn big', onclick: function () { run(false); } }, '✏️ ' + T('practice')),
            h('button', { class: 'btn big ghost', onclick: function () { run(true); } }, '📝 ' + T('test'))))
      ]);
    }
    function run(test) {
      var list = shuffle(words().slice());
      var total = list.length, queue = list.slice(), done = 0, cur = null, hintN = 0, waiting = false;
      var missed = [], results = [], t0 = Date.now();
      clear(area);
      var prog = h('div', { class: 'progress' }, h('div'));
      var stats = h('div', { class: 'stats' });
      var sentence = h('div', { class: 'box teach' });
      var hintBox = h('div', { class: 'hint-letters hidden' });
      var input = h('input', { type: 'text', class: 'spell-input', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: T('typeHere'), 'aria-label': T('typeHere') });
      var fb = h('div', { 'aria-live': 'polite' });
      var checkBtn = h('button', { class: 'btn big green', onclick: check }, T('check'));
      var hintBtn = test ? null : h('button', { class: 'btn yellow', onclick: letterHint }, T('letter'));
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); waiting ? next() : check(); } });
      add(area, h('div', { class: 'card' },
        h('div', { class: 'muted small' }, test ? '📝 ' + T('test') : '✏️ ' + T('practice')),
        prog, stats,
        h('div', { class: 'row center' },
          h('button', { class: 'btn big', onclick: function () { speak(false); } }, T('hear')),
          h('button', { class: 'btn ghost', onclick: function () { speak(true); } }, T('slow')), hintBtn),
        sentence, hintBox, input,
        h('div', { class: 'row center' }, checkBtn), fb));
      function speak(slow) { if (cur) say(cur.word + '. ' + (cur.sentence || '') + ' ' + cur.word + '.', slow); }
      function paintStats() {
        prog.firstChild.style.width = (100 * done / total) + '%';
        stats.textContent = '';
        add(stats, [h('span', null, done + ' / ' + total + ' ' + T('words')), !test && missed.length ? h('span', null, T('mistakes') + ': ' + missed.length) : null]);
      }
      function letterHint() {
        if (!cur || waiting) return;
        hintN = Math.min(hintN + 1, cur.word.length - 1);
        hintBox.classList.remove('hidden');
        hintBox.textContent = cur.word.split('').map(function (c, i) { return i < hintN ? c : '_'; }).join(' ');
        input.focus();
      }
      function next() {
        waiting = false; clear(fb); hintN = 0; hintBox.classList.add('hidden');
        if (!queue.length) return finish();
        cur = queue.shift();
        input.value = ''; input.disabled = false; checkBtn.disabled = false;
        clear(sentence);
        if (cur.sentence) {
          var blank = cur.sentence.replace(new RegExp('\\b' + cur.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'), '______');
          add(sentence, h('div', { class: 'q-text' }, blank));
        }
        if (!test && cur.zh && bilingual()) add(sentence, h('div', { class: 'small muted' }, '中文：' + cur.zh));
        paintStats();
        speak(false);
        input.focus();
      }
      function check() {
        if (waiting) return next();
        var ans = input.value.trim();
        if (!ans) { input.focus(); return; }
        var ok = ans.toLowerCase() === cur.word.toLowerCase();
        if (test) {
          results.push({ word: cur.word, typed: ans, ok: ok });
          done++; paintStats(); return next();
        }
        waiting = true; input.disabled = true; clear(fb);
        if (ok) {
          done++; paintStats();
          add(fb, h('div', { class: 'box ans pop' }, h('div', { class: 'praise' }, '⭐ ' + praise()), h('div', null, cur.word)));
        } else {
          if (missed.indexOf(cur.word) < 0) missed.push(cur.word);
          queue.push(cur);
          add(fb, h('div', { class: 'box bad shake' }, h('div', { class: 'oops' }, T('wordIs')), h('div', { class: 'spell-input' }, cur.word), h('div', { class: 'small' }, T('tryLater'))));
        }
        add(fb, h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: next }, T('next'))));
        fb.querySelector('button').focus();
      }
      function finish() {
        var secs = (Date.now() - t0) / 1000;
        clear(area);
        if (test) {
          var right = results.filter(function (r) { return r.ok; }).length;
          var wrong = results.filter(function (r) { return !r.ok; });
          record(ctx.en + ' (test)', ctx.week, right, total, secs, wrong.map(function (r) { return r.word; }));
          add(area, h('div', { class: 'card center' },
            h('h2', null, '🎉 ' + T('testDone')), h('div', { class: 'bigscore' }, right + ' / ' + total),
            h('p', { class: 'praise' }, right === total ? praise() : bi({ en: 'Good effort! Practise the words below.', zh: '很努力！练习下面的单词吧。' })),
            h('p', { class: 'small muted' }, T('saved')), canNow(a)));
          if (wrong.length) add(area, h('div', { class: 'card' }, h('h3', null, T('missedWords')),
            wrong.map(function (r) { return h('div', { class: 'box bad' }, h('b', null, r.word), h('span', { class: 'small' }, '  (' + r.typed + ')')); })));
        } else {
          add(area, h('div', { class: 'card center' }, h('h2', null, '🏆 ' + T('allCorrect')), h('p', { class: 'praise' }, praise()),
            missed.length ? h('div', { class: 'box hint' }, h('b', null, T('missedWords') + ': '), missed.join(', ')) : null, canNow(a)));
        }
        add(area, h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: startScreen }, T('again'))));
      }
      next();
    }
    startScreen();
  };

  /* ---------- 2. FLASHCARDS ---------- */
  ACT.flashcards = function (a, ctx, area) {
    function round(cards) {
      var deck = shuffle(cards.slice()), i = 0, know = [], learning = [], flipped = false;
      clear(area);
      var stats = h('div', { class: 'stats' });
      var prog = h('div', { class: 'progress' }, h('div'));
      var card = h('div', { class: 'flash', role: 'button', tabindex: '0', onclick: flip, onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } } });
      var btns = h('div', { class: 'row center' },
        h('button', { class: 'btn big red', onclick: function () { mark(false); } }, T('learning')),
        h('button', { class: 'btn big green', onclick: function () { mark(true); } }, T('know')));
      add(area, h('div', { class: 'card' }, prog, stats, card, btns,
        h('div', { class: 'row center' }, h('button', { class: 'btn ghost', onclick: function () { round(cards); } }, T('shuffle')))));
      function paint() {
        var c = deck[i];
        prog.firstChild.style.width = (100 * i / deck.length) + '%';
        stats.textContent = (i + 1) + ' / ' + deck.length + '   ✅ ' + know.length + '   😅 ' + learning.length;
        clear(card);
        card.className = 'flash' + (flipped ? ' back' : '');
        if (!flipped) {
          add(card, [h('div', { class: 'front' }, c.front),
            h('button', { class: 'btn ghost', style: 'margin-top:14px', onclick: function (e) { e.stopPropagation(); say(c.front); } }, T('hear')),
            h('div', { class: 'tap' }, T('tapFlip'))]);
        } else {
          add(card, [h('div', { class: 'meaning' }, c.back),
            bilingual() && (c.zh || c.zhBack) ? h('div', { class: 'zh', lang: 'zh' }, [c.zh, c.zhBack].filter(Boolean).join('：')) : null,
            h('div', { class: 'tap' }, T('tapFlip'))]);
        }
      }
      function flip() { flipped = !flipped; paint(); }
      function mark(k) {
        (k ? know : learning).push(deck[i]);
        i++; flipped = false;
        if (i >= deck.length) return end();
        paint();
      }
      function end() {
        clear(area);
        add(area, h('div', { class: 'card center' },
          h('h2', null, learning.length ? '👍 ' + know.length + ' / ' + deck.length : '🏆 ' + T('knowAll')),
          h('p', { class: 'praise' }, praise()), canNow(a),
          learning.length ? h('div', { class: 'box hint' }, h('b', null, T('learning') + ': '), learning.map(function (c) { return c.front; }).join(', ')) : null,
          h('div', { class: 'row center' },
            learning.length ? h('button', { class: 'btn big', onclick: function () { round(learning); } }, T('practiseLearning')) : null,
            h('button', { class: 'btn big ghost', onclick: function () { round(cards); } }, T('again')))));
      }
      paint();
    }
    round(a.cards);
  };

  /* ---------- 3. MATCH GAME ---------- */
  ACT.match = function (a, ctx, area) {
    var bestKey = key('best_' + ctx.week + '_' + a.id);
    function game() {
      var n = Math.min(a.size || 6, a.pairs.length);
      var pairs = shuffle(a.pairs.slice()).slice(0, n).map(function (p, idx) { return { id: idx, a: p.a, b: p.b }; });
      var left = shuffle(pairs.slice()), right = shuffle(pairs.slice());
      var sel = null, matched = 0, mistakes = 0, missed = [], t0 = Date.now(), timer;
      clear(area);
      var clock = h('span', null, '0:00');
      var best = lsGet(bestKey, null);
      var grid = h('div', { class: 'match-grid' });
      add(area, h('div', { class: 'card' },
        h('div', { class: 'stats' }, h('span', null, '⏱️ ', clock), h('span', null, best ? T('best') + ': ' + fmtTime(best) : ''), h('span', { id: 'mm' }, T('mistakes') + ': 0')),
        h('div', { style: 'height:12px' }), grid));
      var tiles = [];
      for (var r = 0; r < n; r++) {
        tiles.push(makeTile(left[r], 'term'));
        tiles.push(makeTile(right[r], 'def'));
      }
      tiles.forEach(function (t) { grid.appendChild(t.el); });
      timer = setInterval(function () { clock.textContent = fmtTime((Date.now() - t0) / 1000); }, 250);
      S.cleanup = function () { clearInterval(timer); };
      function makeTile(p, kind) {
        var t = { p: p, kind: kind, done: false };
        t.el = h('button', { class: 'mtile ' + kind, onclick: function () { tap(t); } }, kind === 'term' ? p.a : p.b);
        return t;
      }
      function tap(t) {
        if (t.done) return;
        if (!sel) { sel = t; t.el.classList.add('sel'); return; }
        if (sel === t) { t.el.classList.remove('sel'); sel = null; return; }
        if (sel.kind === t.kind) { sel.el.classList.remove('sel'); sel = t; t.el.classList.add('sel'); return; }
        var s = sel; sel = null; s.el.classList.remove('sel');
        if (s.p.id === t.p.id) {
          s.done = t.done = true;
          s.el.classList.add('done', 'pop'); t.el.classList.add('done', 'pop');
          matched++;
          if (matched === n) finish();
        } else {
          mistakes++;
          var term = s.kind === 'term' ? s.p.a : t.p.a;
          if (missed.indexOf(term) < 0) missed.push(term);
          document.getElementById('mm').textContent = T('mistakes') + ': ' + mistakes;
          [s, t].forEach(function (x) { x.el.classList.add('wrong', 'shake'); });
          setTimeout(function () { [s, t].forEach(function (x) { x.el.classList.remove('wrong', 'shake'); }); }, 600);
        }
      }
      function finish() {
        clearInterval(timer);
        var secs = (Date.now() - t0) / 1000;
        var isBest = !best || secs < best;
        if (isBest) lsSet(bestKey, Math.round(secs));
        record(ctx.en, ctx.week, n, n, secs, missed);
        setTimeout(function () {
          clear(area);
          add(area, h('div', { class: 'card center' },
            h('h2', null, '🎉 ' + praise()),
            h('div', { class: 'bigscore' }, fmtTime(secs)),
            h('p', { class: 'praise' }, isBest ? '🏅 ' + T('newBest') : T('best') + ': ' + fmtTime(best)),
            h('p', null, T('mistakes') + ': ' + mistakes), canNow(a),
            h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: game }, T('again')))));
        }, 400);
      }
    }
    clear(area);
    add(area, h('div', { class: 'card center' }, h('button', { class: 'btn big', onclick: game }, '▶️ ' + T('start'))));
  };

  /* ---------- 4. QUIZ (speed quiz when timed) ---------- */
  var SHAPES = ['▲', '◆', '●', '■'];
  ACT.quiz = function (a, ctx, area) {
    var timed = a.timed !== false, SECS = a.seconds || 20;
    function start() {
      var pool = a.shuffle === false ? a.questions.slice() : shuffle(a.questions.slice());
      var qs = pool.slice(0, Math.min(a.count || pool.length, pool.length));
      var i = 0, points = 0, streak = 0, correct = 0, missed = [], t0 = Date.now(), timer = null;
      S.cleanup = function () { clearInterval(timer); };
      function ask() {
        clearInterval(timer);
        var q = qs[i], answered = false, qStart = Date.now();
        clear(area);
        var bar = h('div', { class: 'progress timerbar' }, h('div', { style: 'width:100%' }));
        var fb = h('div', { 'aria-live': 'polite' });
        var order = shuffle(q.options.map(function (_, j) { return j; }));
        var right = order.indexOf(q.answer);
        var btns = order.map(function (oi, k) {
          return h('button', { class: 'ansbtn c' + (k % 4), onclick: function () { choose(k); } },
            h('span', { class: 'shape', 'aria-hidden': 'true' }, SHAPES[k % 4]), h('span', null, rich(q.options[oi])));
        });
        add(area, h('div', { class: 'card' },
          h('div', { class: 'stats' }, h('span', null, (i + 1) + ' / ' + qs.length),
            timed ? h('span', null, '⭐ ' + points + ' ' + T('points')) : h('span', null, '✅ ' + correct),
            timed && streak > 1 ? h('span', null, '🔥 ' + T('streak') + ' ' + streak) : null),
          timed ? bar : h('div', { class: 'progress' }, h('div', { style: 'width:' + (100 * i / qs.length) + '%' })),
          q.context ? h('div', { class: 'box teach' }, rich(q.context)) : null,
          h('div', { class: 'box q' }, rich(q.q)),
          h('div', { class: 'answers' }, btns), fb));
        if (timed) {
          timer = setInterval(function () {
            var left = SECS - (Date.now() - qStart) / 1000;
            bar.firstChild.style.width = Math.max(0, 100 * left / SECS) + '%';
            if (left <= 0) { clearInterval(timer); choose(-1); }
          }, 100);
        }
        function choose(k) {
          if (answered) return;
          answered = true; clearInterval(timer);
          var ok = k === right, el = (Date.now() - qStart) / 1000;
          btns.forEach(function (b, j) {
            b.disabled = true;
            if (j === right) b.classList.add('right');
            else if (j === k) b.classList.add('picked-wrong');
            else b.classList.add('faded');
          });
          var gained = 0;
          if (ok) {
            correct++; streak++;
            if (timed) { gained = Math.round(1000 * (1 - Math.min(el, SECS) / SECS / 2)) + Math.min(streak - 1, 5) * 100; points += gained; }
          } else { streak = 0; missed.push('Q' + (i + 1) + ' ' + String(q.q).slice(0, 40)); }
          add(fb, h('div', { class: 'box ' + (ok ? 'ans pop' : 'bad') },
            h('div', { class: ok ? 'praise' : 'oops' }, ok ? '⭐ ' + praise() + (gained ? '  +' + gained : '') : (k < 0 ? '⏰ ' + T('timeUp') + ' ' : '') + T('notQuite')),
            !ok ? h('div', { class: 'q-text' }, rich(q.options[q.answer])) : null,
            q.why ? h('div', { style: 'margin-top:6px' }, h('b', null, T('why') + ': '), bi(q.why, true)) : null),
            h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: function () { i++; i < qs.length ? ask() : end(); } }, i + 1 < qs.length ? T('next') : T('finish'))));
          fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
      function end() {
        clearInterval(timer);
        var secs = (Date.now() - t0) / 1000;
        record(ctx.en, ctx.week, correct, qs.length, secs, missed);
        clear(area);
        add(area, h('div', { class: 'card center' },
          h('h2', null, '🏁 ' + (correct === qs.length ? praise() : T('yourScore'))),
          timed ? h('div', { class: 'bigscore' }, points + ' ' + T('points')) : null,
          h('div', { class: timed ? 'praise' : 'bigscore' }, correct + ' / ' + qs.length + (timed ? ' ' + T('correctOf') : '')),
          h('p', { class: 'small muted' }, T('saved')), canNow(a),
          h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: start }, T('again')))));
      }
      ask();
    }
    clear(area);
    add(area, h('div', { class: 'card center' }, h('button', { class: 'btn big', onclick: start }, '▶️ ' + T('start'))));
  };

  /* ---------- 5. READING ---------- */
  ACT.reading = function (a, ctx, area) {
    function keywords() {
      clear(area);
      add(area, h('div', { class: 'card' }, h('h2', null, '🔑 ' + T('kwFirst')),
        a.keywords.map(function (k) {
          return h('div', { class: 'box teach' },
            h('div', { class: 'kw' }, h('b', null, k.word), h('button', { class: 'btn ghost', style: 'min-height:40px;padding:4px 12px', onclick: function () { say(k.word); } }, '🔊')),
            h('div', null, k.meaning), bilingual() && k.zh ? h('div', { class: 'small', lang: 'zh' }, k.zh) : null);
        }),
        h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: passage }, T('ready')))));
    }
    function passage() {
      clear(area); window.scrollTo(0, 0);
      add(area, h('div', { class: 'card passage' }, h('h2', null, a.storyTitle || ''),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: function () { say(a.paragraphs.join(' ')); } }, T('readMe')),
          h('button', { class: 'btn ghost', onclick: function () { say(a.paragraphs.join(' '), true); } }, T('slow'))),
        a.paragraphs.map(function (p, i) { return h('p', null, h('span', { class: 'pnum' }, (i + 1)), p); }),
        h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: questions }, T('toQs')))));
    }
    function questions() {
      var i = 0, correct = 0, missed = [], t0 = Date.now();
      function ask() {
        var q = a.questions[i], answered = false;
        clear(area); window.scrollTo(0, 0);
        var fb = h('div');
        var order = shuffle(q.options.map(function (_, j) { return j; }));
        var right = order.indexOf(q.answer);
        var btns = order.map(function (oi, k) {
          return h('button', { class: 'ansbtn c' + (k % 4), onclick: function () { choose(k); } }, h('span', { class: 'shape' }, SHAPES[k % 4]), h('span', null, q.options[oi]));
        });
        add(area, h('div', { class: 'card' },
          h('div', { class: 'stats' }, h('span', null, (i + 1) + ' / ' + a.questions.length), h('button', { class: 'btn ghost', onclick: passage2 }, '📖')),
          h('div', { class: 'box q' }, q.q), h('div', { class: 'answers' }, btns), fb));
        function passage2() {
          var d = h('div', { class: 'box teach passage' }, a.paragraphs.map(function (p, n) { return h('p', null, h('span', { class: 'pnum' }, n + 1), p); }));
          area.firstChild.insertBefore(d, area.firstChild.children[1]);
        }
        function choose(k) {
          if (answered) return; answered = true;
          var ok = k === right;
          if (ok) correct++; else missed.push('Q' + (i + 1));
          btns.forEach(function (b, j) { b.disabled = true; b.classList.add(j === right ? 'right' : j === k ? 'picked-wrong' : 'faded'); });
          add(fb, h('div', { class: 'box ' + (ok ? 'ans pop' : 'bad') },
            h('div', { class: ok ? 'praise' : 'oops' }, ok ? '⭐ ' + praise() : T('notQuite')),
            !ok ? h('div', { class: 'q-text' }, q.options[q.answer]) : null,
            q.why ? h('div', null, h('b', null, T('why') + ': '), bi(q.why)) : null),
            h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: function () { i++; i < a.questions.length ? ask() : afterQs(); } }, T('next'))));
        }
      }
      function afterQs() {
        record(ctx.en, ctx.week, correct, a.questions.length, (Date.now() - t0) / 1000, missed);
        a.write ? write(correct) : done(correct);
      }
      ask();
    }
    function write(correct) {
      clear(area); window.scrollTo(0, 0);
      var w = a.write;
      var ta = h('textarea', { rows: '3', 'aria-label': T('writeTask') });
      var sense = h('input', { type: 'checkbox', style: 'width:28px;height:28px;vertical-align:middle' });
      var items = { cap: h('li'), stop: h('li'), names: w.avoidNames ? h('li') : null };
      var fb = h('div');
      function tick(el, ok, label) { el.textContent = (ok ? '✅ ' : '⬜ ') + label; }
      function paint() {
        var t = ta.value.trim();
        tick(items.cap, /^[A-Z]/.test(t), T('capital'));
        tick(items.stop, /[.!?]["”']?$/.test(t), T('stop'));
        if (items.names) tick(items.names, t.length > 0 && !w.avoidNames.some(function (n) { return new RegExp('\\b' + n + '\\b', 'i').test(t); }), T('noNames'));
      }
      ta.addEventListener('input', paint);
      paint();
      add(area, h('div', { class: 'card' },
        h('div', { class: 'muted' }, '✏️ ' + T('writeTask')),
        h('div', { class: 'box q' }, bi(w.prompt)), ta,
        h('h3', null, T('checklist')),
        h('ul', { class: 'check-list' }, items.cap, items.stop, items.names, h('li', null, h('label', null, sense, ' ' + T('sense')))),
        h('div', { class: 'row center' }, h('button', { class: 'btn big green', onclick: function () {
          clear(fb);
          add(fb, h('div', { class: 'box ans pop' }, h('div', { class: 'praise' }, '⭐ ' + praise()), h('b', null, T('model') + ': '), w.model));
          add(fb, h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: function () { done(correct); } }, T('finish'))));
        } }, T('done'))), fb));
    }
    function done(correct) {
      clear(area);
      add(area, h('div', { class: 'card center' }, h('h2', null, '🏆 ' + praise()),
        h('div', { class: 'bigscore' }, correct + ' / ' + a.questions.length),
        h('p', { class: 'small muted' }, T('saved')), canNow(a),
        h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: keywords }, T('again')))));
    }
    keywords();
  };

  /* ---------- 6. GUIDED ANSWERS ---------- */
  ACT.guided = function (a, ctx, area) {
    var i = 0;
    function item() {
      var it = a.items[i], shown = 0, finished = false;
      clear(area);
      var steps = h('div');
      var hint = h('div');
      var nextBtn = h('button', { class: 'btn blue', onclick: more }, T('step1'));
      var hintBtn = h('button', { class: 'btn yellow', onclick: function () {
        if (hint.firstChild) return;
        add(hint, h('div', { class: 'box hint pop' }, h('b', null, T('hint') + ': '), bi(it.hint, true)));
        hintBtn.disabled = true;
      } }, T('hint'));
      var section = it.section ? h('div', { class: 'muted small' }, tx(it.section)) : null;
      add(area, h('div', { class: 'card' },
        h('div', { class: 'stats' }, h('span', null, (i + 1) + ' / ' + a.items.length), section),
        h('div', { class: 'box q' }, rich(it.q)),
        h('p', { class: 'small muted' }, T('tryPaper')),
        h('div', { class: 'row' }, it.hint ? hintBtn : null, nextBtn),
        hint, steps,
        h('div', { class: 'row', style: 'justify-content:space-between;margin-top:20px' },
          h('button', { class: 'btn ghost', disabled: i === 0, onclick: function () { i--; item(); window.scrollTo(0, 0); } }, T('prev')),
          h('button', { class: 'btn ghost', disabled: i === a.items.length - 1, onclick: function () { i++; item(); window.scrollTo(0, 0); } }, T('next')))));
      function more() {
        if (finished) return;
        if (shown < it.steps.length) {
          var s = it.steps[shown];
          var maths = s.math == null ? [] : [].concat(s.math);
          add(steps, h('div', { class: 'box teach step' }, h('b', null, (S.lang === 'zh' && bilingual() ? '第 ' + (shown + 1) + ' 步' : 'Step ' + (shown + 1)) + ': '), bi(s, true),
            maths.map(function (m) { return h('div', { class: 'math' }, rich(m)); })));
          shown++;
          nextBtn.textContent = T('nextStep');
        } else {
          finished = true; nextBtn.disabled = true;
          add(steps, h('div', { class: 'box ans step' },
            h('div', { class: 'final' }, T('answer') + ': ', rich(it.answer)),
            it.why ? h('div', { style: 'margin-top:8px' }, h('b', null, T('why') + ': '), bi(it.why, true)) : null,
            h('div', { class: 'praise', style: 'margin-top:6px' }, '⭐ ' + praise())));
          if (i === a.items.length - 1) add(steps, canNow(a));
        }
        steps.lastChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    item();
  };

  /* ---------- 7. TIMES TABLES SPRINT ---------- */
  function renderTables() {
    var sel = lsGet(key('tables'), [2, 3, 4, 5]);
    var area = h('div');
    show(backLink(), h('h1', null, '✖️ ' + T('tables')), h('div', { class: 'box teach' }, T('accFirst')), area);
    function setup() {
      clear(area);
      var chips = h('div', { class: 'chips' });
      function paint() {
        clear(chips);
        for (var n = 2; n <= 12; n++) (function (n) {
          chips.appendChild(h('button', { class: 'chip' + (sel.indexOf(n) >= 0 ? ' on' : ''), onclick: function () {
            var j = sel.indexOf(n); if (j >= 0) { if (sel.length > 1) sel.splice(j, 1); } else sel.push(n);
            sel.sort(function (x, y) { return x - y; }); lsSet(key('tables'), sel); paint();
          } }, '×' + n));
        })(n);
      }
      paint();
      var best = lsGet(key('tt_best_' + sel.join('-')), null);
      add(area, h('div', { class: 'card' }, h('h3', null, T('chooseTables')), chips,
        h('div', { class: 'row' }, h('button', { class: 'btn big', onclick: accuracy }, T('accRound'))),
        h('div', { class: 'row' }, h('button', { class: 'btn big ghost', onclick: speed }, T('speedRound'))),
        best ? h('p', { class: 'muted' }, '🏅 ' + T('best') + ': ' + best) : null));
    }
    function makeQ() { var a = pick(sel), b = 1 + Math.floor(Math.random() * 12); return Math.random() < .5 ? { a: a, b: b } : { a: b, b: a }; }
    function qBox(qEl, input, fb, extra) {
      add(area, h('div', { class: 'card' }, extra, h('div', { class: 'tt-q' }, qEl), input, fb));
    }
    function accuracy() {
      var N = 20, list = [], seen = {};
      while (list.length < N) { var q = makeQ(); var k = q.a + 'x' + q.b; if (!seen[k] || Object.keys(seen).length >= sel.length * 12) { seen[k] = 1; list.push(q); } }
      var queue = list.slice(), firstTry = 0, wrongSet = {}, missed = [], done = 0, cur, t0 = Date.now(), waiting = false;
      clear(area);
      var prog = h('div', { class: 'progress' }, h('div'));
      var qEl = h('span');
      var input = h('input', { type: 'text', inputmode: 'numeric', pattern: '[0-9]*', class: 'spell-input', autocomplete: 'off', 'aria-label': 'answer' });
      var fb = h('div');
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); waiting ? next() : check(); } });
      qBox(qEl, input, fb, [prog]);
      add(area, h('div', { class: 'row center' }, h('button', { class: 'btn big green', onclick: function () { waiting ? next() : check(); } }, T('check'))));
      function next() {
        waiting = false; clear(fb);
        if (!queue.length) return end();
        cur = queue.shift(); qEl.textContent = cur.a + ' × ' + cur.b + ' = ?';
        input.value = ''; input.focus();
        prog.firstChild.style.width = (100 * done / N) + '%';
      }
      function check() {
        if (!input.value.trim()) return;
        var ok = +input.value === cur.a * cur.b, k = cur.a + ' × ' + cur.b;
        if (ok) { done++; if (!wrongSet[k + '#' + cur.id]) firstTry++; add(fb, h('div', { class: 'praise pop center' }, '⭐ ' + praise())); setTimeout(next, 600); waiting = true; }
        else {
          cur.id = cur.id || Math.random(); wrongSet[k + '#' + cur.id] = 1; if (missed.indexOf(k) < 0) missed.push(k);
          queue.push(cur); waiting = true;
          add(fb, h('div', { class: 'box bad shake center' }, k + ' = ' + (cur.a * cur.b)));
        }
      }
      function end() {
        var secs = (Date.now() - t0) / 1000;
        record('Times tables accuracy (' + sel.join(',') + ')', 'anytime', firstTry, N, secs, missed);
        clear(area);
        add(area, h('div', { class: 'card center' }, h('h2', null, '🎯 ' + praise()), h('div', { class: 'bigscore' }, firstTry + ' / ' + N),
          h('p', null, T('firstTry')), missed.length ? h('div', { class: 'box hint' }, missed.join(', ')) : null,
          h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: speed }, T('speedRound')), h('button', { class: 'btn ghost', onclick: setup }, T('back')))));
      }
      next();
    }
    function speed() {
      var SECS = 60, right = 0, wrong = 0, missed = [], cur, t0 = Date.now(), timer;
      clear(area);
      var bar = h('div', { class: 'progress timerbar' }, h('div', { style: 'width:100%' }));
      var stat = h('div', { class: 'stats' });
      var qEl = h('span');
      var input = h('input', { type: 'text', inputmode: 'numeric', pattern: '[0-9]*', class: 'spell-input', autocomplete: 'off', 'aria-label': 'answer' });
      var fb = h('div', { class: 'center', style: 'min-height:48px' });
      qBox(qEl, input, fb, [bar, stat]);
      add(area, h('div', { class: 'row center' }, h('button', { class: 'btn big green', onclick: check }, T('check'))));
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      function paint() { stat.textContent = '✅ ' + right + '   ❌ ' + wrong; }
      function next() { cur = makeQ(); qEl.textContent = cur.a + ' × ' + cur.b + ' = ?'; input.value = ''; input.focus(); paint(); }
      function check() {
        if (!input.value.trim()) return;
        clear(fb);
        if (+input.value === cur.a * cur.b) { right++; add(fb, h('span', { class: 'praise pop' }, '⭐')); }
        else { wrong++; var k = cur.a + ' × ' + cur.b; if (missed.indexOf(k) < 0) missed.push(k); add(fb, h('span', { class: 'oops' }, k + ' = ' + cur.a * cur.b)); }
        next();
      }
      timer = setInterval(function () {
        var left = SECS - (Date.now() - t0) / 1000;
        bar.firstChild.style.width = Math.max(0, 100 * left / SECS) + '%';
        if (left <= 0) { clearInterval(timer); end(); }
      }, 200);
      S.cleanup = function () { clearInterval(timer); };
      function end() {
        var bk = key('tt_best_' + sel.join('-')), best = lsGet(bk, 0), isBest = right > best;
        if (isBest) lsSet(bk, right);
        record('Times tables speed (' + sel.join(',') + ')', 'anytime', right, right + wrong, SECS, missed);
        clear(area);
        add(area, h('div', { class: 'card center' }, h('h2', null, '⚡ ' + praise()), h('div', { class: 'bigscore' }, right),
          h('p', null, bi({ en: 'correct answers in 60 seconds', zh: '60 秒内答对的题数' })),
          h('p', { class: 'praise' }, isBest ? '🏅 ' + T('newBest') : T('best') + ': ' + best),
          missed.length ? h('div', { class: 'box hint' }, missed.join(', ')) : null,
          h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: speed }, T('again')), h('button', { class: 'btn ghost', onclick: setup }, T('back')))));
      }
      next();
    }
    setup();
  }

  /* ---------- Practice Anytime word banks ---------- */
  function renderBank(kind) {
    show(backLink(), h('p', { class: 'muted' }, '…'));
    Promise.all(weekIds().map(loadWeek)).then(function (weeks) {
      var area = h('div');
      if (kind === 'spelling') {
        var words = [], groups = [], seen = {};
        weeks.forEach(function (w) {
          w.activities.filter(function (a) { return a.type === 'spelling'; }).forEach(function (a) {
            groups.push({ id: w.week, en: weekLabel(w.week), zh: weekLabel(w.week) });
            a.words.forEach(function (x) { if (!seen[x.word]) { seen[x.word] = 1; words.push({ word: x.word, sentence: x.sentence, zh: x.zh, group: w.week }); } });
          });
        });
        var act = { type: 'spelling', id: 'bank', title: { en: T('spellingBank') }, words: words, groups: groups };
        show(backLink(), h('h1', null, '🔤 ' + T('spellingBank')), area);
        ACT.spelling(act, { week: 'anytime', en: 'All spelling words' }, area);
      } else {
        var cards = [];
        weeks.forEach(function (w) { w.activities.filter(function (a) { return a.type === 'flashcards'; }).forEach(function (a) { cards = cards.concat(a.cards); }); });
        show(backLink(), h('h1', null, '🃏 ' + T('cardsBank')), area);
        ACT.flashcards({ cards: cards }, { week: 'anytime' }, area);
      }
    }).catch(renderError);
  }

  /* ================= PRINT PAGE ================= */
  function renderPrint() {
    document.body.className = 'print-page';
    var m = /[?&]w=([0-9-]+)/.exec(location.search);
    var id = m ? m[1] : weekIds()[0];
    var root = h('div', { class: 'wrap' });
    document.body.appendChild(root);
    var lang = S.lang; S.lang = 'en';
    loadWeek(id).then(function (w) {
      var answers = [];
      add(root, [
        h('div', { class: 'noprint row' }, h('button', { class: 'btn', onclick: function () { window.print(); } }, '🖨️ Print'), h('span', { class: 'muted small' }, 'Prints in black and white.')),
        h('h1', null, S.student.name + ': ' + (w.title.en || w.title)),
        h('p', null, 'Week of ' + weekLabel(w.week)), h('p', null, 'Date: ______________')
      ]);
      w.activities.forEach(function (a) {
        var title = h('h2', null, a.title.en || a.title);
        if (a.type === 'spelling') {
          add(root, [title, h('p', null, 'Look, say, cover, write, check.'),
            h('table', null, h('tr', null, h('th', null, '#'), h('th', null, 'Word'), h('th', null, 'Write it'), h('th', null, 'Write it again'), h('th', null, '✔')),
              a.words.map(function (x, n) { return h('tr', null, h('td', null, n + 1), h('td', null, h('b', null, x.word)), h('td'), h('td'), h('td')); }))]);
        } else if (a.type === 'flashcards') {
          add(root, [title, h('table', null, a.cards.map(function (c) { return h('tr', null, h('td', null, h('b', null, c.front)), h('td', null, c.back, bilingual() && c.zh ? h('div', null, c.zh) : null)); }))]);
        } else if (a.type === 'quiz') {
          add(root, title);
          a.questions.forEach(function (q, n) {
            add(root, h('div', { class: 'pq' }, (n + 1) + '. ', q.context ? h('div', { style: 'font-weight:400' }, rich(q.context)) : null, rich(q.q)));
            add(root, h('div', { class: 'opts' }, q.options.map(function (o, k) { return h('div', null, String.fromCharCode(65 + k) + ')  ', rich(o)); })));
          });
          answers.push([a.title.en || a.title, a.questions.map(function (q, n) { return (n + 1) + ' ' + String.fromCharCode(65 + q.answer); }).join('   ')]);
        } else if (a.type === 'reading') {
          add(root, [h('div', { class: 'newpage' }), title,
            h('div', { class: 'pbox' }, h('b', null, 'Key words: '), a.keywords.map(function (k) { return k.word + ' (' + k.meaning + ')'; }).join('; ')),
            h('h3', null, a.storyTitle || ''), a.paragraphs.map(function (p, n) { return h('p', null, (n + 1) + '  ' + p); })]);
          a.questions.forEach(function (q, n) {
            add(root, [h('div', { class: 'pq' }, (n + 1) + '. ' + q.q), h('div', { class: 'opts' }, q.options.map(function (o, k) { return h('div', null, String.fromCharCode(65 + k) + ')  ' + o); }))]);
          });
          if (a.write) add(root, [h('div', { class: 'pq' }, (a.questions.length + 1) + '. ' + a.write.prompt.en), h('div', { class: 'lines' }), h('div', { class: 'lines' }),
            h('p', null, '☐ Capital letter   ☐ Full stop   ☐ Makes sense')]);
          answers.push([a.title.en || a.title, a.questions.map(function (q, n) { return (n + 1) + ' ' + String.fromCharCode(65 + q.answer); }).join('   ')]);
        } else if (a.type === 'guided') {
          add(root, [h('div', { class: 'newpage' }), title, h('p', null, 'Show your working.')]);
          a.items.forEach(function (it, n) { add(root, [h('div', { class: 'pq' }, (n + 1) + '. ', rich(it.q)), h('div', { class: 'lines' }), h('div', { class: 'lines' })]); });
          answers.push([a.title.en || a.title, a.items.map(function (it, n) { return (n + 1) + ') ' + it.answer; }).join('   ')]);
        }
      });
      if (answers.length) {
        add(root, [h('div', { class: 'newpage' }), h('h2', null, 'Answers (for checking)')]);
        answers.forEach(function (x) { add(root, h('div', { class: 'pbox' }, h('b', null, x[0] + ': '), rich(x[1]))); });
      }
      S.lang = lang;
    }).catch(function () { add(root, h('p', null, 'Could not load this week.')); });
  }

  /* ---------------- start ---------------- */
  getJSON(DATA + 'student.json').then(function (st) {
    S.student = st;
    S.lang = lsGet(key('lang'), 'en');
    document.title = 'Hi ' + st.name + '!';
    if (st.accent) document.documentElement.style.setProperty('--accent', st.accent);
    if (st.accentSoft) document.documentElement.style.setProperty('--accent-soft', st.accentSoft);
    if (window.PRINT_MODE) return renderPrint();
    frame();
    window.addEventListener('hashchange', route);
    route();
    flush();
  }).catch(function () {
    document.body.appendChild(h('div', { class: 'wrap empty' }, 'Sorry, this page could not load. Check your internet and try again.'));
  });
})();
