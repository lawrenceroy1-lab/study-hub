/* Tutoring site engine.
   One file runs every student page. Content comes from site/data/<student>/*.json.
   Plain JavaScript, no frameworks, no build step. */
(function () {
  'use strict';

  var STUDENT_ID = window.STUDENT_ID;
  var DATA = '../data/' + STUDENT_ID + '/';
  var S = { student: null, weeks: {}, lang: 'en', cleanup: null, pos: {}, relang: null };
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
  function key(k) { return 'tut_' + STUDENT_ID + (S.who === 'roy' ? '_roy' : '') + '_' + k; }
  var WHO_KEY = 'tut_' + STUDENT_ID + '_who';
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
      groups: 'Choose a list', hwReview: 'Homework Review', hwLog: 'Homework Log', workbook: 'Workbook', morePractice: 'More practice'
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
      groups: '选择单词表', hwReview: '作业讲评', hwLog: '作业记录', workbook: '练习册', morePractice: '更多练习'
    }
  };
  function bilingual() { return !!(S.student && S.student.bilingual); }
  /* Every page shows English AND Chinese together (no language switch). S.lang is 'both' on pages, 'en' while printing. */
  function dual() { return bilingual() && S.lang === 'both'; }
  /* Join English and Chinese into one line: "Next / 下一个 →", "← Back / 返回". */
  function both(en, zh) {
    en = en == null ? '' : String(en); zh = zh == null ? '' : String(zh);
    if (!zh || zh === en) return en;
    if (/^← /.test(en) && /^← /.test(zh)) zh = zh.slice(2);
    if (/ →$/.test(en) && / →$/.test(zh)) en = en.slice(0, -2);
    return en + ' / ' + zh;
  }
  function T1(k, lang) {
    var own = S.student && S.student.ui && S.student.ui[lang];   /* per-student wording, e.g. gentler feedback */
    if (own && own[k] != null) return own[k];
    var L = UI[lang]; return L[k] != null ? L[k] : UI.en[k];
  }
  function T(k) { return dual() ? both(T1(k, 'en'), T1(k, 'zh')) : T1(k, 'en'); }
  /* Stars instead of marks for students who should not see scores. */
  function scoreText(c, t) { return (S.student && S.student.stars) ? (c ? new Array(Math.min(c, 10) + 1).join('⭐') : '🌱') : c + ' / ' + t; }
  /* Pick text for a value that may be "string" or {en, zh}. */
  function tx(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return (dual() && v.zh) ? both(v.en || '', v.zh) : (v.en || '');
  }
  /* Instructions, hints and explanations: in 中文 mode show English with Chinese underneath. */
  function bi(v, isRich) {
    if (v == null) return null;
    if (typeof v === 'string') return isRich ? rich(v) : v;
    if (dual() && v.zh) {
      return h('span', null, isRich ? rich(v.en) : v.en, h('span', { class: 'zh-sub', lang: 'zh' }, isRich ? rich(v.zh) : v.zh));   /* English first, Chinese underneath */
    }
    return isRich ? rich(v.en) : v.en;
  }
  function praise() {
    var en = ['Great job!', 'Well done!', 'Brilliant!', 'You got it!', 'Super!', 'Amazing work!', 'Fantastic!', 'Yes! Keep going!'];
    var zh = ['太棒了！', '做得好！', '真厉害！', '答对了！', '非常好！', '了不起！', '好极了！', '对了！继续加油！'];
    var i = Math.floor(Math.random() * en.length);
    return dual() ? en[i] + ' ' + zh[i] : en[i];
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
  /* Play and stop: pressing the same 🔊 button again stops it, and a big ⏹ Stop button shows while audio plays. */
  var speaking = null, stopBar = null;
  function showStop(on) {
    if (!stopBar) {
      stopBar = h('button', { class: 'stopbar hidden', 'aria-label': 'Stop audio', onclick: function () { stopSpeech(); } });
      document.body.appendChild(stopBar);
    }
    stopBar.textContent = '⏹ ' + (dual() ? 'Stop / 停止' : 'Stop');
    stopBar.classList.toggle('hidden', !on);
  }
  function say(text, slow) {
    if (!window.speechSynthesis) return;
    try {
      if (speaking === text + (slow ? '#slow' : '') && (speechSynthesis.speaking || speechSynthesis.pending)) { stopSpeech(); return; }
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-GB';
      u.rate = slow ? 0.5 : 0.9;
      var me = speaking = text + (slow ? '#slow' : '');
      u.onend = u.onerror = function () { if (speaking === me) { speaking = null; showStop(false); } };
      speechSynthesis.speak(u);
      showStop(true);
    } catch (e) { /* no speech on this device */ }
  }
  function stopSpeech() { speaking = null; try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} if (stopBar) showStop(false); }

  /* ---------------- scores ---------------- */
  var QKEY = key('scoreQueue');
  function localTime() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  /* Login names (25 Nov 2026): teacher LAWRENCE; students DAISY, Lyra, ISSIE (student.json "loginName"). */
  var TEACHER_NAME = 'LAWRENCE';
  function loginName() { return S.student.loginName || S.student.name.toUpperCase(); }
  function whoName() { return S.who === 'roy' ? TEACHER_NAME : loginName(); }
  function record(activity, week, score, total, seconds, missed, wrongItems) {
    var log = lsGet(key('results'), []);
    var rid0 = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    log.unshift({ id: rid0, time: localTime(), who: whoName(), week: week, activity: activity, score: score, total: total,
      seconds: Math.round(seconds || 0), wrong: wrongItems || null, missed: wrongItems ? null : (missed || []) });
    lsSet(key('results'), log.slice(0, 300));
    var q = lsGet(QKEY, []), rid = rid0;
    q.push({
      id: rid,
      time: localTime(), student: S.who === 'roy' ? TEACHER_NAME + ' (on ' + S.student.name + "'s page)" : S.student.name, week: week, activity: activity,
      score: score, total: total, seconds: Math.round(seconds || 0), missed: (missed || []).join(', ')
    });
    lsSet(QKEY, q);
    flush();
    return rid;
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
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;   /* preview on this computer: never send test scores */
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
    return getJSON(DATA + id + '.json').then(function (w) { addAutoReviews(w); S.weeks[id] = w; return w; });
  }
  /* Every homework day with a homework quiz gets its own Homework Review, made from that quiz's questions,
     so she can check and correct her own homework. It opens only after the quiz is submitted. */
  function addAutoReviews(w) {
    return;   /* replaced by Results: wrong answers with the right ones */
    var acts = {}, have = {};
    (w.activities || []).forEach(function (a) { acts[a.id] = a; });
    (w.reviews || []).forEach(function (r) { have[r.date] = true; });
    var extra = [];
    (w.days || []).slice().sort(function (a, b) { return a.date > b.date ? 1 : -1; }).forEach(function (d) {
      if (d.kind !== 'homework' || have[d.date]) return;
      var hw = (d.activities || []).map(function (id) { return acts[id]; }).filter(function (a) { return a && a.type === 'hwquiz' && (a.questions || []).length; });
      if (!hw.length) return;
      extra.push({ id: 'auto-' + d.date, date: d.date, title: d.title || hw[0].title, auto: true, part: hw[0].part,
        hwIds: hw.map(function (a) { return a.id; }),
        pages: hw.map(function (a) {
          return { title: a.title, items: a.questions.map(function (q) {
            return { q: q.q, qzh: q.qzh, ozh: q.ozh, context: q.context, options: q.options, answer: q.answer, right: q.options[q.answer], why: q.why, wrong: q.wrong };
          }) };
        }) });
    });
    if (extra.length) w.reviews = (w.reviews || []).concat(extra);
  }
  function hwSubmitted(week, r) {
    return !r.auto || r.hwIds.every(function (id) { var s = lsGet(key('hw_' + week + '_' + id), null); return !!(s && s.submitted); });
  }
  function weekIds() { return (S.student.weeks || []).slice().sort().reverse(); }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function weekLabel(id) {
    var p = id.split('-'), a = new Date(+p[0], +p[1] - 1, +p[2]), b = new Date(a.getTime() + 6 * 864e5);
    var en = a.getDate() + (a.getMonth() === b.getMonth() ? '' : ' ' + MONTHS[a.getMonth()]) + ' to ' + b.getDate() + ' ' + MONTHS[b.getMonth()];
    if (dual()) return both(en, (a.getMonth() + 1) + '月' + a.getDate() + '日至' + (b.getMonth() === a.getMonth() ? '' : (b.getMonth() + 1) + '月') + b.getDate() + '日');
    return en;
  }

  /* ---------------- frame + router ---------------- */
  var ICONS = { spelling: '🔤', flashcards: '🃏', match: '🧩', quiz: '⚡', reading: '📖', guided: '🧮', lesson: '📽️', fillblank: '✍️', keypoints: '🔑', hwquiz: '🏠' };

  /* English with the Chinese in small letters underneath (menus, titles, labels) */
  function E(en, zh) { return dual() && zh ? h('span', { class: 'ez' }, en, h('small', { lang: 'zh' }, zh)) : en; }
  var NAV = null;
  function frame() {
    NAV = h('nav', { class: 'nav' });
    var side = h('aside', { class: 'side' },
      h('a', { class: 'brand', href: '#/' }, h('span', { class: 'brand-dot' }, S.student.name.charAt(0)),
        h('span', null, h('b', null, S.student.name), h('small', null, L('My study space', '我的学习空间')))),
      NAV);
    main = h('main', { class: 'wrap', id: 'main' });
    document.body.appendChild(h('div', { class: 'app' }, side, main));
    paintFrame();
  }
  function paintFrame() {
    if (!NAV) return;
    clear(NAV);
    /* Three small groups so the menu is easy to scan: My work, Learn, Extra. */
    var st = S.student, items = [['g', 'My work', '我的功课'], ['today', '#/', '🏠', 'Today', '今天'], ['homework', '#/homework', '📝', 'Homework', '作业'],
      ['review', '#/review', '📋', 'Homework Review', '作业讲评'], ['class', '#/class', '👩‍🏫', 'Class with Roy', '和 Roy 上课'],
      ['calendar', '#/calendar', '📅', 'Calendar', '日历'], ['g', 'Learn', '学习'], ['subjects', '#/subject', '🗂️', 'Subjects', '科目']];
    if (st.mainBook) items.push(['book', '#/book', '📖', 'Main Book', '主课本']);
    if (st.schoolHomework) items.push(['school', '#/school', '🏫', 'School homework', '学校作业']);
    if (st.library) items.push(['library', '#/library', '📚', 'Library', '资料库']);
    items.push(['g', 'Extra', '更多'], ['results', '#/results', '📊', 'My results', '我的成绩']);
    items.push(['practice', '#/practice', '🎯', 'More practice', '更多练习'], ['drawings', '#/drawings', '🎨', 'My drawings', '我的画']);
    items.forEach(function (it) {
      if (it[0] === 'g') { NAV.appendChild(h('div', { class: 'nav-group' }, it[1] + ' · ' + it[2])); return; }
      NAV.appendChild(h('a', { href: it[1], 'data-nav': it[0], class: S.nav === it[0] ? 'on' : '' }, h('span', { class: 'ni' }, it[2]), E(it[3], it[4])));
    });
    if (S.who) NAV.appendChild(h('button', { class: 'who-chip', onclick: function () { S.who = null; try { localStorage.removeItem(WHO_KEY); } catch (e) {} route(); } },
      h('span', { class: 'ni' }, S.who === 'roy' ? '👨‍🏫' : '👤'), E(whoName() + ' · ' + 'log out', whoName() + ' · 退出')));
  }
  function setNav(id) {
    var map = { '': 'today', w: S.nav, log: 'results', subject: 'subjects', tables: 'practice', bank: 'practice' };
    S.nav = map.hasOwnProperty(id) ? map[id] : id;
    if (NAV) [].forEach.call(NAV.querySelectorAll('a'), function (a) { a.classList.toggle('on', a.getAttribute('data-nav') === S.nav); });
  }
  function setLang(l) { S.lang = l; lsSet(key('lang'), l); paintFrame(); S.relang = location.hash; var y = window.scrollY; route(); setTimeout(function () { window.scrollTo(0, y); }, 300); }
  /* Remember where she is (page, question, answers) so changing language does not start again. */
  function keep(name, fresh, force) {
    var pk = location.hash + '|' + name;
    if (!force && S.relang === location.hash && S.pos[pk]) return S.pos[pk];
    if (!fresh) return null;
    return (S.pos[pk] = fresh());
  }
  /* The next question or card not done yet, after the one on screen (wraps round). -1 = all done. */
  function nextFree(n, i, isDone) {
    for (var s = 1; s < n; s++) { var k = (i + s) % n; if (!isDone(k)) return k; }
    return isDone(i) ? -1 : i;
  }
  /* Number buttons 1, 2, 3 ... to jump to any question or card. */
  function numStrip(n, cur, stateFn, pick) {
    if (n < 2) return null;
    var d = h('div', { class: 'numstrip', role: 'navigation', 'aria-label': 'Jump to' });
    for (var k = 0; k < n; k++) (function (k) {
      var s = stateFn(k);
      d.appendChild(h('button', { class: 'num' + (s ? ' ' + s : '') + (k === cur ? ' on' : ''), onclick: function () { if (k !== cur) pick(k); } }, String(k + 1)));
    })(k);
    setTimeout(function () { var on = d.querySelector('.on'); if (on && d.scrollWidth > d.clientWidth) d.scrollLeft = on.offsetLeft - d.offsetLeft - d.clientWidth / 2 + 21; }, 0);
    return d;
  }

  function show() {
    clear(main);
    for (var i = 0; i < arguments.length; i++) add(main, arguments[i]);
  }
  /* Back always goes to the page you came from (kept for this tab, even after a reload) */
  var TRAIL_KEY = 'trail_' + (window.STUDENT_ID || '');
  function trail() { try { return JSON.parse(sessionStorage.getItem(TRAIL_KEY)) || []; } catch (e) { return []; } }
  function noteTrail() {
    var t = trail(), cur = location.hash || '#/';
    if (cur === '#' ) cur = '#/';
    if (t.length > 1 && t[t.length - 2] === cur) t.pop();
    else if (t[t.length - 1] !== cur) t.push(cur);
    if (t.length > 40) t = t.slice(-40);
    try { sessionStorage.setItem(TRAIL_KEY, JSON.stringify(t)); } catch (e) {}
  }
  function prevPage() { var t = trail(); return t.length > 1 ? t[t.length - 2] : null; }
  function backLink(href) { return h('a', { class: 'back', href: prevPage() || href || '#/' }, T('back')); }

  function route() {
    if (S.cleanup) { try { S.cleanup(); } catch (e) {} S.cleanup = null; }
    stopSpeech();
    noteTrail();
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    window.scrollTo(0, 0);
    setNav(parts[0] || 'today');
    if (!S.who) return renderWho();
    if (parts[0] === 'homework') return renderDayList('homework');
    if (parts[0] === 'class') return renderDayList('class');
    if (parts[0] === 'calendar') return renderDayList('all');
    if (parts[0] === 'review') return parts[3] ? renderTry(parts[1], parts[2], +parts[3]) : renderTryList();
    if (parts[0] === 'results' || parts[0] === 'log') return renderResults();
    if (parts[0] === 'practice') return renderPractice();
    if (parts[0] === 'w' && parts[1]) {
      return loadWeek(parts[1]).then(function (w) {
        if (parts[2] === 'reviews') renderResults();
        else if (parts[2] === 'review') renderReview(w, parts[3]);
        else if (parts[2] === 'day') renderDay(w, parts[3]);
        else if (parts[2]) renderActivity(w, parts[2]); else renderWeek(w, false);
      }).catch(renderError);
    }
    if (parts[0] === 'log') return renderLog();
    if (parts[0] !== 'book' && S.returnTo && location.hash !== S.returnTo.hash) S.returnTo = null;
    if (parts[0] === 'book') return renderBook(parts[1]);
    if (parts[0] === 'subject') return parts[1] ? renderSubject(parts[1], parts[2] || 'overview') : renderSubjects();
    if (parts[0] === 'school') return renderSchool(parts[1]);
    if (parts[0] === 'library') return renderLibrary();
    if (parts[0] === 'drawings') return renderDrawings();
    if (parts[0] === 'tables') return renderTables();
    if (parts[0] === 'bank') return renderBank(parts[1]);
    renderToday();
  }
  function renderError() { show(h('div', { class: 'card empty' }, h('p', null, T('loadError')), backLink())); }


  /* ---------------- who is working? ---------------- */
  /* Type your name, then tap the name we suggest. Any spelling of the student's name (or a typo) gives
     the student's name; anything close to Lawrence / Roy / teacher gives LAWRENCE (teacher, own saved space). */
  function editDist(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function guessWho(text) {
    var t = String(text || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!t) return null;
    var teacher = ['lawrence', 'laurence', 'lawrance', 'roy', 'troy', 'teacher', 'sir', 'mrroy', 'teacherroy', 'lawrencejose'];
    var near = teacher.some(function (x) { return x.indexOf(t) === 0 && t.length >= 3 || editDist(t, x) <= Math.max(1, Math.floor(x.length / 4)); });
    return near ? 'roy' : 'student';
  }
  function renderWho() {
    var pickWho = function (w) { S.who = w; lsSet(WHO_KEY, w); paintFrame(); location.hash = '#/'; route(); };
    var sugg = h('div', { class: 'who-sugg' });
    var inp = h('input', { type: 'text', class: 'who-input', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false',
      placeholder: L('Type your name here', '在这里输入你的名字'), 'aria-label': 'Your name' });
    function paint() {
      clear(sugg);
      var g = guessWho(inp.value);
      if (!g) return add(sugg, h('p', { class: 'muted small' }, E('Start typing, then tap your name.', '开始输入，然后点你的名字。')));
      add(sugg, h('p', { class: 'who-ask' }, E('Is this what you mean?', '你是指这个名字吗？')),
        h('button', { class: 'who-name', onclick: function () { pickWho(g); } },
          h('span', { class: 'who-ico' }, g === 'roy' ? '👨‍🏫' : '🙋'),
          h('span', null, h('b', null, g === 'roy' ? TEACHER_NAME : loginName()),
            h('small', null, g === 'roy' ? E('Teacher', '老师') : E('Student', '学生'))),
          h('span', { class: 'who-go' }, E('Tap to log in →', '点这里登录 →'))));
    }
    inp.addEventListener('input', paint);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var g = guessWho(inp.value); if (g) pickWho(g); } });
    show(h('div', { class: 'card who' },
      h('div', { class: 'who-logo' }, S.student.name.charAt(0)),
      h('h1', null, E('Log in', '登录')),
      h('p', { class: 'muted' }, E('Type your name. Your homework and results are saved under it.', '输入你的名字。你的作业和成绩会保存在这个名字下。')),
      inp, sugg));
    paint();
    setTimeout(function () { try { inp.focus(); } catch (e) {} }, 50);
  }

  /* ---------------- shared pieces ---------------- */
  /* Chinese under every question and option (q.qzh, q.ozh = {"option text": "中文"}). */
  function QT(q) { return h('span', null, rich(String(q.q)), q.qzh && dual() ? h('span', { class: 'zh-sub', lang: 'zh' }, rich(String(q.qzh))) : null); }
  function OT(q, o) { var z = q.ozh && q.ozh[o]; return h('span', null, rich(String(o)), z && dual() ? h('span', { class: 'zh-sub', lang: 'zh' }, z) : null); }
  /* Every answer explains itself: why the right answer is right, and (when the child picked another) why that one is wrong.
     q.wrong is {"option text": {en, zh}}. */
  function optLabel(o) { o = String(o == null ? '' : o).replace(/[*_`]/g, ''); return o.length <= 32 ? '\u201c' + o + '\u201d' : null; }
  function whyBox(q, your, cls) {
    var right = q.options ? q.options[q.answer] : q.right;
    var bad = your != null && your !== right ? your : null;
    var ww = q.wrongWhy || (bad != null && q.wrong ? q.wrong[bad] : null);
    if (!q.why && !ww) return null;
    var rl = optLabel(right), bl = optLabel(bad);
    return h('div', { class: cls || 'wwhy' },
      q.why ? h('div', { class: 'why-right' }, h('b', null, '\u2705 ' + (rl ? L('Why ' + rl + ' is right: ', '\u4e3a\u4ec0\u4e48 ' + rl + ' \u662f\u5bf9\u7684\uff1a') : L('Why the right answer is right: ', '\u4e3a\u4ec0\u4e48\u6b63\u786e\u7b54\u6848\u662f\u5bf9\u7684\uff1a'))), bi(q.why, true)) : null,
      ww ? h('div', { class: 'why-wrong' }, h('b', null, '\u274c ' + (bl ? L('Why ' + bl + ' is wrong: ', '\u4e3a\u4ec0\u4e48 ' + bl + ' \u662f\u9519\u7684\uff1a') : L('Why your answer is wrong: ', '\u4e3a\u4ec0\u4e48\u4f60\u7684\u7b54\u6848\u662f\u9519\u7684\uff1a'))), bi(ww, true)) : null);
  }
  function hwWrong(a, st) {
    var out = [];
    (a.questions || []).forEach(function (q, n) {
      var p = st.ans[n];
      if (p !== q.answer) out.push({ q: q.q, qzh: q.qzh, ozh: q.ozh, your: p == null ? null : q.options[p], right: q.options[q.answer], why: q.why, wrongWhy: p == null || !q.wrong ? undefined : q.wrong[q.options[p]] });
    });
    return out;
  }
  function wrongList(items) {
    if (!items || !items.length) return h('div', { class: 'box ans' }, '🌟 ' + L('No mistakes. Everything is right!', '没有错题，全部正确！'));
    return h('div', { class: 'wrong-list' }, h('h3', null, E('Questions to look at again (' + items.length + ')', '要再看一遍的题（' + items.length + '）')),
      items.map(function (x, n) {
        return h('div', { class: 'wrong-item' },
          h('div', { class: 'wq' }, h('span', { class: 'wn' }, String(n + 1)), QT(x)),
          h('div', { class: 'wa bad' }, h('small', null, L('Your answer', '你的答案')), x.your == null ? L('(no answer)', '（没有作答）') : OT(x, x.your)),
          h('div', { class: 'wa good' }, h('small', null, L('Right answer', '正确答案')), OT(x, x.right)),
          whyBox(x, x.your));
      }));
  }
  function allDays() {
    return Promise.all(weekIds().map(function (id) { return loadWeek(id).catch(function () { return null; }); })).then(function (weeks) {
      var all = [];
      weeks.forEach(function (w) { if (w) (w.days || []).forEach(function (d) { all.push({ w: w, d: d, s: dayStatus(w, d) }); }); });
      all.sort(function (a, b) { return a.d.date > b.d.date ? 1 : -1; });
      return all;
    });
  }
  function actById(w, id) { return (w.activities || []).filter(function (x) { return x.id === id; })[0]; }
  function minutes(d) { var m = /About (\d+) minutes/.exec((d.message && d.message.en) || ''); return m ? +m[1] : null; }
  function chip(text, cls) { return h('span', { class: 'chip ' + (cls || '') }, text); }
  function statusChip(x) {
    if (x.d.kind !== 'homework') return chip(L('Class', '上课'), 'class');
    var s = x.s;
    if (!s) return chip(L('Homework', '作业'));
    if (s.done) return chip('✅ ' + s.right + ' / ' + s.total, 'done');
    if (s.started) return chip(L('Started', '已开始'), 'started');
    return x.d.date < todayISO() ? chip(L('Not done', '没做'), 'late') : chip(L('To do', '待做'), 'todo');
  }
  /* One line per day: a small calendar badge, then what it is, its title and its status (never in a staggered grid). */
  function isoDate(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dateBadge(iso) {
    var dt = isoDate(iso);
    return h('span', { class: 'dr-cal' }, h('small', null, DAYS_EN[dt.getDay()].slice(0, 3)), h('b', null, String(dt.getDate())),
      h('small', null, MONTHS[dt.getMonth()].slice(0, 3)));
  }
  function dayRow(x) {
    var hw = x.d.kind === 'homework', today = x.d.date === todayISO();
    return h('a', { class: 'day-row' + (today ? ' is-today' : ''), href: '#/w/' + x.w.week + '/day/' + x.d.date, 'data-date': x.d.date },
      dateBadge(x.d.date),
      h('span', { class: 'dr-title' },
        h('span', { class: 'dr-kind ' + (hw ? 'hw' : 'cl') }, (hw ? '🏠 ' + L('Homework', '作业') : '👩‍🏫 ' + L('Class with Roy', '和 Roy 上课')) + (today ? '  ·  ' + L('TODAY', '今天') : '')),
        h('span', { class: 'dr-name' }, tx(x.d.title)),
        h('span', { class: 'dr-meta' }, statusChip(x), (x.d.book || []).length ? h('small', { class: 'muted' }, '📖 ' + x.d.book.join(', ')) : null)));
  }
  /* Last page of every Main Book chapter: "Did you understand this?" Yes / No for each page.
     Every answer goes to the score sheet (week "understand"); a No shows on Roy's next class day page. */
  function understandBox(code, slides) {
    var store = key('und_' + code), saved = lsGet(store, {});
    var pages = slides.map(function (p, k) { return { p: p, k: k }; }).filter(function (x) { return !x.p.check && !x.p.draw; });
    return h('div', null,
      h('div', { class: 'box teach' }, E('Be honest! For each page, tap ✅ Yes if you understood it, or ❓ No if it is still hard. Roy will go over every No with you in your next class.',
        '要诚实哦！每一页，听懂了就点 ✅ 是，还觉得难就点 ❓ 不是。下次上课 Roy 老师会和你一起再讲每一个“不是”。')),
      h('div', { class: 'und-list' }, pages.map(function (x) {
        var en = typeof x.p.title === 'string' ? x.p.title : x.p.title.en;
        var row = h('div', { class: 'und-row' });
        function paint() {
          clear(row);
          var v = saved[x.k];
          add(row, h('div', { class: 'und-t' }, (x.p.icon ? x.p.icon + ' ' : ''), bi(x.p.title)),
            h('div', { class: 'und-q small muted' }, L('Did you understand this?', '这一页你听懂了吗？')),
            h('div', { class: 'und-btns' },
              h('button', { class: 'btn' + (v === 'y' ? ' green' : ' ghost'), onclick: function () { pick('y'); } }, '✅ ' + L('Yes', '是')),
              h('button', { class: 'btn' + (v === 'n' ? ' orange' : ' ghost'), onclick: function () { pick('n'); } }, '❓ ' + L('No', '不是'))),
            v === 'n' ? h('div', { class: 'small und-note' }, L('Thank you for telling us. Roy will explain this again in class.', '谢谢你告诉我们。Roy 老师上课会再讲一遍。')) : null);
        }
        function pick(v) {
          if (saved[x.k] === v) return;
          saved[x.k] = v; lsSet(store, saved); paint();
          record('Understood: ' + code + ' · ' + en, 'understand', v === 'y' ? 1 : 0, 1, 0, v === 'y' ? [] : ['No']);
        }
        paint();
        return row;
      })));
  }
  /* Every "No" (latest answer per page) between the previous class day and this one. */
  function notUnderstood(fromDate, toDate) {
    var rows = [];
    ['tut_' + STUDENT_ID + '_results'].forEach(function (k) {
      var log = []; try { log = JSON.parse(localStorage.getItem(k) || '[]') || []; } catch (e) {}
      log.forEach(function (r) { if (r.week === 'understand') rows.push({ when: r.time, act: r.activity, ok: r.score === 1 }); });
    });
    (REMOTE.und || []).forEach(function (r) { rows.push(r); });
    rows.sort(function (p, q) { return String(p.when) < String(q.when) ? -1 : 1; });
    var last = {};
    rows.forEach(function (r) { last[r.act] = r; });
    return Object.keys(last).map(function (k) { return last[k]; }).filter(function (r) {
      var d = String(r.when).slice(0, 10);
      return !r.ok && (!fromDate || d >= fromDate) && d < toDate;   /* a No goes to the NEXT class after it was tapped */
    });
  }
  function goOverBlock(all, d) {
    var cls = all.filter(function (x) { return x.d.kind !== 'homework'; }).map(function (x) { return x.d.date; }).sort();
    var prev = cls.filter(function (c) { return c < d.date; }).pop() || '';
    var list = notUnderstood(prev, d.date);
    if (!list.length) return null;
    return h('div', { class: 'card plan und-goover' },
      h('h2', null, '❓ ' + L('Go over these again', '要再讲一遍的内容')),
      h('p', { class: 'small muted' }, E('She tapped "No, I did not understand" on these pages since the last class. Start the class with them.',
        '上次上课以后，她在这些页面点了“没听懂”。上课先讲这些。')),
      h('ul', { class: 'und-goover-list' }, list.map(function (r) {
        var m = /^Understood: (\S+) · (.*)$/.exec(r.act) || [];
        return h('li', null, m[1] ? h('a', { href: '#/book/' + m[1] }, '📖 ' + m[1] + '  ' + m[2]) : r.act, h('small', { class: 'muted' }, '   ' + niceWhen(r.when)));
      })));
  }
  /* Class day: every try of every quiz on that day (this device, both logins, plus the score sheet), latest first. */
  function classTries(w, a) {
    var en = typeof a.title === 'string' ? a.title : (a.title || {}).en, out = [], seen = {};
    function add1(t) {
      var sg = [t.when, t.right, t.total, t.secs].join('|');
      if ((t.id && seen['i' + t.id]) || seen['s' + sg]) { if (t.wrong) out.forEach(function (o) { if (([o.when, o.right, o.total, o.secs].join('|') === sg || (t.id && o.id === t.id)) && !o.wrong) o.wrong = t.wrong; }); return; }
      if (t.id) seen['i' + t.id] = 1; seen['s' + sg] = 1; out.push(t);
    }
    if (a.type === 'hwquiz') {
      hwTries(w.week, a).forEach(function (t, n) { add1({ when: t.when, right: t.right, total: t.total, secs: t.secs, id: t.id, href: tryHref(w.week, a.id, n + 1) }); });
    } else {
      ['tut_' + STUDENT_ID + '_results', 'tut_' + STUDENT_ID + '_roy_results'].forEach(function (k) {
        var log = []; try { log = JSON.parse(localStorage.getItem(k) || '[]') || []; } catch (e) {}
        log.forEach(function (r) { if (r.week === w.week && r.activity === en) add1({ when: r.time, right: r.score, total: r.total, secs: r.seconds, id: r.id, wrong: r.wrong, who: r.who }); });
      });
      (REMOTE.cls[w.week + '|' + en] || []).forEach(function (t) { add1(t); });
    }
    out.sort(function (p, q) { return String(p.when) < String(q.when) ? -1 : 1; });
    return out;
  }
  function classTriesBlock(w, acts) {
    var blocks = acts.filter(function (a) { return a.type === 'quiz' || a.type === 'hwquiz'; }).map(function (a) {
      var tries = classTries(w, a);
      if (!tries.length) return null;
      var latest = tries[tries.length - 1];
      return h('div', { class: 'ct-act' },
        h('div', { class: 'ct-title' }, (a.icon || '⚡') + ' ', bi(a.title)),
        h('div', { class: 'ct-latest' }, L('Latest try: ', '最新一次：'), h('b', { class: latest.right === latest.total ? 'ts-ok' : 'ts-bad' }, latest.right + ' / ' + latest.total),
          h('small', { class: 'muted' }, '  🕒 ' + niceWhen(latest.when) + '  ⏱️ ' + fmtTime(latest.secs))),
        h('div', { class: 'try-steps ct' }, tries.map(function (t, i) {
          var head = h('summary', { class: 'try-step' + (t === latest ? ' latest' : '') },
            h('b', null, (ORD_EN[i] ? L(ORD_EN[i] + ' try', '第' + ORD_ZH[i] + '次') : L('Try ' + (i + 1), '第 ' + (i + 1) + ' 次')) + ': '),
            h('span', { class: t.right === t.total ? 'ts-ok' : 'ts-bad' }, t.right + ' / ' + t.total),
            h('small', { class: 'muted' }, '  🕒 ' + niceWhen(t.when) + '  ⏱️ ' + fmtTime(t.secs) + (t.who === TEACHER_NAME ? '  (Roy)' : '')),
            t === latest ? h('small', { class: 'ts-latest' }, '  ' + L('latest', '最新')) : null);
          var body;
          if (t.href) body = h('div', { class: 'ct-body' }, h('a', { class: 'step-link go', href: t.href }, '📋 ' + L('See every question and answer', '看每道题和答案')));
          else if (t.wrong && t.wrong.length) body = h('div', { class: 'ct-body' }, t.wrong.map(function (x, n) {
            return h('div', { class: 'wrong-item' },
              h('div', { class: 'wq' }, h('span', { class: 'wn' }, String(n + 1)), QT(x)),
              h('div', { class: 'wa bad' }, h('small', null, L('Her answer', '她的答案')), x.your == null ? L('(no answer)', '（没有作答）') : OT(x, x.your)),
              h('div', { class: 'wa good' }, h('small', null, L('Right answer', '正确答案')), OT(x, x.right)),
              whyBox(x, x.your));
          }));
          else if (t.missedText) body = h('div', { class: 'ct-body' }, h('div', { class: 'small muted' }, L('Questions she got wrong:', '她做错的题：')),
            h('ul', { class: 'ct-missed' }, t.missedText.split(/, (?=Q\d+ )/).map(function (m) { return h('li', null, m); })));
          else body = h('div', { class: 'ct-body small muted' }, t.right === t.total ? L('All right! 🌟', '全对！🌟') : L('Details are on the device she used.', '详细内容在她用的那台设备上。'));
          return h('details', { class: 'ct-try' }, head, body);
        })));
    }).filter(Boolean);
    if (!blocks.length) return null;
    return h('li', null, h('div', { class: 'step-t' }, E('Tries in class today: every score, latest first at the top. Tap a try to see what was wrong.', '今天课上的每次成绩：最新的在上面。点一次看哪里错了。')), blocks);
  }
  /* The plan for one day: what to read, what to practise, what to hand in. Used on Today and on the day page. */
  function dayPlan(x, big) {
    var w = x.w, d = x.d, s = x.s, hw = d.kind === 'homework';
    var acts = (d.activities || []).map(function (id) { return actById(w, id); }).filter(Boolean);
    var quizzes = acts.filter(function (a) { return a.type === 'hwquiz'; });
    var practice = acts.filter(function (a) { return a.type !== 'hwquiz'; });
    var link = function (href, label, cls) { return h('a', { class: 'step-link ' + (cls || ''), href: href }, label); };
    var numbered = function (a, n) {
      var title = a.title || '', en = typeof title === 'string' ? title : title.en || '';
      return h('span', null, (a.icon || ICONS[a.type] || '⭐') + ' ' + (/^\d+\./.test(en) ? '' : (n + 1) + '. '), bi(title));
    };
    var book = (d.book || []).map(function (c) { return link('#/book/' + c, '📖 ' + c); });
    var steps = [];
    if (hw) {
      if (book.length) steps.push(h('li', null, h('div', { class: 'step-t' }, E('Read the Main Book', '读主课本')), h('div', { class: 'step-links' }, book)));
      if (practice.length) steps.push(h('li', null, h('div', { class: 'step-t' }, E('Practise (optional)', '练习（自选）')),
        h('div', { class: 'step-links' }, practice.map(function (a, n) { return link('#/w/' + w.week + '/' + a.id, numbered(a, n)); }))));
      var lastTry = null;
      quizzes.forEach(function (a) {
        var tries = hwTries(w.week, a), last = tries[tries.length - 1], n = (a.questions || []).length;
        var draft = lsGet(hwKeys(w.week, a.id).draft, null), href = '#/w/' + w.week + '/' + a.id, btns = [];
        if (draft) btns.push(link(href, '▶️ ' + L('Continue the quiz', '继续做小测'), 'go'));
        else if (!last) btns.push(link(href, '▶️ ' + L('Start the quiz', '开始小测'), 'go'));
        else btns.push(link(tryHref(w.week, a.id, tries.length), '✅ ' + L('Done', '完成') + ' · ' + last.right + ' / ' + last.total + ' · ' + L('see every answer', '看每道题'), 'done'),
          link(href, '🔁 ' + L('Try again', '再做一次')));
        if (last) lastTry = tryHref(w.week, a.id, tries.length);
        steps.push(h('li', null, h('div', { class: 'step-t' }, E('Homework quiz: ' + n + ' questions. Try it as many times as you like.', '作业小测：' + n + ' 道题。可以做很多次。')),
          h('div', { class: 'step-links' }, btns)));
      });
      if (quizzes.length) steps.push(h('li', null, h('div', { class: 'step-t' }, E('Review: look at every answer and the right answers', '讲评：看每道题和正确答案')),
        h('div', { class: 'step-links' }, lastTry ? link(lastTry, '📋 ' + L('Open my Homework Review', '打开我的作业讲评'), 'go')
          : h('span', { class: 'muted small' }, L('Opens after you finish the quiz.', '做完小测后打开。')))));
    } else {
      if (book.length) steps.push(h('li', null, h('div', { class: 'step-t' }, E('Learn with Roy: Main Book', '和 Roy 一起学：主课本')), h('div', { class: 'step-links' }, book)));
      if (acts.length) steps.push(h('li', null, h('div', { class: 'step-t' }, E('Class practice with Roy', '和 Roy 一起练习')),
        h('div', { class: 'step-links' }, acts.map(function (a, n) { return link('#/w/' + w.week + '/' + a.id, numbered(a, n)); }))));
      if (big) { var ct = classTriesBlock(w, acts); if (ct) steps.push(ct); }
    }
    var mins = minutes(d);
    return h('div', { class: 'card plan' + (big ? ' big' : '') },
      h('div', { class: 'plan-head' },
        h('div', null, h('div', { class: 'plan-kind' }, hw ? E('Homework', '作业') : E('Class with Roy', '和 Roy 老师上课')),
          h(big ? 'h1' : 'h2', null, dayLabel(d.date)), d.title ? h('p', { class: 'plan-title' }, bi(d.title)) : null),
        statusChip(x)),
      hw ? h('div', { class: 'box teach' }, E('Do it here on this website' + (mins ? ', about ' + mins + ' minutes' : '') + '. You do not need to print anything.',
                                              '就在这个网站上做' + (mins ? '，大约 ' + mins + ' 分钟' : '') + '。不需要打印任何东西。'))
         : h('div', { class: 'box teach' }, E('Roy goes through this with you in class. Nothing to do before class.', 'Roy 老师上课时和你一起做。上课前不用做任何事。')),
      steps.length ? h('ol', { class: 'plan-steps' }, steps) : null);
  }

  /* ---------------- Today ---------------- */
  function renderToday() {
    var holder = h('div', null, h('p', { class: 'muted' }, '…'));
    show(h('div', { class: 'page-head' },
        h('h1', null, (S.who === 'roy' ? 'Hi Lawrence' : 'Hi ' + S.student.name) + ' 👋'),
        h('p', { class: 'muted' }, dayLabel(todayISO()))),
      S.who === 'roy' ? h('div', { class: 'box hint' }, E('Teacher login (LAWRENCE). Your tries are kept apart from ' + loginName() + "'s. Her scores reach your Google Sheet.",
        '老师登录（LAWRENCE）。你做的题和 ' + loginName() + ' 的分开保存。她的成绩会发到你的 Google 表格。')) : null,
      holder);
    allDays().then(function (all) {
      var today = todayISO();
      var late = all.filter(function (x) { return x.d.date < today && x.s && !x.s.done; });
      var now = all.filter(function (x) { return x.d.date === today; })[0];
      var next = all.filter(function (x) { return x.d.date > today; })[0];
      var out = [];
      var monday = mondayOf(today);
      var wkHw = all.filter(function (x) { return mondayOf(x.d.date) === monday && x.s && x.d.kind === 'homework'; });
      var wkDone = wkHw.filter(function (x) { return x.s.done; }).length;
      var nextClass = all.filter(function (x) { return x.d.date >= today && x.d.kind !== 'homework'; })[0];
      if (wkHw.length || nextClass) out.push(h('div', { class: 'card progress-card' },
        wkHw.length ? h('div', { class: 'pc-item' }, h('div', { class: 'pc-label' }, E('Homework this week', '本周作业')),
          h('div', { class: 'pc-big' }, wkDone + ' / ' + wkHw.length, h('small', null, ' ' + L('finished', '已完成'))),
          h('div', { class: 'pc-bar' }, h('div', { style: 'width:' + Math.round(100 * wkDone / wkHw.length) + '%' }))) : null,
        late.length ? h('div', { class: 'pc-item' }, h('div', { class: 'pc-label' }, E('Late homework', '逾期作业')),
          h('div', { class: 'pc-big late' }, String(late.length)), h('div', { class: 'small muted' }, L('Do the oldest first', '先做最早的'))) : null,
        nextClass ? h('div', { class: 'pc-item' }, h('div', { class: 'pc-label' }, E('Next class with Roy', '下次和 Roy 上课')),
          h('div', { class: 'pc-date' }, dayLabel(nextClass.d.date)), nextClass.d.title ? h('div', { class: 'small muted' }, tx(nextClass.d.title)) : null) : null));
      if (late.length) out.push(h('h2', { class: 'sec' }, E('Finish this first', '先完成这个')), dayPlan(late[0]),
        late.length > 1 ? h('p', { class: 'muted small' }, L('Also not done yet: ', '还没做完的还有：') + late.slice(1).map(function (x) { return dayLabel(x.d.date); }).join(', ')) : null);
      out.push(h('h2', { class: 'sec' }, E('Today', '今天')));
      if (now) out.push(dayPlan(now));
      else out.push(h('div', { class: 'card empty-today' }, E('No homework and no class today. 🎉', '今天没有作业，也没有课。🎉')));
      if (next && !now) out.push(h('h2', { class: 'sec' }, E('Coming next', '接下来')), dayPlan(next));
      var thisMonday = mondayOf(today);
      var wk = all.filter(function (x) { return mondayOf(x.d.date) === thisMonday; });
      if (wk.length) out.push(h('h2', { class: 'sec' }, E('This week', '本周')), h('div', { class: 'card list' }, wk.map(dayRow)));
      clear(holder); add(holder, out);
    }).catch(function () { clear(holder); holder.appendChild(h('p', null, T('loadError'))); });
  }

  /* ---------------- Homework / Class lists ---------------- */
  /* Homework, Class and Calendar pages: a list in date order (one line per day, grouped by week, today marked)
     or a month calendar. The choice is remembered on this device. */
  function renderDayList(kind) {
    var hw = kind === 'homework', cl = kind === 'class';
    var vk = key('view_' + kind), view = lsGet(vk, kind === 'all' ? 'cal' : 'list');
    var title = hw ? E('Homework', '作业') : cl ? E('Class with Roy', '和 Roy 老师上课') : E('Calendar', '日历');
    var sub = hw ? E('Every homework in date order. Do them one by one, oldest first.', '所有作业按日期排列。从最早的开始，一个一个做。')
      : cl ? E('Every class in date order.', '所有课程按日期排列。') : E('All homework and classes.', '所有作业和课程。');
    var body = h('div', null, h('p', { class: 'muted' }, '…'));
    function toggle(v, icon, en, zh) { return h('button', { class: 'chip' + (view === v ? ' on' : ''), onclick: function () { lsSet(vk, v); renderDayList(kind); } }, icon + ' ' + L(en, zh)); }
    show(h('div', { class: 'page-head' }, h('h1', null, title), h('p', { class: 'muted' }, sub)),
      h('div', { class: 'chips view-toggle' }, toggle('list', '📋', 'List', '列表'), toggle('cal', '📅', 'Calendar', '日历')), body);
    allDays().then(function (all) {
      var list = all.filter(function (x) { return hw ? x.d.kind === 'homework' : cl ? x.d.kind !== 'homework' : true; });
      clear(body);
      if (!list.length) return add(body, h('div', { class: 'card' }, L('Nothing here yet.', '这里还没有内容。')));
      if (view === 'cal') return calendarView(list, body);
      add(body, dayListByWeek(list));
      var t = todayISO(), target = list.filter(function (x) { return x.d.date >= t; })[0];
      if (target) setTimeout(function () { var el = body.querySelector('[data-date="' + target.d.date + '"]'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); }, 60);
    }).catch(renderError);
  }
  function mondayOf(iso) { var d = isoDate(iso); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayListByWeek(list) {
    var groups = [], cur = null;
    list.forEach(function (x) { var m = mondayOf(x.d.date); if (!cur || cur.m !== m) groups.push(cur = { m: m, items: [] }); cur.items.push(x); });
    var thisMon = mondayOf(todayISO());
    return groups.map(function (g) {
      return h('section', { class: 'week-group' }, h('h2', { class: 'sec' }, (g.m === thisMon ? '⭐ ' + L('This week', '本周') + ': ' : L('Week', '周') + ': ') + weekLabel(g.m)),
        h('div', { class: 'card list' }, g.items.map(dayRow)));
    });
  }
  function calendarView(list, holder) {
    var byDate = {};
    list.forEach(function (x) { (byDate[x.d.date] = byDate[x.d.date] || []).push(x); });
    var today = todayISO();
    function paint(ym) {
      S.calMonth = ym; clear(holder);
      var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1, first = new Date(y, m, 1), offset = (first.getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate();
      var prev = new Date(y, m - 1, 1), next = new Date(y, m + 1, 1);
      var ymOf = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
      var grid = h('div', { class: 'cal-grid' });
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(function (d, i) { grid.appendChild(h('div', { class: 'cal-dow' }, d, dual() ? h('small', null, ['一', '二', '三', '四', '五', '六', '日'][i]) : null)); });
      for (var b = 0; b < offset; b++) grid.appendChild(h('div', { class: 'cal-cell blank' }));
      for (var day = 1; day <= n; day++) {
        var iso = y + '-' + pad(m + 1) + '-' + pad(day), items = byDate[iso] || [];
        grid.appendChild(h('div', { class: 'cal-cell' + (iso === today ? ' today' : '') + (items.length ? ' has' : '') },
          h('div', { class: 'cal-num' }, String(day)),
          items.map(function (x) {
            var hwk = x.d.kind === 'homework', s = x.s, st = !hwk ? 'cl' : s && s.done ? 'done' : (iso < today ? 'late' : 'todo');
            return h('a', { class: 'cal-item ' + st, href: '#/w/' + x.w.week + '/day/' + x.d.date, title: x.d.title && x.d.title.en || '' },
              h('span', { class: 'ci-ico' }, hwk ? (s && s.done ? '✅' : '🏠') : '👩‍🏫'), h('span', { class: 'ci-t' }, x.d.title && x.d.title.en || ''));
          })));
      }
      add(holder, h('div', { class: 'card cal' },
        h('div', { class: 'cal-head' },
          h('button', { class: 'btn ghost', onclick: function () { paint(ymOf(prev)); } }, '‹'),
          h('h2', null, MONTHS[m] + ' ' + y + (dual() ? ' / ' + y + '年' + (m + 1) + '月' : '')),
          h('button', { class: 'btn ghost', onclick: function () { paint(ymOf(next)); } }, '›')),
        grid,
        h('div', { class: 'cal-legend small muted' }, '🏠 ' + L('Homework', '作业') + '   👩‍🏫 ' + L('Class with Roy', '和 Roy 上课') + '   ✅ ' + L('Done', '完成') + '   ' + L('Red = not done yet', '红色 = 还没做'))),
        h('p', { class: 'muted small' }, E('Tap a day to open it. Use the List button to see everything line by line.', '点某一天打开。点“列表”可以一行一行看。')));
    }
    paint(S.calMonth || today.slice(0, 7));
  }

  /* ---------------- one day ---------------- */
  function renderDay(w, date) {
    var d = (w.days || []).filter(function (x) { return x.date === date; })[0];
    if (!d) return renderError();
    S.nav = d.kind === 'homework' ? 'homework' : 'class'; setNav(S.nav);
    if (d.kind !== 'homework') refreshRemote();
    var x = { w: w, d: d, s: dayStatus(w, d) };
    var r = (w.reviews || []).filter(function (rv) { return rv.date === date && !rv.auto; })[0];
    var goHolder = h('div');
    show(backLink(d.kind === 'homework' ? '#/homework' : '#/class'), goHolder, dayPlan(x, true),
      r ? h('a', { class: 'step-link', href: '#/w/' + w.week + '/review/' + r.id }, '📋 ' + L("Roy's marking of this homework", 'Roy 老师批改的这份作业')) : null);
    if (d.kind !== 'homework') allDays().then(function (all) { var b = goOverBlock(all, d); if (b) add(goHolder, b); }).catch(function () {});
  }

  /* ---------------- My results ---------------- */
  function renderResults() {
    S.nav = 'results'; setNav('results');
    show(h('div', { class: 'page-head' }, h('h1', null, E('My results', '我的成绩')),
      h('p', { class: 'muted' }, E('Practice quizzes and games done on this device, newest first. Tap a row to see the questions that were wrong. Homework tries are in 📋 Homework Review.',
        '在这台设备上做的练习小测和游戏，最新的在上面。点一行看做错的题。作业在“📋 作业讲评”里。'))), h('p', { class: 'muted' }, '…'));
    allDays().then(function (all) {
      var rows = [];
      /* Homework tries live in Homework Review; this page is for the other quizzes and games. */
      lsGet(key('results'), []).forEach(function (r) {
        if (/^Homework: /.test(r.activity) || /^Homework review /.test(r.activity) || r.week === 'understand') return;
        rows.push({ time: r.time, who: r.who, title: r.activity, sub: '', score: r.score, total: r.total, wrong: r.wrong, missed: r.missed });
      });
      rows.sort(function (a, b) { return String(a.time) < String(b.time) ? 1 : -1; });
      main.removeChild(main.lastChild);
      if (!rows.length) return main.appendChild(h('div', { class: 'card' }, L('No results on this device yet. Do a quiz and it will show here.', '这台设备上还没有成绩。做一个小测，成绩就会出现在这里。')));
      main.appendChild(h('div', { class: 'card list' }, rows.map(function (r) {
        var nWrong = r.wrong ? r.wrong.length : (r.missed || []).length;
        var detail = h('div', { class: 'res-detail hidden' },
          r.wrong ? wrongList(r.wrong) : (r.missed && r.missed.length ? h('div', { class: 'box hint' }, h('b', null, L('Missed: ', '错的：')), r.missed.join(', ')) : wrongList([])));
        var head = h('button', { class: 'res-row', onclick: function () { detail.classList.toggle('hidden'); } },
          h('span', { class: 'dr-date' }, String(r.time).slice(0, 16)),
          h('span', { class: 'dr-title' }, h('span', { class: 'dr-kind' }, '👤 ' + r.who), r.title, r.sub ? h('small', { class: 'muted' }, r.sub) : null),
          chip(r.score + ' / ' + r.total + (nWrong ? '  ·  ' + nWrong + ' ' + L('wrong', '错') : ''), nWrong ? 'started' : 'done'));
        return h('div', { class: 'res' }, head, detail);
      })));
    }).catch(renderError);
  }

  /* ---------------- More practice ---------------- */
  function renderPractice() {
    var ids = weekIds();
    var weeksBox = h('div', null);
    show(h('div', { class: 'page-head' }, h('h1', null, E('More practice', '更多练习')), h('p', { class: 'muted' }, E('Extra games and practice. Never homework.', '额外的游戏和练习，不是作业。'))),
      h('div', { class: 'tiles' },
        h('a', { class: 'tile', href: '#/tables' }, h('span', { class: 'ico' }, '✖️'), h('span', null, T('tables'))),
        h('a', { class: 'tile', href: '#/bank/spelling' }, h('span', { class: 'ico' }, '🔤'), h('span', null, T('spellingBank'))),
        h('a', { class: 'tile', href: '#/bank/cards' }, h('span', { class: 'ico' }, '🃏'), h('span', null, T('cardsBank')))),
      weeksBox);
    ids.forEach(function (id) {
      var sec = h('section', null, h('h2', { class: 'sec' }, weekLabel(id)));
      weeksBox.appendChild(sec);
      loadWeek(id).then(function (w) {
        var tiles = h('div', { class: 'tiles' }, (w.activities || []).filter(function (a) { return a.type !== 'hwquiz'; }).map(function (a) { return actTile(w, a.id); }));
        sec.appendChild(tiles);
      }).catch(function () {});
    });
  }

  /* ---------------- home (old, kept for reference) ---------------- */
  function weekBlock(w) {
    var tiles = h('div', { class: 'tiles' });
    var inside = placedIds(w);
    (w.activities || []).filter(function (a) { return !inside[a.id]; }).forEach(function (a) {
      var icon = a.icon || ICONS[a.type] || '⭐';
      tiles.appendChild(h('a', { class: 'tile', href: '#/w/' + w.week + '/' + a.id },
        h('span', { class: 'ico', 'aria-hidden': 'true' }, icon), h('span', null, tx(a.title)),
        a.subtitle ? h('span', { class: 'sub' }, tx(a.subtitle)) : null));
    });
    return h('div', null,
      h('div', { class: 'card week-head' },
        h('h2', null, tx(w.title)),
        h('p', { class: 'muted' }, weekLabel(w.week)),
        w.message ? h('div', { class: 'box teach' }, bi(w.message)) : null),
      featureButtons(w),
      tiles.childNodes.length && featureButtons(w) ? h('h3', { class: 'section-title' }, '➕ ' + L('Optional extra practice (not homework)', '自选练习（不是作业）')) : null,
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
        h('a', { class: 'tile', href: '#/bank/cards' }, h('span', { class: 'ico' }, '🃏'), h('span', null, T('cardsBank'))),
        S.student.homeworkLog ? h('a', { class: 'tile', href: '#/log' }, h('span', { class: 'ico' }, '📒'), h('span', null, T('hwLog'))) : null));
    var bookBtn = S.student.mainBook ? h('a', { class: 'feature book', href: '#/book' }, h('span', { class: 'fico' }, '📖'),
      h('span', { class: 'ftext' }, h('span', { class: 'ftitle' }, L('Main Book', '主课本')), h('span', { class: 'fsub' }, L('Learn every key word, step by step', '一步一步学会每个关键词')))) : null;
    var schoolBtn = S.student.schoolHomework ? h('a', { class: 'feature school', href: '#/school' }, h('span', { class: 'fico' }, '🏫'),
      h('span', { class: 'ftext' }, h('span', { class: 'ftitle' }, L('School Homework', '学校作业')), h('span', { class: 'fsub' }, L('Learn it together, then copy onto paper', '一起学，再抄到作业纸上')))) : null;
    /* Students with "subjects" in student.json get one big button per subject first. */
    var subjects = S.student.subjects ? h('div', { class: 'subject-row' }, S.student.subjects.map(function (sb) {
      return h('a', { class: 'feature subject', href: '#/subject/' + sb.id }, h('span', { class: 'fico' }, sb.icon || '📚'),
        h('span', { class: 'ftext' }, h('span', { class: 'ftitle' }, tx(sb.title)), sb.sub ? h('span', { class: 'fsub' }, tx(sb.sub)) : null));
    })) : null;
    var libBtn = S.student.library ? h('a', { class: 'feature library', href: '#/library' }, h('span', { class: 'fico' }, '📚'),
      h('span', { class: 'ftext' }, h('span', { class: 'ftitle' }, L('Library', '资料库')), h('span', { class: 'fsub' }, L('Download or print every file, any time', '随时下载或打印所有资料')))) : null;
    show(todayCard(), subjects, h('div', { class: 'feature-row' }, bookBtn, schoolBtn, libBtn), thisWeek, anytime, past);
  }

  function renderWeek(w) { show(backLink(), weekBlock(w)); }

  function activityHeader(a, backHref) {
    return [backLink(backHref), h('h1', null, (a.icon || ICONS[a.type] || '') + ' ' + tx(a.title)),
      a.intro ? h('div', { class: 'box teach' }, bi(a.intro)) : null];
  }
  function renderActivity(w, id) {
    var a = (w.activities || []).filter(function (x) { return x.id === id; })[0];
    if (!a) return renderError();
    var ctx = { week: w.week, name: tx(a.title), en: (typeof a.title === 'string' ? a.title : a.title.en), back: placedIds(w)[a.id] || '#/' };
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
    var st = keep('cards');
    function round(cards) {
      st = keep('cards', function () { return { deck: shuffle(cards.slice()), i: 0, marks: {}, flipped: false }; }, true);
      paint();
    }
    function nextOpen() { return nextFree(st.deck.length, st.i, function (k) { return st.marks[k] != null; }); }
    function paint() {
      if (st.ended) return end();
      var deck = st.deck, i = st.i, c = deck[i];
      var know = Object.keys(st.marks).filter(function (k) { return st.marks[k]; }).length;
      var learning = Object.keys(st.marks).length - know;
      clear(area);
      var card = h('div', { class: 'flash' + (st.flipped ? ' back' : ''), role: 'button', tabindex: '0', onclick: flip, onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } } });
      if (!st.flipped) {
        add(card, [h('div', { class: 'front' }, c.front),
          h('button', { class: 'btn ghost', style: 'margin-top:14px', onclick: function (e) { e.stopPropagation(); say(c.front); } }, T('hear')),
          h('div', { class: 'tap' }, T('tapFlip'))]);
      } else {
        add(card, [h('div', { class: 'meaning' }, c.back),
          bilingual() && (c.zh || c.zhBack) ? h('div', { class: 'zh', lang: 'zh' }, [c.zh, c.zhBack].filter(Boolean).join('：')) : null,
          h('div', { class: 'tap' }, T('tapFlip'))]);
      }
      add(area, h('div', { class: 'card' },
        numStrip(deck.length, i, function (k) { return st.marks[k] == null ? '' : st.marks[k] ? 'ok' : 'warn'; }, function (k) { st.i = k; st.flipped = false; paint(); }),
        h('div', { class: 'stats' }, (i + 1) + ' / ' + deck.length + '   ✅ ' + know + '   😅 ' + learning),
        card,
        h('div', { class: 'row center' },
          h('button', { class: 'btn big red', onclick: function () { mark(false); } }, T('learning')),
          h('button', { class: 'btn big green', onclick: function () { mark(true); } }, T('know'))),
        h('div', { class: 'row center' }, h('button', { class: 'btn ghost', onclick: function () { round(a.cards); } }, T('shuffle')))));
    }
    function flip() { st.flipped = !st.flipped; paint(); }
    function mark(k) {
      st.marks[st.i] = k; st.flipped = false;
      var n = nextOpen();
      if (n < 0) { st.ended = true; return end(); }
      st.i = n; paint();
    }
    function end() {
      var deck = st.deck, learnList = deck.filter(function (_, k) { return st.marks[k] === false; });
      var know = deck.length - learnList.length;
      clear(area);
      add(area, h('div', { class: 'card center' },
        h('h2', null, learnList.length ? '👍 ' + know + ' / ' + deck.length : '🏆 ' + T('knowAll')),
        h('p', { class: 'praise' }, praise()), canNow(a),
        learnList.length ? h('div', { class: 'box hint' }, h('b', null, T('learning') + ': '), learnList.map(function (c) { return c.front; }).join(', ')) : null,
        h('div', { class: 'row center' },
          learnList.length ? h('button', { class: 'btn big', onclick: function () { round(learnList); } }, T('practiseLearning')) : null,
          h('button', { class: 'btn big ghost', onclick: function () { round(a.cards); } }, T('again')))));
    }
    if (st) paint(); else round(a.cards);
  };

  /* ---------- 3. MATCH GAME ---------- */
  ACT.match = function (a, ctx, area) {
    var bestKey = key('best_' + ctx.week + '_' + a.id);
    function game() {
      var n = Math.min(a.size || 6, a.pairs.length);
      var pairs = shuffle(a.pairs.slice()).slice(0, n).map(function (p, idx) { return { id: idx, a: p.a, b: p.b, bzh: p.bzh }; });
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
        t.el = h('button', { class: 'mtile ' + kind, onclick: function () { tap(t); } }, kind === 'term' ? p.a : h('span', null, p.b, p.bzh && dual() ? h('span', { class: 'zh-sub', lang: 'zh' }, p.bzh) : null));
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
    var timed = a.timed !== false, SECS = a.seconds || 20, timer = null;
    var st = keep('quiz');
    /* time used on the question on screen is added up when she leaves it */
    function leave() { clearInterval(timer); if (st && st.qStart) { st.used[st.i] = (st.used[st.i] || 0) + (Date.now() - st.qStart) / 1000; st.qStart = 0; } }
    S.cleanup = leave;
    function start() {
      st = keep('quiz', function () {
        var pool = a.shuffle === false ? a.questions.slice() : shuffle(a.questions.slice());
        var qs = pool.slice(0, Math.min(a.count || pool.length, pool.length));
        return { qs: qs, i: 0, points: 0, streak: 0, correct: 0, ans: {}, gain: {}, order: {}, used: {}, t0: Date.now() };
      }, true);
      ask();
    }
    function go(k) { leave(); st.i = k; ask(); window.scrollTo(0, 0); }
    function nextQ() { leave(); var n = nextFree(st.qs.length, st.i, function (k) { return st.ans[k] != null; }); if (n < 0) end(); else go(n); }
    function ask() {
      if (st.ended) return end();
      clearInterval(timer);
      var i = st.i, q = st.qs[i];
      if (!st.order[i]) st.order[i] = shuffle(q.options.map(function (_, j) { return j; }));
      var order = st.order[i], right = order.indexOf(q.answer);
      clear(area);
      var bar = h('div', { class: 'progress timerbar' }, h('div', { style: 'width:100%' }));
      var fb = h('div', { 'aria-live': 'polite' });
      var btns = order.map(function (oi, k) {
        return h('button', { class: 'ansbtn c' + (k % 4), onclick: function () { choose(k); } },
          h('span', { class: 'shape', 'aria-hidden': 'true' }, SHAPES[k % 4]), h('span', null, OT(q, q.options[oi])));
      });
      add(area, h('div', { class: 'card' },
        numStrip(st.qs.length, i, function (k) { return st.ans[k] == null ? '' : st.ans[k] === st.order[k].indexOf(st.qs[k].answer) ? 'ok' : 'bad'; }, go),
        h('div', { class: 'stats' }, h('span', null, (i + 1) + ' / ' + st.qs.length),
          timed ? h('span', null, '⭐ ' + st.points + ' ' + T('points')) : h('span', null, '✅ ' + st.correct),
          timed && st.streak > 1 ? h('span', null, '🔥 ' + T('streak') + ' ' + st.streak) : null),
        timed ? bar : h('div', { class: 'progress' }, h('div', { style: 'width:' + (100 * Object.keys(st.ans).length / st.qs.length) + '%' })),
        q.context ? h('div', { class: 'box teach' }, rich(q.context)) : null,
        h('div', { class: 'box q' }, QT(q)),
        h('div', { class: 'answers' }, btns), fb));
      if (st.ans[i] != null) return result(st.ans[i]);
      st.qStart = Date.now();
      if (timed) {
        timer = setInterval(function () {
          var left = SECS - (st.used[i] || 0) - (Date.now() - st.qStart) / 1000;
          bar.firstChild.style.width = Math.max(0, 100 * left / SECS) + '%';
          if (left <= 0) choose(-1);
        }, 100);
      }
      function choose(k) {
        if (st.ans[i] != null) return;
        leave();
        st.ans[i] = k;
        var ok = k === right, el = st.used[i] || 0;
        if (ok) {
          st.correct++; st.streak++;
          if (timed) { st.gain[i] = Math.round(1000 * (1 - Math.min(el, SECS) / SECS / 2)) + Math.min(st.streak - 1, 5) * 100; st.points += st.gain[i]; }
        } else st.streak = 0;
        result(k);
        fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      function result(k) {
        var ok = k === right, gained = st.gain[i] || 0;
        bar.firstChild.style.width = '0%';
        allColour(btns, ok);
        var left = nextFree(st.qs.length, i, function (n) { return st.ans[n] != null; });
        add(fb, h('div', { class: 'box ' + (ok ? 'ans pop' : 'bad') },
          h('div', { class: ok ? 'praise' : 'oops' }, ok ? '⭐ ' + praise() + (gained ? '  +' + gained : '') : (k < 0 ? '⏰ ' + T('timeUp') + ' ' : '') + T('notQuite')),
          !ok ? h('div', { class: 'q-text' }, '✅ ', OT(q, q.options[q.answer])) : null,
          whyBox(q, k < 0 ? null : q.options[st.order[i][k]], 'why-box')),
          h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: nextQ }, left >= 0 ? T('next') : T('finish'))));
      }
    }
    function end() {
      leave();
      var qs = st.qs, missed = [];
      qs.forEach(function (q, k) { if (st.ans[k] !== st.order[k].indexOf(q.answer)) missed.push('Q' + (k + 1) + ' ' + String(q.q).slice(0, 40)); });
      if (!st.ended) {
        st.ended = true;
        var wrongItems = [];
        qs.forEach(function (q, k) {
          var picked = st.ans[k], oi = picked == null || picked < 0 ? null : st.order[k][picked];
          if (oi !== q.answer) wrongItems.push({ q: q.q, qzh: q.qzh, ozh: q.ozh, your: oi == null ? null : q.options[oi], right: q.options[q.answer], why: q.why, wrongWhy: oi == null || !q.wrong ? undefined : q.wrong[q.options[oi]] });
        });
        record(ctx.en, ctx.week, st.correct, qs.length, (Date.now() - st.t0) / 1000, missed, wrongItems);
      }
      clear(area);
      add(area, h('div', { class: 'card center' },
        h('h2', null, '🏁 ' + (st.correct === qs.length ? praise() : T('yourScore'))),
        timed ? h('div', { class: 'bigscore' }, st.points + ' ' + T('points')) : null,
        h('div', { class: timed ? 'praise' : 'bigscore' }, scoreText(st.correct, qs.length) + (timed ? ' ' + T('correctOf') : '')),
        h('p', { class: 'small muted' }, T('saved')), canNow(a),
        h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: start }, T('again')))));
    }
    if (st) return ask();
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
          return h('button', { class: 'ansbtn c' + (k % 4), onclick: function () { choose(k); } }, h('span', { class: 'shape' }, SHAPES[k % 4]), h('span', null, OT(q, q.options[oi])));
        });
        add(area, h('div', { class: 'card' },
          h('div', { class: 'stats' }, h('span', null, (i + 1) + ' / ' + a.questions.length), h('button', { class: 'btn ghost', onclick: passage2 }, '📖')),
          h('div', { class: 'box q' }, QT(q)), h('div', { class: 'answers' }, btns), fb));
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
            !ok ? h('div', { class: 'q-text' }, OT(q, q.options[q.answer])) : null,
            whyBox(q, q.options[order[k]], 'why-box')),
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
        h('div', { class: 'bigscore' }, scoreText(correct, a.questions.length)),
        h('p', { class: 'small muted' }, T('saved')), canNow(a),
        h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: keywords }, T('again')))));
    }
    keywords();
  };

  /* Bar model for fraction equations: {parts: 5, shaded: 3, fill: "3", label: "s"}.
     Draws `parts` equal boxes; the first `shaded` are coloured and show `fill`. */
  function barModel(b) {
    var boxes = [];
    for (var k = 0; k < b.parts; k++) {
      boxes.push(h('div', { class: 'barbox' + (k < b.shaded ? ' on' : '') }, k < b.shaded && b.fill ? rich(b.fill) : ''));
    }
    return h('div', { class: 'barmodel', role: 'img', 'aria-label': b.label ? b.label + ' = ' + b.parts + ' parts' : b.parts + ' parts' },
      b.label ? h('div', { class: 'barlabel' }, rich(b.label)) : null, h('div', { class: 'barrow' }, boxes));
  }

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
        h('div', { class: 'box q' }, QT(it)),
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
          add(steps, h('div', { class: 'box teach step' }, h('b', null, (dual() ? 'Step ' + (shown + 1) + ' / 第 ' + (shown + 1) + ' 步' : 'Step ' + (shown + 1)) + ': '), bi(s, true),
            s.bar ? barModel(s.bar) : null,
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

  /* =========== HOMEWORK REVIEW, WORKBOOK DAYS, HOMEWORK LOG =========== */
  function L(en, zh) { return dual() ? both(en, zh) : en; }
  var DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAYS_ZH = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  function dayLabel(iso) {
    var p = iso.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return L(DAYS_EN[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()], (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + DAYS_ZH[d.getDay()]);
  }
  /* Which activities live inside a workbook day or a review (so they are not shown twice), and where "Back" goes. */
  function placedIds(w) {
    var m = {};
    (w.days || []).forEach(function (d) { (d.activities || []).forEach(function (id) { m[id] = '#/w/' + w.week + '/day/' + d.date; }); });
    (w.reviews || []).forEach(function (r) { (r.practice || []).forEach(function (id) { if (!m[id]) m[id] = '#/w/' + w.week + '/review/' + r.id; }); });
    return m;
  }
  /* ---------- What is really finished. A homework day is finished only when its one-try quiz is
     submitted AND its Homework Review is done. Opening a page does not count. ---------- */
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayReview(w, d) { return (w.reviews || []).filter(function (r) { return r.date === d.date; })[0]; }
  function dayHw(w, d) {
    var acts = {}; (w.activities || []).forEach(function (a) { acts[a.id] = a; });
    return (d.activities || []).map(function (id) { return acts[id]; }).filter(function (a) { return a && a.type === 'hwquiz'; });
  }
  function dayStatus(w, d) {
    if (d.kind !== 'homework') return null;
    var hw = dayHw(w, d);
    if (!hw.length) return null;
    var tries = hw.map(function (a) { return hwTries(w.week, a); });
    var quiz = tries.every(function (t) { return t.length > 0; });
    var started = tries.some(function (t) { return t.length > 0; }) || hw.some(function (a) { return !!lsGet(hwKeys(w.week, a.id).draft, null); });
    var r = dayReview(w, d), reviewed = !!(r && selfScore(r));
    var right = 0, total = 0;
    hw.forEach(function (a, n) { var last = tries[n][tries[n].length - 1]; total += a.questions.length; if (last) right += last.right; });
    return { quiz: quiz, started: started, reviewed: reviewed, done: quiz, review: r, hw: hw, right: right, total: total, tries: tries };
  }
  function statusText(s) {
    if (!s) return '';
    if (s.done) return '✅ ' + L('Done', '完成') + ' · ' + s.right + ' / ' + s.total;
    if (s.started) return '🟠 ' + L('Started, not finished', '已开始，还没完成');
    return '⏳ ' + L('To do', '待做');
  }
  function kindLabel(d) { return d.kind === 'homework' ? '🏠 ' + L('Assigned homework', '布置的作业') : '📘 ' + L('Class with Roy', '和 Roy 老师上课'); }
  /* The "Today" card at the top of the home page: unfinished homework first (in date order), then today. */
  function todayCard() {
    var box = h('div', { class: 'card today' }, h('p', { class: 'muted' }, '…'));
    Promise.all(weekIds().map(function (id) { return loadWeek(id).catch(function () { return null; }); })).then(function (weeks) {
      var all = [];
      weeks.forEach(function (w) { if (w) (w.days || []).forEach(function (d) { all.push({ w: w, d: d, s: dayStatus(w, d) }); }); });
      all.sort(function (a, b) { return a.d.date > b.d.date ? 1 : -1; });
      var today = todayISO();
      var late = all.filter(function (x) { return x.d.date < today && x.s && !x.s.done; });
      var now = all.filter(function (x) { return x.d.date === today; })[0];
      var next = all.filter(function (x) { return x.d.date > today; })[0];
      function row(x, lead) {
        var href = '#/w/' + x.w.week + '/day/' + x.d.date, go = x.s && x.s.started ? '▶️ ' + L('Continue', '继续') : '▶️ ' + L('Start', '开始');
        return h('div', { class: 'today-row' },
          h('div', { class: 'today-text' }, h('div', { class: 'today-lead' }, lead),
            h('div', { class: 'today-title' }, kindLabel(x.d) + ': ' + dayLabel(x.d.date)),
            x.d.title ? h('div', { class: 'small' }, tx(x.d.title)) : null,
            x.s ? h('div', { class: 'small' }, statusText(x.s)) : null),
          h('a', { class: 'btn big', href: href }, go));
      }
      clear(box);
      add(box, [h('h2', null, '📅 ' + L('Today', '今天') + ': ' + dayLabel(today)),
        late.length ? [h('div', { class: 'box hint' }, bi({ en: 'Please work in date order. Finish the earliest homework first.', zh: '请按日期顺序做。先完成最早的作业。' })),
          row(late[0], L('Do this first', '先做这个')),
          late.length > 1 ? h('p', { class: 'small muted' }, L('Then: ', '然后：') + late.slice(1).map(function (x) { return dayLabel(x.d.date); }).join(', ')) : null] : null,
        now ? row(now, L('Today', '今天')) : h('p', null, L('No homework or class today.', '今天没有作业，也没有课。')),
        !now && next ? row(next, L('Next', '下一个')) : null]);
    }).catch(function () { clear(box); });
    return box;
  }
  function reviewItems(r) { var out = []; (r.pages || []).forEach(function (pg) { (pg.items || []).forEach(function (it) { out.push({ page: pg, it: it }); }); }); return out; }
  function reviewCount(r) {
    var all = reviewItems(r), right = all.filter(function (x) { return x.it.ok; }).length;
    return { right: right, total: all.length, wrong: all.length - right };
  }
  function starLine(c) { return '⭐ ' + L(c.right + ' of ' + c.total + ' stars', c.total + ' 颗星里得了 ' + c.right + ' 颗'); }
  function reviewStatus(r, week) {
    if (r.auto && !hwSubmitted(week, r)) return '🔒 ' + L('Do the homework quiz first', '先做作业小测');
    if (r.done === false) return '⏳ ' + L('Not done yet', '还没做');
    if (r.missing) return '🟡 ' + L('Part checked', '部分已批改');
    return '✅ ' + L('Done', '完成');
  }
  function featureButtons(w) {
    var out = [];
    if (w.reviews && w.reviews.length) {
      out.push(h('a', { class: 'feature review', href: '#/w/' + w.week + '/reviews' },
        h('span', { class: 'fico', 'aria-hidden': 'true' }, '📋'),
        h('span', { class: 'ftext' }, h('span', { class: 'ftitle' }, T('hwReview')), h('span', { class: 'fsub' }, L('Go through each question together', '一题一题一起看')))));
    }
    (w.days || []).slice().sort(function (a, b) { return a.date > b.date ? 1 : -1; }).forEach(function (d) {
      var hw = d.kind === 'homework';
      out.push(h('a', { class: 'feature ' + (hw ? 'homework' : 'workbook'), href: '#/w/' + w.week + '/day/' + d.date },
        h('span', { class: 'fico', 'aria-hidden': 'true' }, hw ? '🏠' : '📘'),
        h('span', { class: 'ftext' }, h('span', { class: 'ftitle' }, (hw ? L('Homework', '作业') : L('Class with Roy', '和 Roy 老师上课')) + ': ' + dayLabel(d.date)),
          d.title ? h('span', { class: 'fsub' }, tx(d.title)) : null,
          hw && dayStatus(w, d) ? h('span', { class: 'fsub' }, statusText(dayStatus(w, d))) : null)));
    });
    return out.length ? h('div', { class: 'feature-row' }, out) : null;
  }
  /* Today's Main Book: the chapters taught on this day, copied as buttons into the day page. */
  function dayBook(d) {
    if (!d.book || !d.book.length) return null;
    var row = h('div', { class: 'feature-row' });
    loadBook().then(function (b) {
      d.book.forEach(function (code) {
        var ch = b.chapters.filter(function (c) { return c.code === code; })[0];
        if (!ch) return;
        row.appendChild(h('a', { class: 'feature book', href: '#/book/' + code, onclick: function () { S.returnTo = { hash: location.hash, label: dayName(d) + ': ' + dayLabel(d.date) }; } }, h('span', { class: 'fico' }, '📖'),
          h('span', { class: 'ftext' }, h('span', { class: 'ftitle' }, L("Today's Main Book", '今天的主课本') + ': ' + code), h('span', { class: 'fsub' }, tx(ch.title)))));
      });
    }).catch(function () {});
    return h('div', null, h('h2', { class: 'section-title' }, '📖 ' + L("Today's Main Book (teach this first)", '今天的主课本（先讲这个）')), row,
      h('h2', { class: 'section-title' }, '✏️ ' + L("Today's practice", '今天的练习')));
  }
  function dayName(d) { return d.kind === 'homework' ? L('Homework', '作业') : L('Class with Roy', '和 Roy 老师上课'); }
  function actTile(w, id) {
    var a = (w.activities || []).filter(function (x) { return x.id === id; })[0];
    if (!a) return null;
    return h('a', { class: 'tile', href: '#/w/' + w.week + '/' + a.id },
      h('span', { class: 'ico', 'aria-hidden': 'true' }, a.icon || ICONS[a.type] || '⭐'), h('span', null, tx(a.title)),
      a.subtitle ? h('span', { class: 'sub' }, tx(a.subtitle)) : null);
  }
  function renderDayOld(w, date) {
    var d = (w.days || []).filter(function (x) { return x.date === date; })[0];
    if (!d) return renderError();
    var ids = d.activities || [];
    var first = ids[0] && (w.activities || []).filter(function (x) { return x.id === ids[0]; })[0];
    var start = first && first.type === 'lesson' ? h('a', { class: 'feature workbook start', href: '#/w/' + w.week + '/' + first.id },
      h('span', { class: 'fico' }, '▶️'), h('span', { class: 'ftext' }, h('span', { class: 'ftitle' }, L('Start here: ', '从这里开始：') + tx(first.title)),
        h('span', { class: 'fsub' }, d.kind === 'homework' ? L('Read this first', '先读这个') : L('Go through this with Roy first', '先和 Roy 老师一起看')))) : null;
    show(backLink(), h('h1', null, (d.kind === 'homework' ? '🏠 ' : '📘 ') + dayName(d) + ': ' + dayLabel(date)),
      d.title ? h('h2', null, tx(d.title)) : null,
      d.message ? h('div', { class: 'box teach' }, bi(d.message)) : null,
      daySteps(w, d),
      dayBook(d),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost', onclick: function () { shareLink(location.href, dayName(d) + ': ' + dayLabel(date)); } }, '🔗 ' + L('Share', '分享'))),
      start,
      h('div', { class: 'tiles' }, ids.slice(start ? 1 : 0).map(function (id) { return actTile(w, id); })));
  }
  function daySteps(w, d) {
    if (d.kind !== 'homework') {
      if (d.message) return null;   /* the day's own message already gives the class order */
      return h('div', { class: 'card steps' }, h('div', { class: 'steps-head' }, kindLabel(d)),
        h('ol', null, h('li', null, '📋 ' + L('Homework Review', '作业讲评')), h('li', null, '📖 ' + L('Main Book (below)', '主课本（下面）')),
          h('li', null, '✏️ ' + L('Workbook practice (below)', '练习册（下面）')), h('li', null, '🔁 ' + L('Review the workbook together', '一起讲评练习册'))));
    }
    var s = dayStatus(w, d);
    if (!s) return null;
    var quizHref = '#/w/' + w.week + '/' + s.hw[0].id, revHref = s.review ? '#/w/' + w.week + '/review/' + s.review.id : '#/w/' + w.week + '/reviews';
    var next = s.done ? h('div', { class: 'box ans' }, '✅ ' + L('All 4 steps are finished. Well done!', '4 步都完成了，真棒！'))
      : s.quiz ? h('a', { class: 'btn big', href: revHref }, L('Next: 📋 Homework Review', '下一步：📋 作业讲评'))
      : h('a', { class: 'btn big', href: quizHref }, s.started ? L('Next: continue the homework quiz', '下一步：继续作业小测') : L('After Learn and Practice: 🏠 homework quiz (one try)', '学习和练习之后：🏠 作业小测（只能做一次）'));
    function step(n, text, ok) { return h('li', { class: ok ? 'ok' : '' }, (ok ? '✅ ' : '') + text); }
    return h('div', { class: 'card steps' }, h('div', { class: 'steps-head' }, kindLabel(d) + '  ·  ' + statusText(s)),
      h('ol', null, step(1, '📖 ' + L('Learn: read today\'s Main Book chapters', '学习：读今天的主课本'), false),
        step(2, '✏️ ' + L('Practice: the activities below, in order', '练习：按顺序做下面的活动'), false),
        step(3, '🏠 ' + L('Quiz: the homework quiz, one try', '小测：作业小测，只能做一次'), s.quiz),
        step(4, '📋 ' + L('Review: check every answer and why in Homework Review', '讲评：在作业讲评里检查每个答案和原因'), s.reviewed)),
      h('div', { class: 'row center' }, next));
  }
  function selfScore(r) { return lsGet(key('rv_' + r.id), null); }
  function logTable(rows) {
    return h('table', { class: 'log' },
      h('tr', null, h('th', null, L('Homework', '作业')), h('th', null, L('Status', '状态')), h('th', null, L('Reviewed together', '一起讲评'))),
      rows.map(function (x) {
        var sc = selfScore(x.r);
        return h('tr', null,
          h('td', null, h('a', { href: '#/w/' + x.week + '/review/' + x.r.id }, dayLabel(x.r.date)), h('div', { class: 'small muted' }, tx(x.r.title))),
          h('td', null, reviewStatus(x.r, x.week)),
          h('td', null, sc ? '✅ ' + sc.right + ' / ' + sc.total : L('not yet', '还没有')));
      }));
  }
  function renderReviews(w) {
    var rows = (w.reviews || []).map(function (r) { return { r: r, week: w.week }; });
    show(backLink(), h('h1', null, '📋 ' + T('hwReview')),
      h('div', { class: 'box teach' }, bi({ en: 'Check your own homework, one day at a time, in date order. Answer first, then check the answer and the why, and score yourself. Understand and correct every mistake before class.', zh: '按日期顺序，一天一天地自己检查作业。先自己回答，再看答案和原因，然后给自己打分。上课前把每个错误都弄懂并改正。' })),
      h('div', { class: 'card' }, logTable(rows)),
      rows.map(function (x) {
        var sc = selfScore(x.r), n = reviewItems(x.r).length, locked = !hwSubmitted(w.week, x.r);
        return h('a', { class: 'feature review' + (locked ? ' locked' : ''), href: '#/w/' + w.week + '/review/' + x.r.id },
          h('span', { class: 'fico' }, locked ? '🔒' : '📝'),
          h('span', { class: 'ftext' }, h('span', { class: 'ftitle' }, dayLabel(x.r.date) + ': ' + tx(x.r.title)),
            h('span', { class: 'fsub' }, n + ' ' + L('questions', '道题') + (sc ? '  ·  ✅ ' + sc.right + ' / ' + sc.total : ''))));
      }));
  }
  function renderLog() {
    show(backLink(), h('p', { class: 'muted' }, '…'));
    Promise.all(weekIds().map(loadWeek)).then(function (weeks) {
      var rows = [];
      weeks.forEach(function (w) { (w.reviews || []).forEach(function (r) { rows.push({ r: r, week: w.week }); }); });
      rows.sort(function (a, b) { return a.r.date < b.r.date ? 1 : -1; });
      show(backLink(), h('h1', null, '📒 ' + T('hwLog')),
        h('div', { class: 'card' }, rows.length ? logTable(rows) : h('p', null, L('No homework yet.', '还没有作业。'))));
    }).catch(renderError);
  }
  /* Homework Review: go through each question together. Answer first, then reveal the answer and why, then score yourself. */
  function renderReview(w, id) {
    var r = (w.reviews || []).filter(function (x) { return x.id === id; })[0];
    if (!r) return renderError();
    if (!hwSubmitted(w.week, r)) {
      var day = (w.days || []).filter(function (d) { return d.date === r.date; })[0];
      return show(backLink('#/w/' + w.week + '/reviews'), h('h1', null, '🔒 ' + dayLabel(r.date)),
        h('div', { class: 'box hint' }, bi({ en: 'Do this day\'s homework quiz first. Then come back here to check your answers and correct your mistakes.', zh: '先做这一天的作业小测。做完再回来检查答案、改正错误。' })),
        day ? h('div', { class: 'row center' }, h('a', { class: 'btn big', href: '#/w/' + w.week + '/day/' + day.date }, '🏠 ' + L('Go to the homework', '去做作业'))) : null);
    }
    var items = reviewItems(r);
    var st = keep('review', function () { return { i: 0, marks: {}, t0: Date.now() }; });
    var head = [backLink('#/w/' + w.week + '/reviews'), h('h1', null, '📝 ' + dayLabel(r.date)), h('h2', null, tx(r.title))];
    var area = h('div');
    show(head, r.message ? h('div', { class: 'box teach' }, bi(r.message)) : null, area);
    function one() {
      if (st.ended) return end();
      clear(area);
      var i = st.i, x = items[i], it = x.it, shown = false, picked = null;
      var fb = h('div');
      var opts = it.options ? it.options.map(function (o, k) {
        return h('button', { class: 'ansbtn c' + (k % 4), onclick: function () { if (shown) return; picked = k; reveal(); } }, h('span', { class: 'shape' }, SHAPES[k % 4]), h('span', null, OT(it, o)));
      }) : null;
      function reveal() {
        shown = true; clear(fb);
        var auto = opts && picked != null;
        if (auto) {
          var ok = picked === it.answer; st.marks[i] = ok;
          allColour(opts, ok);
          add(fb, h('div', { class: 'box ' + (ok ? 'ans pop' : 'bad') }, h('div', { class: ok ? 'praise' : 'oops' }, ok ? '✅ ' + praise() : '❌ ' + T('notQuite'))));
        }
        add(fb, h('div', { class: 'box ans' }, h('b', null, '✅ ' + L('Answer: ', '答案：')), rich(it.right),
            it.visual && !it.visualFirst && VIS[it.visual.type] ? h('div', { class: 'vis' }, VIS[it.visual.type](it.visual)) : null),
          it.why ? h('div', { class: 'box teach' }, h('b', null, T('why') + ': '), bi(it.why, true)) : null,
          it.whyWrong ? h('div', { class: 'box hint' }, h('b', null, '🤔 ' + L('Common mistake: ', '常见错误：')), bi(it.whyWrong, true)) : null);
        if (!auto) add(fb, h('div', { class: 'row center' },
          h('button', { class: 'btn big green', onclick: function () { st.marks[i] = true; go(1); } }, '✅ ' + L('I got it right', '我答对了')),
          h('button', { class: 'btn big yellow', onclick: function () { st.marks[i] = false; go(1); } }, '🔁 ' + L('Not yet', '还没对'))));
        else add(fb, h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: function () { go(1); } }, i + 1 < items.length ? T('next') : T('finish'))));
      }
      add(area, h('div', { class: 'card' },
        numStrip(items.length, i, function (k) { return st.marks[k] == null ? '' : st.marks[k] ? 'ok' : 'warn'; }, function (k) { st.i = k; window.scrollTo(0, 0); one(); }),
        h('div', { class: 'stats' }, h('span', null, (i + 1) + ' / ' + items.length), h('span', { class: 'small' }, tx(x.page.title))),
        it.n ? h('div', { class: 'muted small' }, it.n) : null,
        it.context ? h('div', { class: 'box teach' }, rich(it.context)) : null,
        h('div', { class: 'box q' }, QT(it)),
        it.visual && it.visualFirst && VIS[it.visual.type] ? h('div', { class: 'vis' }, VIS[it.visual.type](it.visual)) : null,
        opts ? h('div', { class: 'answers' }, opts) : h('div', { class: 'muted' }, L('Say or write your answer first.', '先说出或写下你的答案。')),
        opts ? null : h('div', { class: 'row center' }, h('button', { class: 'btn big blue', onclick: function () { if (!shown) reveal(); } }, '👀 ' + L('Show the answer', '看答案'))),
        fb,
        h('div', { class: 'row', style: 'justify-content:space-between;margin-top:16px' },
          h('button', { class: 'btn ghost', disabled: i === 0, onclick: function () { go(-1); } }, T('prev')),
          h('button', { class: 'btn ghost', onclick: function () { go(1); } }, L('Skip →', '跳过 →')))));
    }
    function go(d) { st.i += d; window.scrollTo(0, 0); if (st.i >= items.length) { st.i = items.length - 1; st.ended = true; return end(); } if (st.i < 0) st.i = 0; one(); }
    function end() {
      var marks = st.marks;
      var right = Object.keys(marks).filter(function (k) { return marks[k]; }).length, done = Object.keys(marks).length;
      if (!st.recorded) {
        st.recorded = true;
        lsSet(key('rv_' + r.id), { right: right, total: items.length, when: localTime() });
        record('Homework review ' + r.date, w.week, right, items.length, (Date.now() - st.t0) / 1000, Object.keys(marks).filter(function (k) { return !marks[k]; }).map(function (k) { return 'Q' + (+k + 1); }));
      }
      clear(area);
      add(area, h('div', { class: 'card center' }, h('h2', null, '🎉 ' + L('Review finished!', '讲评完成！')),
        h('div', { class: 'bigscore' }, right + ' / ' + items.length), h('p', null, L('You scored yourself. Well done for checking every question!', '这是你给自己打的分。每题都认真检查了，真棒！')),
        done < items.length ? h('p', { class: 'muted' }, L('Skipped: ', '跳过：') + (items.length - done)) : null,
        (r.practice || []).length ? [h('h3', null, '🔁 ' + L('Practise again', '再练一练')), h('div', { class: 'tiles' }, r.practice.map(function (pid) { return actTile(w, pid); }))] : null,
        h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: function () { st = keep('review', function () { return { i: 0, marks: {}, t0: Date.now() }; }, true); one(); } }, L('Go through again', '再看一遍')))));
    }
    one();
  }

  /* =========== HOMEWORK QUIZ: as many tries as she likes, every try timed and saved for Homework Review =========== */
  ACT.hwquiz = function (a, ctx, area) {
    var K = hwKeys(ctx.week, a.id), tries = hwTries(ctx.week, a);
    var st = lsGet(K.draft, null), qs = a.questions, tStart = 0, tick = null;
    var pos = keep('hw');   /* which question is on screen (kept when the language changes) */
    function save() { lsSet(K.draft, st); }
    function stopClock() { if (tStart && st && pos) { st.time[pos.i] = Math.round((st.time[pos.i] || 0) + (Date.now() - tStart) / 1000); tStart = 0; save(); } clearInterval(tick); }
    function go(n) { stopClock(); if (n < pos.i) { st.backs++; save(); } pos.i = n; ask(); window.scrollTo(0, 0); }
    function begin() {
      if (!st) { st = { ans: {}, time: {}, backs: 0, started: localTime() }; save(); }
      pos = keep('hw', function () { return { i: 0 }; }, true); ask();
    }
    S.cleanup = stopClock;
    if (st && pos) return ask();
    intro();
    function intro() {
      clear(area);
      var last = tries[tries.length - 1];
      add(area, h('div', { class: 'card center' },
        h('div', { class: 'box teach', style: 'text-align:left' }, bi({ en: 'You can do this homework as many times as you like. Every try is timed. When you press Submit, the try is saved in 📋 Homework Review with every question, your answer and the right answer.',
          zh: '这份作业可以做很多次。每次都会计时。按“提交”后，这一次会保存在“📋 作业讲评”里，有每道题、你的答案和正确答案。' })),
        last ? h('p', { class: 'muted' }, L('Tries so far: ', '已做次数：') + tries.length + '  ·  ' + L('Last try: ', '上一次：') + last.when + '  ·  ' + last.right + ' / ' + last.total + '  ·  ⏱️ ' + fmtTime(last.secs)) : null,
        h('div', { class: 'row center' },
          h('button', { class: 'btn big', onclick: begin }, st ? '▶️ ' + L('Continue this try', '继续这一次') : last ? '🔁 ' + L('Try again', '再做一次') : '▶️ ' + T('start')),
          last ? h('a', { class: 'btn ghost', href: tryHref(ctx.week, a.id, tries.length) }, '📋 ' + L('Review my last try', '看上一次的讲评')) : null)));
    }
    function ask() {
      clear(area); clearInterval(tick);
      var i = pos.i, q = qs[i], clock = h('span', null, '⏱️ 0:00');
      tStart = Date.now();
      tick = setInterval(function () { clock.textContent = '⏱️ ' + fmtTime((st.time[i] || 0) + (Date.now() - tStart) / 1000); }, 500);
      var btns = q.options.map(function (o, j) {
        return h('button', { class: 'ansbtn c' + (j % 4) + (st.ans[i] === j ? ' chosen' : ''), onclick: function () {
          st.ans[i] = j; save(); btns.forEach(function (b, n) { b.classList.toggle('chosen', n === j); });
          var cell = strip && strip.children[i]; if (cell) cell.classList.add('done');
          count.textContent = '✏️ ' + Object.keys(st.ans).length + ' ' + L('answered', '已答');
        } }, h('span', { class: 'shape' }, SHAPES[j % 4]), h('span', null, OT(q, o)));
      });
      var answered = Object.keys(st.ans).length, count = h('span', null, '✏️ ' + answered + ' ' + L('answered', '已答'));
      var strip = numStrip(qs.length, i, function (n) { return st.ans[n] != null ? 'done' : ''; }, go);
      add(area, h('div', { class: 'card' },
        strip,
        h('div', { class: 'stats' }, h('span', null, (i + 1) + ' / ' + qs.length), clock, count),
        q.context ? h('div', { class: 'box teach' }, rich(q.context)) : null,
        h('div', { class: 'box q' }, QT(q)),
        h('div', { class: 'answers' }, btns),
        h('div', { class: 'row', style: 'justify-content:space-between;margin-top:16px' },
          h('button', { class: 'btn ghost', disabled: i === 0, onclick: function () { go(i - 1); } }, T('prev')),
          i + 1 < qs.length ? h('button', { class: 'btn big', onclick: function () { go(i + 1); } }, T('next'))
            : h('button', { class: 'btn big green', onclick: submit }, '📨 ' + L('Submit', '提交')))));
    }
    function submit() {
      var left = qs.length - Object.keys(st.ans).length;
      if (left && !confirm(L(left + ' question(s) have no answer. Submit anyway?', '还有 ' + left + ' 题没答。确定提交吗？'))) return;
      stopClock();
      var t = makeTry(a, st, localTime());
      st = null; lsSet(K.draft, null);
      var detail = qs.map(function (q, n) { return 'Q' + (n + 1) + ':' + (t.ans[n] == null ? '-' : String.fromCharCode(65 + t.ans[n])) + (t.ans[n] === q.answer ? 'ok' : 'x') + ' ' + (t.time[n] || 0) + 's'; });
      detail.unshift('try ' + tries.length);
      if (t.backs) detail.push('went back ' + t.backs + 'x');
      detail.push('aid:' + a.id);
      t.id = record('Homework: ' + ctx.en, ctx.week, t.right, t.total, t.secs, detail, hwWrong(a, t));
      var mine = lsGet(K.tries, []); mine.push(t); lsSet(K.tries, mine);
      tries = hwTries(ctx.week, a);
      done(t);
    }
    function done(t) {
      clear(area); window.scrollTo(0, 0);
      add(area, h('div', { class: 'card center' }, h('h2', null, '✅ ' + L('Homework submitted', '作业已提交')),
        h('div', { class: 'bigscore' }, t.right + ' / ' + t.total),
        h('p', { class: 'praise' }, t.right === t.total ? praise() : L('Well done for finishing! Now look at every answer in Homework Review.', '完成了，真棒！现在去作业讲评看看每道题。')),
        h('p', { class: 'muted small' }, L('Try ', '第 ') + tries.length + L('', ' 次') + '  ·  ' + t.when + '  ·  ⏱️ ' + fmtTime(t.secs)),
        h('div', { class: 'row center' },
          h('a', { class: 'btn big', href: tryHref(ctx.week, a.id, tries.length) }, '📋 ' + L('See every answer', '看每道题的答案')),
          h('button', { class: 'btn ghost', onclick: begin }, '🔁 ' + L('Try again', '再做一次')),
          h('a', { class: 'btn ghost', href: '#/' }, L('Back to Today', '回到今天')))));
    }
  };

  /* =========== TEACHING LESSON (slides with moving pictures) =========== */
  var SVGNS = 'http://www.w3.org/2000/svg', svgUid = 0;
  function sv(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    for (var k in attrs || {}) el.setAttribute(k, attrs[k]);
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null) continue; el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }
    return el;
  }
  var anims = [];
  function every(ms, fn) { var t = setInterval(fn, ms); anims.push(t); return t; }
  function stopAnims() { anims.forEach(clearInterval); anims = []; }
  function arrowDefs(color) {
    var id = 'ah' + (++svgUid);
    var defs = sv('defs', null, sv('marker', { id: id, viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' },
      sv('path', { d: 'M0,0 L10,5 L0,10 z', fill: color || '#1b2a6b' })));
    return { defs: defs, url: 'url(#' + id + ')' };
  }
  function wavePath(amp, cycles, phase, x0, x1, y0) {
    var d = '';
    for (var x = x0; x <= x1; x += 4) {
      var y = y0 - amp * Math.sin(2 * Math.PI * cycles * (x - x0) / (x1 - x0) + phase);
      d += (x === x0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }
    return d;
  }
  function label(x, y, text, opts) {
    opts = opts || {};
    return sv('text', { x: x, y: y, 'text-anchor': opts.anchor || 'middle', 'font-size': opts.size || 20, 'font-weight': '700', fill: opts.color || '#1b2a6b' }, text);
  }
  var VIS = {};
  /* A labelled transverse wave: crest, trough, rest position, amplitude, wavelength. Optional moving dot shows the up-and-down vibration. */
  VIS.wave = function (v) {
    var W = 640, H = 300, y0 = 150, amp = v.amp || 70, cyc = v.cycles || 2, x0 = 30, x1 = 610;
    var a = arrowDefs('#c2255c');
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'vis-svg', role: 'img', 'aria-label': 'wave diagram' }, a.defs);
    svg.appendChild(sv('line', { x1: x0, y1: y0, x2: x1, y2: y0, stroke: '#8a94a8', 'stroke-dasharray': '6 6', 'stroke-width': 2 }));
    var path = sv('path', { d: wavePath(amp, cyc, 0, x0, x1, y0), fill: 'none', stroke: v.color || '#1c7ed6', 'stroke-width': 5, 'stroke-linecap': 'round' });
    svg.appendChild(path);
    var crest1 = x0 + (x1 - x0) * 0.25 / cyc, crest2 = x0 + (x1 - x0) * 1.25 / cyc, trough = x0 + (x1 - x0) * 0.75 / cyc;
    if (v.labels) {
      svg.appendChild(label(crest1, y0 - amp - 14, L('crest', '波峰')));
      svg.appendChild(label(trough, y0 + amp + 30, L('trough', '波谷')));
      svg.appendChild(label(x1 - 4, y0 - 10, L('rest position', '平衡位置'), { anchor: 'end', size: 16, color: '#5c6475' }));
      svg.appendChild(sv('line', { x1: crest2, y1: y0, x2: crest2, y2: y0 - amp + 4, stroke: '#c2255c', 'stroke-width': 3, 'marker-end': a.url, 'marker-start': a.url }));
      svg.appendChild(label(crest2 + 12, y0 - amp / 2, L('amplitude', '振幅'), { anchor: 'start', color: '#c2255c' }));
      var yW = Math.max(18, y0 - amp - 48);
      svg.appendChild(sv('line', { x1: crest1, y1: yW, x2: crest2, y2: yW, stroke: '#2f9e44', 'stroke-width': 3, 'marker-end': a.url, 'marker-start': a.url }));
      svg.appendChild(sv('line', { x1: crest1, y1: yW, x2: crest1, y2: y0 - amp, stroke: '#2f9e44', 'stroke-dasharray': '4 4' }));
      svg.appendChild(sv('line', { x1: crest2, y1: yW, x2: crest2, y2: y0 - amp, stroke: '#2f9e44', 'stroke-dasharray': '4 4' }));
      svg.appendChild(label((crest1 + crest2) / 2, yW - 8, L('wavelength', '波长'), { color: '#2f9e44' }));
    }
    if (v.animate) {
      var phase = 0, dotX = v.dot ? 330 : null, dot = null;
      if (dotX) {
        dot = sv('circle', { r: 11, cx: dotX, cy: y0, fill: '#e8590c', stroke: '#fff', 'stroke-width': 3 });
        svg.appendChild(dot);
        svg.appendChild(label(dotX + 20, 28, '↕ ' + L('vibrates up and down', '上下振动'), { anchor: 'start', size: 17, color: '#e8590c' }));
        svg.appendChild(sv('line', { x1: 40, y1: H - 18, x2: 220, y2: H - 18, stroke: '#1b2a6b', 'stroke-width': 3, 'marker-end': arrowUrl(svg) }));
        svg.appendChild(label(230, H - 12, L('wave travels this way', '波向这边传播'), { anchor: 'start', size: 17 }));
      }
      every(40, function () {
        phase -= 0.12;
        path.setAttribute('d', wavePath(amp, cyc, phase, x0, x1, y0));
        if (dot) dot.setAttribute('cy', (y0 - amp * Math.sin(2 * Math.PI * cyc * (dotX - x0) / (x1 - x0) + phase)).toFixed(1));
      });
    }
    return svg;
  };
  function arrowUrl(svg) { var a = arrowDefs('#1b2a6b'); svg.insertBefore(a.defs, svg.firstChild); return a.url; }
  /* Two or three small moving waves to compare (pitch or loudness). */
  VIS.compare = function (v) {
    var box = h('div', { class: 'compare' });
    (v.items || []).forEach(function (it) {
      var svg = sv('svg', { viewBox: '0 0 640 140', class: 'vis-svg small' });
      svg.appendChild(sv('line', { x1: 20, y1: 70, x2: 620, y2: 70, stroke: '#c5cbd8', 'stroke-dasharray': '5 5' }));
      var p = sv('path', { fill: 'none', stroke: it.color || '#1c7ed6', 'stroke-width': 5, 'stroke-linecap': 'round' });
      svg.appendChild(p);
      var ph = 0;
      p.setAttribute('d', wavePath(it.amp, it.cycles, 0, 20, 620, 70));
      every(40, function () { ph -= 0.1; p.setAttribute('d', wavePath(it.amp, it.cycles, ph, 20, 620, 70)); });
      box.appendChild(h('div', { class: 'compare-item' }, h('div', { class: 'compare-label' }, it.icon ? it.icon + ' ' : '', bi(it.label)), svg,
        it.sound ? h('button', { class: 'btn ghost', onclick: function () { beep(it.sound.hz, it.sound.vol); } }, '🔊 ' + L('Hear it', '听一听')) : null));
    });
    return box;
  };
  /* Longitudinal wave: coils squash together (compression) and spread out (rarefaction) as the wave moves. */
  VIS.longitudinal = function (v) {
    var W = 640, H = 230, n = 46, lines = [], ph = 0;
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'vis-svg', role: 'img', 'aria-label': 'longitudinal wave' });
    for (var i = 0; i < n; i++) { var l = sv('line', { y1: 40, y2: 140, stroke: '#1c7ed6', 'stroke-width': 4, 'stroke-linecap': 'round' }); lines.push(l); svg.appendChild(l); }
    var u = arrowUrl(svg);
    svg.appendChild(sv('line', { x1: 40, y1: 190, x2: 220, y2: 190, stroke: '#1b2a6b', 'stroke-width': 3, 'marker-end': u }));
    svg.appendChild(label(230, 196, L('wave travels this way', '波向这边传播'), { anchor: 'start', size: 17 }));
    svg.appendChild(label(W / 2, 222, '↔ ' + L('particles vibrate in the SAME direction', '粒子振动方向和传播方向相同'), { size: 16, color: '#e8590c' }));
    var cLab = label(0, 28, L('compression', '密部'), { color: '#c2255c', size: 17 });
    var rLab = label(0, 28, L('rarefaction', '疏部'), { color: '#2f9e44', size: 17 });
    if (v.labels !== false) { svg.appendChild(cLab); svg.appendChild(rLab); }
    function draw() {
      var xs = [];
      for (var i = 0; i < n; i++) { var x0 = 30 + i * (580 / (n - 1)); xs.push(x0 + 30 * Math.sin(2 * Math.PI * 2 * i / n + ph)); }
      xs.forEach(function (x, i) { lines[i].setAttribute('x1', x.toFixed(1)); lines[i].setAttribute('x2', x.toFixed(1)); });
      var best = 1e9, bi2 = 0, worst = -1, wi = 0;
      for (var j = 8; j < n - 8; j++) { var gap = xs[j + 1] - xs[j - 1]; if (gap < best) { best = gap; bi2 = j; } if (gap > worst) { worst = gap; wi = j; } }
      cLab.setAttribute('x', xs[bi2].toFixed(1)); rLab.setAttribute('x', xs[wi].toFixed(1));
    }
    draw();
    every(50, function () { ph -= 0.08; draw(); });
    return svg;
  };
  /* A row of people doing a stadium wave: each person only stands up and sits down, but the wave travels along. */
  VIS.stadium = function (v) {
    var row = h('div', { class: 'stadium' }), people = [], ph = 0;
    for (var i = 0; i < 11; i++) { var p = h('span', { class: 'person' }, v.icon || '🧍'); people.push(p); row.appendChild(p); }
    every(60, function () {
      ph += 0.18;
      people.forEach(function (p, i) { var up = Math.max(0, Math.sin(ph - i * 0.6)); p.style.transform = 'translateY(' + (-34 * up).toFixed(1) + 'px)'; });
    });
    return h('div', null, row, h('div', { class: 'compare-label center' }, bi(v.caption)));
  };
  /* Steps joined by arrows, one lights up at a time (e.g. the path of sound through the ear). */
  VIS.flow = function (v) {
    var chips = (v.steps || []).map(function (s) { return h('div', { class: 'flow-step' }, h('div', { class: 'flow-ico' }, s.icon), h('div', { class: 'flow-text' }, bi(s))); });
    var row = h('div', { class: 'flow' });
    chips.forEach(function (c, i) { row.appendChild(c); if (i < chips.length - 1) row.appendChild(h('div', { class: 'flow-arrow', 'aria-hidden': 'true' }, '➜')); });
    var k = 0;
    every(1100, function () { chips.forEach(function (c, i) { c.classList.toggle('lit', i === k); }); k = (k + 1) % chips.length; });
    return row;
  };
  var ATOM = { d: '#343a40', w: '#ffffff', r: '#e03131', b: '#1c7ed6', y: '#fab005', g: '#2f9e44' };
  VIS.particles = function (v) {
    return h('div', { class: 'pbox-grid' }, (v.boxes || []).map(function (bx, bi) {
      var W = 220, H = 170, longest = Math.max.apply(null, (bx.items || ['d']).map(function (x) { return x.length; })), R = longest >= 3 ? 9.5 : 13;
      var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'vis-svg particle-box', role: 'img', 'aria-label': enText(bx.label) });
      svg.appendChild(sv('rect', { x: 3, y: 3, width: W - 6, height: H - 6, rx: 14, fill: '#fff', stroke: '#1b2a6b', 'stroke-width': 3 }));
      var items = bx.items || [], n = items.length, cols = bx.cols || (n <= 4 ? 2 : 3), rows = Math.ceil(n / cols);
      items.forEach(function (it, k) {
        var c = k % cols, r = Math.floor(k / cols);
        var cx = 22 + ((W - 44) / cols) * (c + 0.5) + ((r % 2) && !bx.neat ? 6 : -2), cy = (H / rows) * (r + 0.5) + ((k * 7) % 3 - 1) * (bx.neat ? 0 : 5);
        var len = it.length, start = cx - (len - 1) * R * 0.85;
        it.split('').forEach(function (a, j) {
          svg.appendChild(sv('circle', { cx: (start + j * R * 1.7).toFixed(1), cy: cy.toFixed(1), r: R, fill: ATOM[a] || '#888', stroke: '#1b2a6b', 'stroke-width': 2.5 }));
        });
      });
      return h('div', { class: 'pbox-item' }, svg, bx.label ? h('div', { class: 'compare-label center' }, bi2(bx.label)) : null);
    }));
  };
  function bi2(v) { return bi(v); }
  VIS.emoji = function (v) {
    return h('div', { class: 'emoji-grid' }, (v.items || []).map(function (it) {
      return h('div', { class: 'emoji-card' }, h('div', { class: 'emoji-big' }, it.icon), h('div', { class: 'emoji-label' }, bi(it)));
    }));
  };
  VIS.formula = function (v) {
    return h('div', { class: 'formula' }, h('div', { class: 'formula-main' }, bi(v.main, true)), v.example ? h('div', { class: 'formula-ex' }, bi(v.example, true)) : null);
  };
  /* Picture-book textures for rock layers, drawn on top of the layer colour.
     bricks = limestone, dots = sandstone, stripes = shale, speckle = granite or old rock. Same pattern every time. */
  function rockTexture(svg, kind, x, y, w, hgt) {
    if (!kind) return;
    var g = sv('g', { opacity: .55 }), k, n = 0;
    if (kind === 'bricks') {
      for (var row = 0; row * 22 < hgt; row++) {
        g.appendChild(sv('line', { x1: x, y1: y + row * 22, x2: x + w, y2: y + row * 22, stroke: '#868e96', 'stroke-width': 2 }));
        for (k = (row % 2) * 30; k < w; k += 60) g.appendChild(sv('line', { x1: x + k, y1: y + row * 22, x2: x + k, y2: Math.min(y + hgt, y + row * 22 + 22), stroke: '#868e96', 'stroke-width': 2 }));
      }
    } else if (kind === 'dots') {
      for (k = 0; k < w * hgt / 260; k++) { n = (k * 7919) % 10007; g.appendChild(sv('circle', { cx: x + 6 + n % (w - 12), cy: y + 5 + (n * 31) % (hgt - 10), r: 1.8, fill: '#7a5c2e' })); }
    } else if (kind === 'stripes') {
      for (k = 8; k < hgt; k += 9) g.appendChild(sv('path', { d: 'M' + x + ',' + (y + k) + ' q ' + w / 4 + ',-4 ' + w / 2 + ',0 t ' + w / 2 + ',0', fill: 'none', stroke: '#212529', 'stroke-width': 1.5 }));
    } else if (kind === 'speckle') {
      var cols = ['#495057', '#f8f9fa', '#e599f7', '#343a40'];
      for (k = 0; k < w * hgt / 120; k++) { n = (k * 6151) % 9973; g.appendChild(sv('rect', { x: x + 4 + n % (w - 10), y: y + 4 + (n * 17) % (hgt - 9), width: 5, height: 4, fill: cols[k % 4] })); }
    }
    svg.appendChild(g);
  }
  /* A picture-book soil profile: grass on top, leaf litter, dark topsoil with roots and a worm,
     subsoil with specks, weathered rock at the bottom. Labels on the right with lines pointing in. */
  VIS.soil = function (v) {
    var W = 640, H = 470, bx = 30, bw = 300, top = 60, Ls = v.layers || [], hs = v.heights || [40, 110, 110, 120];
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'vis-svg', role: 'img', 'aria-label': 'soil profile' });
    var fills = ['#4a2f17', '#6b4423', '#c98b4f', '#adb5bd'], y = top, mids = [];
    hs.forEach(function (hh, k) {
      svg.appendChild(sv('rect', { x: bx, y: y, width: bw, height: hh, fill: (Ls[k] && Ls[k].color) || fills[k] }));
      mids.push(y + hh / 2); y += hh;
    });
    var yO = top, yA = top + hs[0], yB = yA + hs[1], yC = yB + hs[2], i, n;
    // O: leaf litter
    for (i = 0; i < 18; i++) { n = (i * 53) % 280; svg.appendChild(sv('ellipse', { cx: bx + 12 + n, cy: yO + 10 + (i * 7) % (hs[0] - 16), rx: 9, ry: 4, fill: i % 3 ? '#a0522d' : '#d9a441', transform: 'rotate(' + ((i * 37) % 60 - 30) + ' ' + (bx + 12 + n) + ' ' + (yO + 10 + (i * 7) % (hs[0] - 16)) + ')' })); }
    // A: roots and a worm
    for (i = 0; i < 6; i++) { var rx = bx + 30 + i * 48; svg.appendChild(sv('path', { d: 'M' + rx + ',' + yA + ' q 8,25 -4,50 q -6,20 6,' + (30 + (i % 3) * 10), fill: 'none', stroke: '#e9d8a6', 'stroke-width': 2 })); }
    svg.appendChild(sv('path', { d: 'M' + (bx + 180) + ',' + (yA + 70) + ' q 15,-14 30,0 t 30,0', fill: 'none', stroke: '#f783ac', 'stroke-width': 8, 'stroke-linecap': 'round' }));
    var seed = 12345;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (i = 0; i < 40; i++) svg.appendChild(sv('circle', { cx: bx + 5 + rnd() * (bw - 10), cy: yA + 5 + rnd() * (hs[1] - 10), r: 1.6, fill: '#3b2412' }));
    // B: specks and small stones
    for (i = 0; i < 70; i++) svg.appendChild(sv('circle', { cx: bx + 5 + rnd() * (bw - 10), cy: yB + 5 + rnd() * (hs[2] - 10), r: i % 9 ? 1.8 : 5, fill: i % 9 ? '#8a5a2b' : '#868e96' }));
    // C: weathered rock pieces, in a loose grid so they fill the layer
    for (i = 0; i < 15; i++) {
      var cxr = bx + 26 + (i % 5) * ((bw - 52) / 4) + (rnd() - .5) * 16, cyr = yC + 22 + Math.floor(i / 5) * ((hs[3] - 40) / 2) + (rnd() - .5) * 10;
      svg.appendChild(sv('ellipse', { cx: cxr, cy: cyr, rx: 16 + rnd() * 8, ry: 11 + rnd() * 5, fill: i % 2 ? '#868e96' : '#ced4da', stroke: '#495057', 'stroke-width': 2 }));
    }
    // grass on top
    for (i = 0; i < 40; i++) { var gx = bx + 4 + i * 7.4; svg.appendChild(sv('path', { d: 'M' + gx + ',' + top + ' q ' + (i % 2 ? 4 : -4) + ',-' + (18 + (i * 7) % 16) + ' ' + (i % 2 ? 8 : -2) + ',-' + (26 + (i * 5) % 18), fill: 'none', stroke: i % 3 ? '#2f9e44' : '#40c057', 'stroke-width': 3, 'stroke-linecap': 'round' })); }
    svg.appendChild(sv('rect', { x: bx, y: top, width: bw, height: y - top, fill: 'none', stroke: '#1b2a6b', 'stroke-width': 3 }));
    // labels
    mids.forEach(function (my, k) {
      var ly = Ls[k] || {}, lyY = my - (ly.note ? 10 : 0);
      svg.appendChild(sv('line', { x1: bx + bw - 20, y1: my, x2: bx + bw + 30, y2: my, stroke: '#1b2a6b', 'stroke-width': 2 }));
      svg.appendChild(sv('circle', { cx: bx + bw - 20, cy: my, r: 4, fill: '#1b2a6b' }));
      svg.appendChild(label(bx + bw + 36, lyY + 6, tx(ly.label), { anchor: 'start', size: 20 }));
      if (ly.note) svg.appendChild(label(bx + bw + 36, lyY + 28, tx(ly.note), { anchor: 'start', size: 15, color: '#5c6475' }));
    });
    return svg;
  };
  /* Layers from top to bottom (soil horizons, rock layers). Optional: side arrow (younger/older),
     a magma "cut" going up through the layers, and a wavy "gap" line (unconformity) under one layer. */
  VIS.layers = function (v) {
    var Ls = v.layers || [], LH = v.height || 58, W = 640, top = 16, x0 = 20, x1 = v.side ? 470 : 620;
    var H = top + Ls.length * LH + 16;
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'vis-svg', role: 'img', 'aria-label': 'layers' });
    Ls.forEach(function (ly, k) {
      var y = top + k * LH;
      svg.appendChild(sv('rect', { x: x0, y: y, width: x1 - x0, height: LH, fill: ly.color || '#e9ecef', stroke: '#1b2a6b', 'stroke-width': 2 }));
      rockTexture(svg, ly.texture, x0, y, x1 - x0, LH);
      if (ly.dots) for (var d = 0; d < 12; d++) svg.appendChild(sv('circle', { cx: x0 + 300 + ((d * 37) % (x1 - x0 - 320)), cy: y + 12 + ((d * 17) % (LH - 22)), r: 5 + (d % 3) * 2, fill: '#868e96', stroke: '#495057' }));
      svg.appendChild(label(x0 + 14, y + LH / 2 + 7, tx(ly.label), { anchor: 'start', size: 19, color: ly.dark ? '#fff' : '#1b2a6b' }));
    });
    if (v.gap != null) {
      var gy = top + (v.gap + 1) * LH, d = '';
      for (var x = x0; x <= x1; x += 10) d += (x === x0 ? 'M' : 'L') + x + ',' + (gy + (x / 10 % 2 ? -5 : 5)) + ' ';
      svg.appendChild(sv('path', { d: d, fill: 'none', stroke: '#c92a2a', 'stroke-width': 4 }));
      if (v.gapLabel) svg.appendChild(label(x1 - 8, gy - 10, tx(v.gapLabel), { anchor: 'end', size: 17, color: '#c92a2a' }));
    }
    if (v.cut) {
      var cx = v.cut.x || 300;
      svg.appendChild(sv('rect', { x: cx - 16, y: top, width: 32, height: Ls.length * LH, fill: '#f76707', stroke: '#c92a2a', 'stroke-width': 2, opacity: .9 }));
      svg.appendChild(label(cx + 26, top + 24, tx(v.cut.label), { anchor: 'start', size: 17, color: '#c92a2a' }));
    }
    if (v.side) {
      var a = arrowDefs('#1b2a6b'); svg.insertBefore(a.defs, svg.firstChild);
      svg.appendChild(sv('line', { x1: 540, y1: H - 24, x2: 540, y2: top + 26, stroke: '#1b2a6b', 'stroke-width': 4, 'marker-end': a.url }));
      svg.appendChild(label(540, top + 16, tx(v.side.top), { size: 17 }));
      svg.appendChild(label(540, H - 4, tx(v.side.bottom), { size: 17 }));
    }
    return svg;
  };
  /* Ocean floor profile from the beach out to the deep ocean: shelf, slope, rise, abyssal plain (and a trench for an active margin). */
  VIS.seafloor = function (v) {
    var active = v.kind === 'active', W = 640, H = 300, sea = 70;
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'vis-svg', role: 'img', 'aria-label': 'ocean floor' });
    var shelfEnd = active ? 150 : 250;
    var floor = active
      ? 'M0,40 L60,70 L' + shelfEnd + ',95 L210,215 L250,280 L290,215 L330,235 L640,240'
      : 'M0,40 L60,70 L' + shelfEnd + ',100 L330,205 L420,235 L640,245';
    svg.appendChild(sv('rect', { x: 0, y: sea, width: W, height: H - sea, fill: '#d0ebff' }));
    svg.appendChild(sv('path', { d: floor + ' L640,300 L0,300 Z', fill: '#c9a26b', stroke: '#7a5c2e', 'stroke-width': 3 }));
    svg.appendChild(sv('line', { x1: 0, y1: sea, x2: W, y2: sea, stroke: '#1c7ed6', 'stroke-width': 3 }));
    svg.appendChild(label(20, 30, L('land', '陆地'), { anchor: 'start', size: 17 }));
    svg.appendChild(label(W - 10, sea - 8, L('sea level', '海平面'), { anchor: 'end', size: 16, color: '#1c7ed6' }));
    var labs = active
      ? [[105, 125, L('narrow shelf', '窄大陆架')], [170, 170, L('slope', '大陆坡')], [250, 268, L('trench', '海沟')], [480, 228, L('abyssal plain', '深海平原')]]
      : [[150, 128, L('wide shelf', '宽大陆架')], [300, 165, L('slope', '大陆坡')], [390, 215, L('rise', '大陆隆')], [530, 232, L('abyssal plain', '深海平原')]];
    labs.forEach(function (lb) { svg.appendChild(label(lb[0], lb[1], lb[2], { size: 17, color: lb[2] === L('trench', '海沟') ? '#c92a2a' : '#1b2a6b' })); });
    if (active) svg.appendChild(label(40, 62, '🌋', { size: 26 }));
    return svg;
  };
  /* Bar model picture for fraction equations, same as in Guided Answers. */
  VIS.bar = function (v) { return barModel(v); };
  /* Inequality on a number line: open circle for > or <, closed (filled) circle for ≥ or ≤, thick arrow for the solutions. */
  VIS.numline = function (v) {
    var W = 640, H = 150, lo = v.min, hi = v.max, step = (W - 80) / (hi - lo), a = arrowDefs('#2f9e44');
    var X = function (n) { return 40 + (n - lo) * step; };
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'vis-svg', role: 'img', 'aria-label': 'number line' }, a.defs);
    svg.appendChild(sv('line', { x1: 20, y1: 70, x2: W - 20, y2: 70, stroke: '#1b2a6b', 'stroke-width': 3 }));
    for (var n = lo; n <= hi; n++) {
      svg.appendChild(sv('line', { x1: X(n), y1: 60, x2: X(n), y2: 80, stroke: '#1b2a6b', 'stroke-width': 2 }));
      svg.appendChild(label(X(n), 106, String(n), { size: 18 }));
    }
    if (v.at != null) {
      var end = v.dir === 'left' ? 24 : W - 24;
      svg.appendChild(sv('line', { x1: X(v.at), y1: 70, x2: end, y2: 70, stroke: '#2f9e44', 'stroke-width': 8, 'marker-end': a.url }));
      svg.appendChild(sv('circle', { cx: X(v.at), cy: 70, r: 11, fill: v.closed ? '#2f9e44' : '#ffffff', stroke: '#2f9e44', 'stroke-width': 4 }));
    }
    if (v.label) svg.appendChild(label(W / 2, 34, tx(v.label), { size: 20, color: '#e8590c' }));
    if (v.note) svg.appendChild(label(W / 2, 140, tx(v.note), { size: 16 }));
    return svg;
  };
  /* A divide: rain falls on the high land and runs down one side or the other. */
  VIS.divide = function (v) {
    var W = 640, H = 260, a = arrowDefs('#1c7ed6');
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'vis-svg', role: 'img', 'aria-label': 'divide' }, a.defs);
    svg.appendChild(sv('path', { d: 'M40,230 L320,50 L600,230 Z', fill: '#8ce99a', stroke: '#2b8a3e', 'stroke-width': 3 }));
    svg.appendChild(sv('line', { x1: 320, y1: 20, x2: 320, y2: 60, stroke: '#c92a2a', 'stroke-width': 4, 'stroke-dasharray': '6 5' }));
    svg.appendChild(label(320, 16 + 0, '🌧️', { size: 22 }));
    svg.appendChild(label(320, 85, tx(v.top || { en: 'divide (high land)', zh: '分水岭（高地）' }), { size: 17, color: '#c92a2a' }));
    svg.appendChild(sv('path', { d: 'M300,90 L130,200', stroke: '#1c7ed6', 'stroke-width': 5, fill: 'none', 'marker-end': a.url }));
    svg.appendChild(sv('path', { d: 'M340,90 L510,200', stroke: '#1c7ed6', 'stroke-width': 5, fill: 'none', 'marker-end': a.url }));
    svg.appendChild(label(130, 252, tx(v.left), { size: 17 }));
    svg.appendChild(label(510, 252, tx(v.right), { size: 17 }));
    return svg;
  };
  /* Wave explorer: sliders for amplitude (loudness) and frequency (pitch), with a real sound. */
  VIS.explorer = function () {
    var amp = 50, cyc = 3, ph = 0;
    var svg = sv('svg', { viewBox: '0 0 640 220', class: 'vis-svg' });
    svg.appendChild(sv('line', { x1: 20, y1: 110, x2: 620, y2: 110, stroke: '#c5cbd8', 'stroke-dasharray': '5 5' }));
    var p = sv('path', { fill: 'none', stroke: '#c2255c', 'stroke-width': 5, 'stroke-linecap': 'round' });
    svg.appendChild(p);
    var ampIn = h('input', { type: 'range', min: '10', max: '95', value: String(amp), 'aria-label': 'amplitude' });
    var cycIn = h('input', { type: 'range', min: '1', max: '8', value: String(cyc), 'aria-label': 'frequency' });
    var info = h('div', { class: 'explorer-info' });
    function word(val, lo, hi, a, b, c) { return val < lo ? a : val > hi ? c : b; }
    function paint() {
      info.textContent = '';
      add(info, [h('div', null, '🔊 ' + L('Loudness: ', '响度：') + word(amp, 35, 70, L('quiet', '小'), L('medium', '中'), L('loud', '大'))),
        h('div', null, '🎵 ' + L('Pitch: ', '音调：') + word(cyc, 3, 5, L('low', '低'), L('medium', '中'), L('high', '高')))]);
    }
    ampIn.addEventListener('input', function () { amp = +ampIn.value; paint(); });
    cycIn.addEventListener('input', function () { cyc = +cycIn.value; paint(); });
    paint();
    every(40, function () { ph -= 0.12; p.setAttribute('d', wavePath(amp, cyc, ph, 20, 620, 110)); });
    return h('div', { class: 'explorer' }, svg,
      h('label', { class: 'slider' }, h('span', null, L('Amplitude (taller wave)', '振幅（波更高）')), ampIn),
      h('label', { class: 'slider' }, h('span', null, L('Frequency (more waves)', '频率（波更多）')), cycIn),
      info,
      h('button', { class: 'btn big', onclick: function () { beep(110 * cyc, amp / 100); } }, '🔊 ' + L('Play the sound', '播放声音')));
  };
  var audioCtx = null;
  function beep(hz, vol) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime;
      o.frequency.value = hz; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.01, vol * 0.4), t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t + 1.25);
    } catch (e) { /* no sound on this device */ }
  }
  /* ⚡ Quick question in the middle of a lesson page: tap A or B, see right away. Not scored. */
  /* Right = every button turns green. Wrong = every button turns red. No mixed colours. */
  function allColour(btns, ok) { btns.forEach(function (b) { b.disabled = true; b.classList.add(ok ? 'right' : 'picked-wrong'); }); }
  function quickBox(q) {
    var fb = h('div'), done = false;
    var btns = q.options.map(function (o, k) {
      return h('button', { class: 'ansbtn c' + (k % 4), onclick: function () {
        if (done) return; done = true;
        var ok = k === q.answer;
        allColour(btns, ok);
        add(fb, h('div', { class: 'box ' + (ok ? 'ans pop' : 'bad') }, h('div', { class: ok ? 'praise' : 'oops' }, ok ? '✅ ' + praise() : '❌ ' + T('notQuite')),
          !ok ? h('div', { class: 'q-text' }, '✅ ', OT(q, q.options[q.answer])) : null,
          whyBox(q, q.options[k], 'why-box')));
      } }, h('span', { class: 'shape' }, SHAPES[k % 4]), h('span', null, OT(q, q.options[k])));
    });
    return h('div', { class: 'quick' }, h('div', { class: 'quick-head' }, '⚡ ' + L('Quick question!', '快问快答！')),
      h('div', { class: 'box q' }, bi(q.q, true)), h('div', { class: 'answers two' }, btns), fb);
  }
  /* ✏️ Drawing pad for Apple Pencil, finger or mouse. Saved on this device. The book picture stays hidden until she has tried. */
  /* ---------- Saved drawings: kept on this device, shown in 🎨 My drawings, can be sent to Roy ---------- */
  var DRAW_MAX = 40;
  function drawings() { var v = lsGet(key('drawings'), []); return Array.isArray(v) ? v : []; }
  function dataUrlToFile(url, name) {
    var p = url.split(','), bin = atob(p[1]), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new File([arr], name, { type: 'image/jpeg' });
  }
  function drawingName(dr) { return (whoName() + ' ' + dr.title + ' ' + dr.when).replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').slice(0, 80) + '.jpg'; }
  /* Send to Roy: the iPad/phone share sheet (LINE, Messages...), else a download. */
  function sendDrawing(dr) {
    var name = drawingName(dr);
    try {
      var file = dataUrlToFile(dr.img, name);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: dr.title, text: whoName() + ': ' + dr.title }).catch(function () {});
      }
    } catch (e) {}
    var a = h('a', { href: dr.img, download: name }); document.body.appendChild(a); a.click(); a.remove();
  }
  function saveDrawing(cv, title) {
    var img;
    try { img = cv.toDataURL('image/jpeg', 0.75); } catch (e) { return null; }
    var list = drawings(), d = new Date();
    var dr = { id: Date.now().toString(36), title: title || L('Drawing', '画'), when: localTime(), img: img };
    list.unshift(dr);
    while (list.length > DRAW_MAX) list.pop();
    lsSet(key('drawings'), list);
    if (drawings()[0] && drawings()[0].id === dr.id) return dr;
    list.length = Math.max(1, Math.floor(list.length / 2)); lsSet(key('drawings'), list);   /* device storage full: keep the newest */
    return drawings()[0] && drawings()[0].id === dr.id ? dr : null;
  }
  function renderDrawings() {
    var list = drawings();
    show(h('div', { class: 'page-head' }, h('h1', null, '🎨 ' + L('My drawings', '我的画')),
        h('p', { class: 'muted' }, E('Drawings you saved on this device, newest first. Tap Send to Roy to share one.', '在这台设备上保存的画，最新的在上面。点“发给 Roy”分享。'))),
      list.length ? h('div', { class: 'draw-gallery' }, list.map(function (dr) {
        return h('div', { class: 'card draw-card' }, h('img', { src: dr.img, alt: dr.title }),
          h('div', { class: 'draw-meta' }, h('b', null, dr.title), h('div', { class: 'small muted' }, dr.when)),
          h('div', { class: 'row' }, h('button', { class: 'btn', onclick: function () { sendDrawing(dr); } }, '📤 ' + L('Send to Roy', '发给 Roy')),
            h('button', { class: 'btn ghost', onclick: function () {
              if (!confirm(L('Delete this drawing?', '删除这幅画吗？'))) return;
              lsSet(key('drawings'), drawings().filter(function (x) { return x.id !== dr.id; })); renderDrawings();
            } }, '🗑️ ' + L('Delete', '删除'))));
      })) : h('div', { class: 'card empty-today' }, E('No saved drawings yet. Find a "✏️ Draw it" page in the Main Book, draw, then tap 💾 Save.', '还没有保存的画。在主课本里找“✏️ 画一画”页，画完点 💾 保存。')));
  }
  function drawPad(store, d, example, title) {
    var W = 1000, Hh = 680, strokes = lsGet(store, null), color = '#212529', size = 6, erasing = false, cur = null;
    if (!Array.isArray(strokes)) strokes = [];
    var cv = h('canvas', { class: 'drawpad', width: W, height: Hh, 'aria-label': 'drawing area' });
    var ctx2 = cv.getContext('2d');
    function paint() {
      ctx2.fillStyle = '#fff'; ctx2.fillRect(0, 0, W, Hh);
      strokes.forEach(function (st) {
        ctx2.strokeStyle = st.e ? '#fff' : st.c; ctx2.lineWidth = st.s; ctx2.lineCap = 'round'; ctx2.lineJoin = 'round';
        ctx2.beginPath(); st.p.forEach(function (pt, k) { k ? ctx2.lineTo(pt[0], pt[1]) : ctx2.moveTo(pt[0], pt[1]); });
        if (st.p.length === 1) ctx2.lineTo(st.p[0][0] + .1, st.p[0][1]);
        ctx2.stroke();
      });
    }
    function pos(e) { var r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) * W / r.width), Math.round((e.clientY - r.top) * Hh / r.height)]; }
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = { c: color, s: erasing ? 40 : size, e: erasing, p: [pos(e)] }; strokes.push(cur); paint(); });
    cv.addEventListener('pointermove', function (e) { if (!cur) return; e.preventDefault(); cur.p.push(pos(e)); paint(); });
    function end() { if (!cur) return; cur = null; lsSet(store, strokes); }
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end); cv.addEventListener('pointerleave', end);
    var swatches = h('div', { class: 'chips' });
    var COLS = [['#212529', L('black', '黑')], ['#6b4423', L('brown', '棕')], ['#e8590c', L('orange', '橙')], ['#868e96', L('grey', '灰')], ['#2f9e44', L('green', '绿')], ['#1c7ed6', L('blue', '蓝')], ['#c92a2a', L('red', '红')]];
    function tools() {
      clear(swatches);
      COLS.forEach(function (c) {
        add(swatches, h('button', { class: 'chip swatch' + (!erasing && color === c[0] ? ' on' : ''), style: 'border-color:' + c[0] + ';color:' + c[0], 'aria-label': c[1], onclick: function () { color = c[0]; erasing = false; tools(); } }, '●'));
      });
      add(swatches, [
        h('button', { class: 'chip' + (size === 4 && !erasing ? ' on' : ''), onclick: function () { size = 4; erasing = false; tools(); } }, L('thin', '细')),
        h('button', { class: 'chip' + (size === 10 && !erasing ? ' on' : ''), onclick: function () { size = 10; erasing = false; tools(); } }, L('thick', '粗')),
        h('button', { class: 'chip' + (erasing ? ' on' : ''), onclick: function () { erasing = true; tools(); } }, '🧽 ' + L('eraser', '橡皮')),
        h('button', { class: 'chip', onclick: function () { strokes.pop(); lsSet(store, strokes); paint(); } }, '↩️ ' + L('undo', '撤销')),
        h('button', { class: 'chip', onclick: function () { if (confirm(L('Clear your whole drawing?', '清除整幅画吗？'))) { strokes = []; lsSet(store, strokes); paint(); } } }, '🗑️ ' + L('clear', '清除'))]);
    }
    tools(); paint();
    var ex = example ? h('div', { class: 'hidden' }, example) : null;
    return h('div', { class: 'draw' },
      h('div', { class: 'quick-head' }, '✏️ ' + L('Your turn to draw!', '轮到你画了！')),
      h('div', { class: 'box q' }, bi(d.prompt, true)),
      d.labels ? h('div', { class: 'box hint' }, h('b', null, '🏷️ ' + L('Labels to write: ', '要写的标签：')), d.labels.join('  ·  ')) : null,
      swatches, cv,
      h('div', { class: 'row center draw-actions' },
        h('button', { class: 'btn green', onclick: function () {
          var dr = saveDrawing(cv, title);
          if (!dr) { alert(L('Could not save. Try deleting old drawings in My drawings.', '保存失败。请在“我的画”里删掉旧的画再试。')); return; }
          this.textContent = '✅ ' + L('Saved in My drawings', '已保存到“我的画”');
          var b = this; setTimeout(function () { b.textContent = '💾 ' + L('Save', '保存'); }, 2500);
        } }, '💾 ' + L('Save', '保存')),
        h('button', { class: 'btn blue', onclick: function () { var dr = saveDrawing(cv, title); if (dr) sendDrawing(dr); } }, '📤 ' + L('Send to Roy', '发给 Roy')),
        h('a', { class: 'btn ghost', href: '#/drawings' }, '🎨 ' + L('My drawings', '我的画'))),
      h('div', { class: 'small muted' }, L('Tap 💾 Save when you finish. Your drawings stay in 🎨 My drawings.', '画完点 💾 保存。你的画会留在“🎨 我的画”里。')),
      ex ? h('div', { class: 'row center' }, h('button', { class: 'btn blue', onclick: function () { ex.classList.toggle('hidden'); } }, '👀 ' + L('Compare with the book picture', '和课本图比一比'))) : null, ex);
  }
  ACT.lesson = function (a, ctx, area) {
    var slides = a.slides || [];
    var st = keep('lesson', function () { return { i: 0 }; });
    var open = false;
    S.cleanup = stopAnims;
    function go(k) { st.i = Math.max(0, Math.min(slides.length - 1, k)); open = false; show1(); window.scrollTo(0, 0); }
    function show1() {
      stopAnims();
      clear(area);
      var i = st.i, s = slides[i];
      var dots = h('div', { class: 'dots' }, slides.map(function (_, k) { return h('button', { class: 'dot' + (k === i ? ' on' : k < i ? ' done' : ''), 'aria-label': 'Page ' + (k + 1), onclick: function () { go(k); } }); }));
      var vis = s.visual && VIS[s.visual.type] ? h('div', { class: 'vis' }, VIS[s.visual.type](s.visual)) : null;
      var pad = s.draw ? drawPad(key('draw_' + (ctx.en || ctx.week) + '_' + i), s.draw, vis, (ctx.en ? ctx.en.replace(/^Main Book /, '') + ': ' : '') + tx(s.title)) : null;
      if (pad) vis = null;
      var sayText = [tx({ en: s.title.en || s.title })].concat((s.points || []).map(function (p) { return p.en || p; })).join('. ');
      /* the page list: on the right on big screens, a slide-out panel on iPad and phone */
      var panel = h('nav', { class: 'pagepanel' + (open ? ' open' : ''), 'aria-label': 'Pages' },
        h('div', { class: 'pp-head' }, h('span', null, '📑 ' + L('Pages', '页面') + ' (' + slides.length + ')'),
          h('button', { class: 'pp-close', 'aria-label': 'Close', onclick: function () { open = false; panel.classList.remove('open'); } }, '✕')),
        h('ol', { class: 'pp-list' }, slides.map(function (p, k) {
          return h('li', null, h('button', { class: 'pp-item' + (k === i ? ' on' : k < i ? ' done' : ''), onclick: function () { go(k); } },
            h('span', { class: 'pp-n' }, String(k + 1)), h('span', { class: 'pp-t' }, (p.icon ? p.icon + ' ' : '') + tx(p.title))));
        })),
        ctx.panelExtra ? ctx.panelExtra() : null);
      var toggle = h('button', { class: 'pp-toggle', onclick: function () { open = !open; panel.classList.toggle('open', open); } },
        '📑 ' + L('Page ', '第 ') + (i + 1) + ' / ' + slides.length + L('', ' 页'));
      var checkPage = s.check ? understandBox(a.code, slides) : null;
      var card = h('div', { class: 'card slide pop' },
        dots,
        h('div', { class: 'slide-head' }, h('span', { class: 'slide-num' }, (i + 1) + ' / ' + slides.length),
          h('button', { class: 'btn ghost', style: 'min-height:44px;padding:4px 14px', onclick: function () { say(sayText); } }, '🔊')),
        h('h2', { class: 'slide-title' }, s.icon ? s.icon + ' ' : '', bi(s.title)),
        checkPage,
        vis,
        s.points && s.points.length ? h('ul', { class: 'slide-points' }, s.points.map(function (p) { return h('li', null, bi(p, true)); })) : null,
        s.remember ? h('div', { class: 'box hint' }, h('b', null, '⭐ ' + L('Remember: ', '记住：')), bi(s.remember, true)) : null,
        pad,
        s.quick ? quickBox(s.quick) : null,
        h('div', { class: 'row', style: 'justify-content:space-between;margin-top:18px' },
          h('button', { class: 'btn ghost big', disabled: i === 0, onclick: function () { go(i - 1); } }, T('prev')),
          i < slides.length - 1 ? h('button', { class: 'btn big', onclick: function () { go(i + 1); } }, T('next'))
            : h('a', { class: 'btn big green', href: ctx.back }, '🎉 ' + (ctx.doneText ? tx(ctx.doneText) : L('Done! Now the activities', '完成！现在做练习')))),
        i === slides.length - 1 ? canNow(a) : null);
      add(area, h('div', { class: 'lesson-wrap' }, h('div', { class: 'lesson-main' }, card), panel), toggle);
    }
    show1();
  };

  /* =========== LIBRARY: dated files to download, every day's work and every Main Book chapter to print =========== */
  function renderLibrary() {
    show(backLink(), h('p', { class: 'muted' }, '…'));
    Promise.all([getJSON(DATA + 'library.json').catch(function () { return { files: [] }; }),
      Promise.all(weekIds().map(function (id) { return loadWeek(id).catch(function () { return null; }); })),
      S.student.mainBook ? loadBook().catch(function () { return null; }) : null]).then(function (res) {
      var files = (res[0].files || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      var days = [];
      var weeksAll = res[1].filter(Boolean);
      weeksAll.forEach(function (w) { (w.days || []).forEach(function (d) { days.push({ w: w, d: d }); }); });
      days.sort(function (a, b) { return a.d.date < b.d.date ? 1 : -1; });
      var book = res[2];
      function row(icon, title, sub, href, btn, dl) {
        return h('div', { class: 'lib-row' }, h('span', { class: 'lib-ico' }, icon),
          h('span', { class: 'lib-text' }, h('span', { class: 'lib-title' }, title), sub ? h('span', { class: 'lib-sub' }, sub) : null),
          h('a', dl ? { class: 'btn', href: href, download: '' } : { class: 'btn ghost', href: href, target: '_blank', rel: 'noopener' }, btn));
      }
      show(backLink(), h('h1', null, '📚 ' + L('Library', '资料库')),
        h('div', { class: 'box teach' }, bi({ en: 'Files to keep and read. Homework is never printed: it is done on this website, under Today and Homework.', zh: '可以保存和阅读的资料。作业不用打印：作业都在这个网站的“今天”和“作业”里完成。' })),
        h('h2', { class: 'section-title' }, '📥 ' + L('Files to download', '可下载的文件')),
        files.length ? h('div', { class: 'lib-list' }, files.map(function (f) {
          return row('📄', tx(f.title), dayLabel(f.date) + (f.from ? '  ·  ' + tx(f.from) : '') + (f.size ? '  ·  ' + f.size : ''), '../' + f.file, '⬇️ ' + L('Download', '下载'), true);
        })) : h('p', { class: 'muted' }, L('No files yet.', '还没有文件。')),
        book ? [h('h2', { class: 'section-title' }, '📖 ' + L('Main Book chapters (print or save as PDF)', '主课本各章（打印或存为 PDF）')),
          h('div', { class: 'lib-list' }, book.chapters.filter(function (c) { return c.slides && c.slides.length; }).map(function (c) {
            return row('📖', c.code + '  ' + tx(c.title), c.slides.length + ' ' + L('pages', '页'), 'print.html?book=' + c.code, '🖨️ ' + L('Open', '打开'));
          }))] : null);
    }).catch(renderError);
  }

  /* =========== MAIN BOOK: one book, chapters by code, not dated =========== */
  var BOOK = null;
  function loadBook() { return BOOK ? Promise.resolve(BOOK) : getJSON(DATA + 'mainbook.json').then(function (b) { BOOK = b; return b; }); }
  function renderBook(code) {
    show(backLink(), h('p', { class: 'muted' }, '…'));
    loadBook().then(function (b) {
      if (code) {
        var ch = b.chapters.filter(function (c) { return c.code === code; })[0];
        if (!ch) return renderError();
        var area = h('div');
        var ret = S.returnTo, pv0 = prevPage();
        if (pv0 && /\/day\//.test(pv0) && (!ret || ret.hash !== pv0)) ret = { hash: pv0, label: L('that day', '那一天') };
        show(ret ? h('a', { class: 'back', href: ret.hash }, '← ' + L('Back to', '回到') + ': ' + ret.label) : backLink('#/book'), h('h1', null, '📖 ' + ch.code + ' ' + tx(ch.title)),
          h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: function () { shareLink(location.href, 'Main Book ' + ch.code); } }, '🔗 ' + L('Share', '分享'))), area);
        var ready = b.chapters.filter(function (c) { return c.slides && c.slides.length; }), at = ready.indexOf(ch);
        var pv = ready[at - 1], nx = ready[at + 1];
        return ACT.lesson({ slides: ch.slides.concat([{ icon: '✅', title: { en: 'Did you understand?', zh: '你听懂了吗？' }, check: true }]), canNow: ch.canNow, code: ch.code }, { back: ret ? ret.hash : nx ? '#/book/' + nx.code : '#/book', week: 'book', en: 'Main Book ' + ch.code,
          doneText: ret ? { en: 'Done! Back to ' + ret.label, zh: '完成！回到 ' + ret.label } : nx ? { en: 'Done! Next chapter: ' + nx.code, zh: '完成！下一章：' + nx.code } : { en: 'Done! Back to the Main Book', zh: '完成！回到主课本' },
          panelExtra: function () {
            return h('div', { class: 'pp-chapters' },
              pv ? h('a', { class: 'pp-ch', href: '#/book/' + pv.code }, '← ' + pv.code + ' ' + tx(pv.title)) : null,
              nx ? h('a', { class: 'pp-ch', href: '#/book/' + nx.code }, nx.code + ' ' + tx(nx.title) + ' →') : null,
              h('a', { class: 'pp-ch', href: '#/book' }, '📖 ' + L('All chapters', '全部章节')));
          } }, area);
      }
      show(backLink(), h('h1', null, '📖 ' + L('Main Book', '主课本')),
        h('div', { class: 'box teach' }, bi(b.intro || { en: 'Learn one chapter at a time with Roy.', zh: '和 Roy 老师一章一章地学。' })),
        b.parts.map(function (pt) {
          return h('div', null, h('h2', { class: 'section-title' }, tx(pt.title)),
            b.chapters.filter(function (c) { return c.part === pt.id; }).map(function (c) {
              var soon = !c.slides || !c.slides.length;
              return h(soon ? 'div' : 'a', { class: 'list-link' + (soon ? ' muted' : ''), href: soon ? null : '#/book/' + c.code },
                h('span', null, c.code + '  ' + tx(c.title)), h('span', { class: 'small' }, soon ? L('Coming soon', '即将推出') : c.slides.length + ' ' + L('pages', '页') + ' →'));
            }));
        }));
    }).catch(renderError);
  }

  /* =========== SCHOOL HOMEWORK: learn each question together, then copy the answer onto the school sheet =========== */
  var SCHOOL = null;
  function loadSchool() { return SCHOOL ? Promise.resolve(SCHOOL) : getJSON(DATA + 'school.json').then(function (b) { SCHOOL = b; return b; }); }
  function sheetDone(id) { return lsGet(key('sch_' + id), null); }
  function renderSchool(id) {
    show(backLink(), h('p', { class: 'muted' }, '…'));
    loadSchool().then(function (b) {
      if (!id) {
        var done = b.sheets.filter(function (x) { return sheetDone(x.id); }).length;
        return show(backLink(), h('h1', null, '🏫 ' + L('School Homework', '学校作业')),
          h('div', { class: 'box teach' }, bi({ en: 'Open a sheet. Go through each question with Roy: learn HOW, then copy the answer onto your school paper. Press Done when the paper is finished.', zh: '打开一份作业。和 Roy 老师一题一题看：先学怎么做，再把答案抄到学校的作业纸上。写完后按“完成”。' })),
          h('div', { class: 'card center' }, h('div', { class: 'bigscore' }, done + ' / ' + b.sheets.length), h('p', null, L('sheets done', '份已完成'))),
          b.sheets.map(function (x) {
            var d = sheetDone(x.id);
            return h('a', { class: 'list-link', href: '#/school/' + x.id },
              h('span', null, (x.icon || '📄') + ' ' + tx(x.title), h('div', { class: 'small muted' }, tx(x.subject) + ' · ' + x.items.length + ' ' + L('questions', '题'))),
              h('span', { class: 'small' }, d ? '✅ ' + L('Done', '完成') : '⏳ ' + L('To do', '待完成')));
          }));
      }
      var sh = b.sheets.filter(function (x) { return x.id === id; })[0];
      if (!sh) return renderError();
      var i = 0, area = h('div'), doneBox = h('div');
      function paintDone() {
        clear(doneBox);
        var d = sheetDone(sh.id);
        add(doneBox, h('div', { class: 'row center' }, d
          ? h('button', { class: 'btn ghost', onclick: function () { lsSet(key('sch_' + sh.id), null); paintDone(); } }, '✅ ' + L('Done on ', '完成于 ') + d.when + ' (' + L('tap to undo', '点击撤销') + ')')
          : h('button', { class: 'btn big green', onclick: function () {
              lsSet(key('sch_' + sh.id), { when: localTime() }); record('School homework done: ' + enText(sh.title), 'school', 1, 1, 0, []); paintDone();
            } }, '✅ ' + L('Done: I copied it onto my paper', '完成：我已经抄到作业纸上了'))));
      }
      paintDone();
      show(backLink('#/school'), h('h1', null, (sh.icon || '📄') + ' ' + tx(sh.title)),
        sh.intro ? h('div', { class: 'box teach' }, bi(sh.intro, true)) : null,
        sh.note ? h('div', { class: 'box hint' }, bi(sh.note)) : null, area, doneBox);
      function one() {
        clear(area);
        var it = sh.items[i], steps = h('div'), ans = h('div');
        add(area, h('div', { class: 'card' },
          h('div', { class: 'stats' }, h('span', null, (i + 1) + ' / ' + sh.items.length), it.n ? h('span', { class: 'small' }, it.n) : null),
          h('div', { class: 'progress' }, h('div', { style: 'width:' + (100 * i / sh.items.length) + '%' })),
          h('div', { class: 'box q' }, QT(it)),
          it.visual && it.visualFirst && VIS[it.visual.type] ? h('div', { class: 'vis' }, VIS[it.visual.type](it.visual)) : null,
          h('div', { class: 'row center' },
            it.steps || it.help ? h('button', { class: 'btn yellow', onclick: function () {
              if (steps.firstChild) return;
              if (it.help) add(steps, h('div', { class: 'box hint pop' }, h('b', null, '💡 '), bi(it.help, true)));
              (it.steps || []).forEach(function (s, k) {
                add(steps, h('div', { class: 'box teach step' }, h('b', null, L('Step ', '第 ') + (k + 1) + L(': ', ' 步：')), bi(s, true),
                  (s.math == null ? [] : [].concat(s.math)).map(function (m) { return h('div', { class: 'math' }, rich(m)); })));
              });
            } }, '💡 ' + L('How to do it', '怎么做')) : null,
            h('button', { class: 'btn big', onclick: function () {
              if (ans.firstChild) return;
              add(ans, h('div', { class: 'box ans pop' }, h('div', { class: 'small muted' }, '✍️ ' + L('Answer to copy onto your paper:', '抄到作业纸上的答案：')),
                h('div', { class: 'final', style: 'white-space:pre-line' }, rich(it.answer)),
                it.zh ? h('div', { class: 'zh-sub', lang: 'zh' }, it.zh) : null,
                it.visual && !it.visualFirst && VIS[it.visual.type] ? h('div', { class: 'vis' }, VIS[it.visual.type](it.visual)) : null,
                it.why ? h('div', { style: 'margin-top:8px' }, h('b', null, T('why') + ': '), bi(it.why, true)) : null));
            } }, '✍️ ' + L('Answer to copy', '要抄的答案'))),
          steps, ans,
          h('div', { class: 'row', style: 'justify-content:space-between;margin-top:16px' },
            h('button', { class: 'btn ghost', disabled: i === 0, onclick: function () { i--; one(); window.scrollTo(0, 0); } }, T('prev')),
            i + 1 < sh.items.length ? h('button', { class: 'btn ghost', onclick: function () { i++; one(); window.scrollTo(0, 0); } }, T('next'))
              : h('span', { class: 'praise' }, '🏁 ' + L('Last question!', '最后一题！')))));
      }
      one();
    }).catch(renderError);
  }

  /* =========== MY KEY POINTS (3 guided lines, saved on this device) =========== */
  ACT.keypoints = function (a, ctx, area) {
    var k = key('kp_' + ctx.week + '_' + a.id), saved = lsGet(k, {});
    var rows = [
      { id: 'words', label: { en: '3 key words', zh: '3 个关键词' }, ph: '___  ___  ___' },
      { id: 'rule', label: { en: '1 rule in one sentence', zh: '一句话规则' }, ph: '...' },
      { id: 'example', label: { en: '1 example', zh: '一个例子' }, ph: '...' }];
    var inputs = {};
    var model = h('div', { class: 'hidden' }, h('div', { class: 'box ans' }, h('b', null, L("Roy's example:", 'Roy 老师的例子：')),
      h('div', null, '🔑 ' + a.model.words), h('div', null, '📏 ' + a.model.rule), h('div', null, '💡 ' + a.model.example)), canNow(a));
    clear(area);
    add(area, h('div', { class: 'card' },
      a.topic ? h('div', { class: 'box q' }, bi(a.topic)) : null,
      rows.map(function (r) {
        var inp = h('input', { type: 'text', value: saved[r.id] || '', placeholder: r.ph, 'aria-label': r.label.en });
        inp.addEventListener('input', function () { saved[r.id] = inp.value; lsSet(k, saved); });
        inputs[r.id] = inp;
        return h('label', { class: 'kp-row' }, h('span', { class: 'kp-label' }, bi(r.label)), inp);
      }),
      h('div', { class: 'row center' }, h('button', { class: 'btn big green', onclick: function () {
        var filled = rows.filter(function (r) { return inputs[r.id].value.trim(); }).length;
        if (filled < 3) { alert(L('Try all 3 lines first. A guess is OK!', '先试着写完 3 行。猜一猜也可以！')); return; }
        model.classList.remove('hidden'); model.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } }, '👀 ' + L("See Roy's example", '看 Roy 老师的例子'))),
      model));
  };

  /* =========== FILL IN THE BLANKS (tap a word from the word bank) =========== */
  ACT.fillblank = function (a, ctx, area) {
    var st = keep('fill');
    function start() {
      st = keep('fill', function () { return { items: a.shuffle === false ? a.items.slice() : shuffle(a.items.slice()), i: 0, ans: {}, banks: {}, correct: 0, t0: Date.now() }; }, true);
      ask();
    }
    function isOk(k) { return String(st.ans[k]).toLowerCase() === String(st.items[k].answer).toLowerCase(); }
    function go(k) { st.i = k; ask(); window.scrollTo(0, 0); }
    function ask() {
      if (st.ended) return end();
      clear(area);
      var i = st.i, it = st.items[i];
      var parts = String(it.text).split('___');
      var blank = h('span', { class: 'blank' }, '?');
      var fb = h('div', { 'aria-live': 'polite' });
      if (!st.banks[i]) st.banks[i] = shuffle((a.bank || []).slice());
      var chips = st.banks[i].map(function (wd) { return h('button', { class: 'chip word', onclick: function () { choose(wd); } }, wd); });
      add(area, h('div', { class: 'card' },
        numStrip(st.items.length, i, function (k) { return st.ans[k] == null ? '' : isOk(k) ? 'ok' : 'bad'; }, go),
        h('div', { class: 'stats' }, h('span', null, (i + 1) + ' / ' + st.items.length)),
        h('div', { class: 'box q' }, parts[0], blank, parts.slice(1).join('___'), it.textzh && dual() ? h('span', { class: 'zh-sub', lang: 'zh' }, String(it.textzh).replace(/___/g, '？')) : null),
        h('div', { class: 'muted small' }, L('Tap the missing word:', '点出缺少的词：')),
        h('div', { class: 'chips' }, chips), fb));
      if (st.ans[i] != null) result();
      function choose(wd) {
        if (st.ans[i] != null) return;
        st.ans[i] = wd;
        if (isOk(i)) st.correct++;
        result();
      }
      function result() {
        var ok = isOk(i);
        blank.textContent = ok ? st.ans[i] : it.answer;
        blank.classList.add(ok ? 'filled' : 'fixed');
        chips.forEach(function (c) { c.disabled = true; if (c.textContent.toLowerCase() === String(it.answer).toLowerCase()) c.classList.add('on'); });
        var left = nextFree(st.items.length, i, function (n) { return st.ans[n] != null; });
        add(fb, h('div', { class: 'box ' + (ok ? 'ans pop' : 'hint') },
          h('div', { class: ok ? 'praise' : 'oops' }, ok ? '⭐ ' + praise() : T('notQuite') + ' ' + it.answer),
          it.why ? h('div', null, h('b', null, T('why') + ': '), bi(it.why, true)) : null),
          h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: function () { left < 0 ? end() : go(left); } }, left >= 0 ? T('next') : T('finish'))));
      }
    }
    function end() {
      var missed = st.items.filter(function (_, k) { return !isOk(k); }).map(function (x) { return x.answer; });
      if (!st.ended) { st.ended = true; record(ctx.en, ctx.week, st.correct, st.items.length, (Date.now() - st.t0) / 1000, missed); }
      clear(area);
      add(area, h('div', { class: 'card center' }, h('h2', null, '🏆 ' + praise()), h('div', { class: 'bigscore' }, scoreText(st.correct, st.items.length)),
        h('p', { class: 'small muted' }, T('saved')), canNow(a),
        h('div', { class: 'row center' }, h('button', { class: 'btn big', onclick: start }, T('again')))));
    }
    if (st) return ask();
    clear(area);
    add(area, h('div', { class: 'card center' }, h('button', { class: 'btn big', onclick: start }, '▶️ ' + T('start'))));
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
  /* Bilingual students: Chinese under each title, and the instructions (worked steps) in both languages. */
  function zhText(v) { return v && typeof v === 'object' && v.zh ? v.zh : ''; }
  function enText(v) { return v == null ? '' : (typeof v === 'string' ? v : (v.en || '')); }
  function printZh(v) { return bilingual() && zhText(v) ? h('p', { class: 'pzh', lang: 'zh' }, zhText(v)) : null; }
  function printIntro(v) {
    if (!v || !bilingual()) return null;
    return h('div', { class: 'pbox' }, rich(enText(v)), zhText(v) ? h('div', { class: 'pzh', lang: 'zh' }, rich(zhText(v))) : null);
  }

  /* ================= TEACHER ANSWER KEY =================
     A separate, hidden page for the teacher only. One answer key per activity, each on its own printed page.
     Option letters A to D follow the printed worksheet (data order). */
  function renderTeacher() {
    document.body.className = 'print-page';
    document.title = 'Answer key';
    var root = h('div', { class: 'wrap' });
    document.body.appendChild(root);
    S.lang = 'en';
    var ids = weekIds();
    var m = /[?&]w=([0-9-]+)/.exec(location.search);
    var id = m ? m[1] : ids[0];
    var nav = h('div', { class: 'noprint row' },
      h('button', { class: 'btn', onclick: function () { window.print(); } }, '🖨️ Print'),
      ids.map(function (x) { return h('a', { class: 'btn ghost', href: '?w=' + x }, weekLabel(x)); }));
    add(root, nav);
    function stamp(sub) {
      return h('div', { class: 'tkey' }, h('b', null, 'TEACHER COPY ONLY: ANSWER KEY'), ' · 教师用答案 · ', S.student.name + ' · ' + weekLabel(id) + (sub ? ' · ' + sub : ''));
    }
    function both(v, isRich) {
      return [isRich ? rich(enText(v)) : enText(v), zhText(v) ? h('div', { class: 'pzh', lang: 'zh' }, isRich ? rich(zhText(v)) : zhText(v)) : null];
    }
    function mcq(q, n) {
      var L = String.fromCharCode(65 + q.answer);
      return h('div', { class: 'kq' },
        h('div', { class: 'pq' }, (n + 1) + '. ', q.context ? h('div', { style: 'font-weight:400' }, rich(q.context)) : null, rich(q.q)),
        h('div', { class: 'opts' }, q.options.map(function (o, k) {
          var right = k === q.answer;
          return h('div', { class: right ? 'kright' : null }, (right ? '✔ ' : '    ') + String.fromCharCode(65 + k) + ')  ', rich(o));
        })),
        h('div', null, h('b', null, 'Answer: ' + L + ')  '), rich(q.options[q.answer])),
        q.why ? h('div', { class: 'kwhy' }, h('b', null, 'Why: '), both(q.why, true)) : null);
    }
    loadWeek(id).then(function (w) {
      add(root, [h('h1', null, 'Answer key: ' + enText(w.title)), printZh(w.title), stamp(),
        h('p', null, 'Option letters match the printed worksheet. On screen the options are shuffled.'),
        h('ol', null, w.activities.map(function (a) { return h('li', null, enText(a.title)); }))]);
      w.activities.forEach(function (a) {
        var sec = h('section', { class: 'newpage' }, stamp(enText(a.title)), h('h2', null, enText(a.title)), printZh(a.title));
        if (a.type === 'spelling') {
          add(sec, h('table', null, h('tr', null, h('th', null, '#'), h('th', null, 'Word'), h('th', null, '中文'), h('th', null, 'Sentence')),
            a.words.map(function (x, n) { return h('tr', null, h('td', null, n + 1), h('td', null, h('b', null, x.word)), h('td', null, x.zh || ''), h('td', null, x.sentence || '')); })));
        } else if (a.type === 'flashcards') {
          add(sec, h('table', null, h('tr', null, h('th', null, 'Front'), h('th', null, 'Back'), h('th', null, '中文')),
            a.cards.map(function (c) { return h('tr', null, h('td', null, h('b', null, c.front)), h('td', null, c.back), h('td', null, [c.zh, c.zhBack].filter(Boolean).join('：'))); })));
        } else if (a.type === 'match') {
          add(sec, h('table', null, h('tr', null, h('th', null, 'Word'), h('th', null, 'Matches')),
            a.pairs.map(function (p) { return h('tr', null, h('td', null, h('b', null, p.a)), h('td', null, p.b)); })));
        } else if (a.type === 'quiz') {
          add(sec, a.questions.map(mcq));
          add(sec, h('div', { class: 'pbox' }, h('b', null, 'Quick key: '), a.questions.map(function (q, n) { return (n + 1) + ' ' + String.fromCharCode(65 + q.answer); }).join('   ')));
        } else if (a.type === 'reading') {
          add(sec, a.questions.map(mcq));
          if (a.write) add(sec, h('div', { class: 'kq' }, h('div', { class: 'pq' }, (a.questions.length + 1) + '. ', enText(a.write.prompt)), printZh(a.write.prompt),
            h('div', null, h('b', null, 'Model answer: '), a.write.model), h('div', { class: 'small' }, 'Accept any complete sentence that makes sense, starts with a capital letter and ends with a full stop.')));
          add(sec, h('div', { class: 'pbox' }, h('b', null, 'Quick key: '), a.questions.map(function (q, n) { return (n + 1) + ' ' + String.fromCharCode(65 + q.answer); }).join('   ')));
        } else if (a.type === 'guided') {
          a.items.forEach(function (it, n) {
            add(sec, h('div', { class: 'kq' }, h('div', { class: 'pq' }, (n + 1) + '. ', rich(it.q)),
              h('ol', { class: 'ksteps' }, it.steps.map(function (s) {
                return h('li', null, both(s, true), [].concat(s.math == null ? [] : s.math).map(function (mm) { return h('div', { class: 'math' }, rich(mm)); }));
              })),
              h('div', null, h('b', null, h('u', null, 'Answer: ', rich(it.answer)))),
              it.why ? h('div', { class: 'kwhy' }, h('b', null, 'Why: '), both(it.why, true)) : null));
          });
          add(sec, h('div', { class: 'pbox' }, h('b', null, 'Quick key: '), rich(a.items.map(function (it, n) { return (n + 1) + ') ' + it.answer; }).join('   '))));
        }
        add(root, sec);
      });
    }).catch(function () { add(root, h('p', null, 'Could not load this week.')); });
  }

  /* Share a link: the iPad/phone share menu (LINE etc.), or copy it. */
  function shareLink(url, title) {
    if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); return; }
    var done = function () { alert(L('Link copied. Paste it into LINE.', '链接已复制，粘贴到 LINE 里。')); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link:', url); });
    else prompt('Copy this link:', url);
  }
  /* Main Book (the lesson as pages) or Workbook (the practice as a worksheet) for one day. */
  function printDay(w, date, part, root, lang) {
    var d = (w.days || []).filter(function (x) { return x.date === date; })[0];
    if (!d) { add(root, h('p', null, 'Could not find this day.')); return; }
    var acts = (d.activities || []).map(function (aid) { return (w.activities || []).filter(function (x) { return x.id === aid; })[0]; }).filter(Boolean);
    var book = part === 'book';
    S.lang = 'en';
    add(root, [
      h('div', { class: 'noprint row' }, h('button', { class: 'btn', onclick: function () { window.print(); } }, '🖨️ Print or save as PDF'),
        h('button', { class: 'btn ghost', onclick: function () { shareLink(location.href, document.title); } }, '🔗 Share'),
        h('span', { class: 'muted small' }, book ? 'Colour on screen, black and white on paper.' : 'Prints in black and white.')),
      h('h1', null, (book ? '📖 Main Book: ' : '📝 Workbook: ') + S.student.name),
      h('h2', null, dayLabel(date) + (d.title ? ': ' + (d.title.en || d.title) : '')), printZh(d.title),
      book ? null : h('p', null, 'Name: ______________________    Date: ______________')
    ]);
    if (book) {
      acts.filter(function (a) { return a.type === 'lesson'; }).forEach(function (a) {
        (a.slides || []).forEach(function (sl, n) {
          var vis = sl.visual && VIS[sl.visual.type] && sl.visual.type !== 'explorer' ? h('div', { class: 'vis' }, VIS[sl.visual.type](sl.visual)) : null;
          add(root, h('div', { class: 'book-slide' },
            h('h3', null, (n + 1) + '. ' + (sl.icon ? sl.icon + ' ' : '') + enText(sl.title)), printZh(sl.title),
            vis,
            h('ul', null, (sl.points || []).map(function (pt) { return h('li', null, rich(enText(pt)), printZh(pt)); })),
            sl.remember ? h('div', { class: 'pbox' }, h('b', null, '⭐ Remember: '), rich(enText(sl.remember)), printZh(sl.remember)) : null));
        });
      });
      stopAnims();
      S.lang = lang; return;
    }
    acts.filter(function (a) { return a.type !== 'lesson'; }).forEach(function (a) {
      var title = [h('h2', null, (a.icon ? a.icon + ' ' : '') + enText(a.title)), printZh(a.title), printIntro(a.intro)];
      if (a.type === 'fillblank') {
        add(root, [title, h('div', { class: 'pbox' }, h('b', null, 'Word bank: '), (a.bank || []).join('   ·   ')),
          a.items.map(function (it, n) { return h('div', { class: 'pq' }, (n + 1) + '. ' + it.text.replace('___', '______________')); })]);
      } else if (a.type === 'match') {
        var left = a.pairs.map(function (p) { return p.a; }), right = a.pairs.map(function (p) { return p.b; }).slice().sort();
        add(root, [title, h('p', null, 'Write the letter of the meaning next to each word.'),
          h('table', null, left.map(function (l, n) { return h('tr', null, h('td', null, (n + 1) + '. ' + l), h('td', null, '____'), h('td', null, String.fromCharCode(65 + n) + ') ' + right[n])); }))]);
      } else if (a.type === 'flashcards') {
        add(root, [title, h('p', null, 'Read the word. Cover the meaning. Say it. Check.'),
          h('table', null, a.cards.map(function (c) { return h('tr', null, h('td', null, h('b', null, c.front)), h('td', null, c.back, bilingual() && (c.zh || c.zhBack) ? h('div', { class: 'pzh' }, [c.zh, c.zhBack].filter(Boolean).join('：')) : null)); }))]);
      } else if (a.type === 'quiz' || a.type === 'reading') {
        if (a.type === 'reading') add(root, [h('div', { class: 'newpage' }), title, h('h3', null, a.storyTitle || ''), a.paragraphs.map(function (p, n) { return h('p', null, (n + 1) + '  ' + p); })]);
        else add(root, title);
        a.questions.forEach(function (q, n) {
          add(root, [h('div', { class: 'pq' }, (n + 1) + '. ', q.context ? h('div', { style: 'font-weight:400' }, rich(q.context)) : null, rich(q.q)),
            h('div', { class: 'opts' }, q.options.map(function (o, k) { return h('div', null, '☐ ' + String.fromCharCode(65 + k) + ')  ', rich(o)); }))]);
        });
      } else if (a.type === 'guided') {
        add(root, [title, h('p', null, 'Show your working.')]);
        a.items.forEach(function (it, n) { add(root, [h('div', { class: 'pq' }, (n + 1) + '. ', rich(it.q)), h('div', { class: 'lines' }), h('div', { class: 'lines' })]); });
      } else if (a.type === 'spelling') {
        add(root, [title, h('table', null, a.words.map(function (x, n) { return h('tr', null, h('td', null, n + 1), h('td', null, h('b', null, x.word)), h('td'), h('td')); }))]);
      } else if (a.type === 'keypoints') {
        add(root, [title, a.topic ? h('div', { class: 'pq' }, enText(a.topic)) : null,
          h('div', { class: 'pq' }, '3 key words:'), h('div', { class: 'lines' }),
          h('div', { class: 'pq' }, '1 rule in one sentence:'), h('div', { class: 'lines' }),
          h('div', { class: 'pq' }, '1 example:'), h('div', { class: 'lines' })]);
      }
      if (a.canNow) add(root, h('p', null, '☐ ' + enText(a.canNow)));
    });
    S.lang = lang;
  }

  function renderPrint() {
    document.body.className = 'print-page';
    var m = /[?&]w=([0-9-]+)/.exec(location.search);
    var id = m ? m[1] : weekIds()[0];
    var dm = /[?&]d=([0-9-]+)/.exec(location.search), pm = /[?&]part=(book|work)/.exec(location.search);
    var bm = /[?&]book=([A-Za-z0-9.]+)/.exec(location.search);
    var root = h('div', { class: 'wrap' });
    document.body.appendChild(root);
    var lang = S.lang; S.lang = 'en';
    if (bm) {
      return loadBook().then(function (b) {
        var ch = b.chapters.filter(function (c) { return c.code === bm[1]; })[0];
        printDay({ days: [{ date: '2026-01-01', title: ch.title, activities: ['x'] }], activities: [{ id: 'x', type: 'lesson', slides: ch.slides }] }, '2026-01-01', 'book', root, S.lang);
        var h2 = root.querySelector('h2'); if (h2) h2.textContent = ch.code + ' ' + enText(ch.title);
      });
    }
    loadWeek(id).then(function (w) {
      var answers = [];
      if (dm) return printDay(w, dm[1], pm ? pm[1] : 'work', root, lang);
      add(root, [
        h('div', { class: 'noprint row' }, h('button', { class: 'btn', onclick: function () { window.print(); } }, '🖨️ Print'), h('span', { class: 'muted small' }, 'Prints in black and white.')),
        h('h1', null, S.student.name + ': ' + (w.title.en || w.title)),
        h('p', null, 'Week of ' + weekLabel(w.week)), h('p', null, 'Date: ______________')
      ]);
      w.activities.forEach(function (a) {
        var title = [h('h2', null, a.title.en || a.title), printZh(a.title), printIntro(a.intro)];
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
      /* Students with a separate teacher answer key get no answers on their own sheet. */
      if (answers.length && !S.student.separateKey) {
        add(root, [h('div', { class: 'newpage' }), h('h2', null, 'Answers (for checking)')]);
        answers.forEach(function (x) { add(root, h('div', { class: 'pbox' }, h('b', null, x[0] + ': '), rich(x[1]))); });
      }
      S.lang = lang;
    }).catch(function () { add(root, h('p', null, 'Could not load this week.')); });
  }

  /* =========== HOMEWORK TRIES (25 Nov 2026): no limit on tries; every finished try is kept with its time =========== */
  function hwKeys(week, id) { return { old: key('hw_' + week + '_' + id), draft: key('hwd_' + week + '_' + id), tries: key('hwt_' + week + '_' + id) }; }
  function makeTry(a, st, when) {
    var qs = a.questions || [], ans = {}, time = {};
    Object.keys(st.ans || {}).forEach(function (n) { ans[n] = st.ans[n]; });
    Object.keys(st.time || {}).forEach(function (n) { time[n] = st.time[n]; });
    var right = qs.filter(function (q, n) { return ans[n] === q.answer; }).length;
    var secs = Object.keys(time).reduce(function (s, n) { return s + (time[n] || 0); }, 0);
    return { when: when || '', ans: ans, time: time, secs: secs, right: right, total: qs.length, backs: st.backs || 0 };
  }
  /* Older one-try homework (saved before 25 Nov) becomes try 1; an unfinished one becomes the current try. */
  function localTries(week, a) {
    var k = hwKeys(week, a.id), tries = lsGet(k.tries, null);
    if (tries) return tries;
    var old = lsGet(k.old, null);
    tries = [];
    if (old && old.submitted) tries.push(makeTry(a, old, old.when));
    else if (old && Object.keys(old.ans || {}).length && !lsGet(k.draft, null)) lsSet(k.draft, { ans: old.ans, time: old.time || {}, backs: old.backs || 0 });
    lsSet(k.tries, tries);
    return tries;
  }
  /* Tries from this device plus every try saved in the score sheet (from any device), oldest first. */
  function hwTries(week, a) {
    var mine = localTries(week, a), title = 'Homework: ' + (typeof a.title === 'string' ? a.title : (a.title || {}).en);
    var far = (REMOTE.rows[week + '|id:' + a.id] || []).concat(REMOTE.rows[week + '|t:' + title] || []);
    if (!far.length) return mine;
    var seen = {}, out = [];
    function sig(t) { return [t.when, t.right, t.total, t.secs].join('|'); }
    mine.concat(far).forEach(function (t) {
      if ((t.id && seen['i' + t.id]) || seen['s' + sig(t)]) return;
      if (t.id) seen['i' + t.id] = 1; seen['s' + sig(t)] = 1; out.push(t);
    });
    out.sort(function (p, q) { return String(p.when) < String(q.when) ? -1 : String(p.when) > String(q.when) ? 1 : 0; });
    return out;
  }
  /* ---- Homework from the score sheet (25 Nov 2026), so Roy and the student see every try on any device ---- */
  var REMOTE = { rows: {}, cls: {}, at: 0, busy: null };
  function csvRows(text) {
    var rows = [], row = [], f = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
      else if (c !== '\r') f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function parseRemote(text) {
    var out = {}, cls = {}, und = [];
    csvRows(text).forEach(function (r) {
      var c = String(r[1] || '').split('\t');
      if (c.length < 8 || c[1] !== S.student.name) return;
      if (c[2] === 'understand') { und.push({ when: c[0], act: c[3], ok: +c[4] === 1 }); return; }
      if (!/^Homework: /.test(c[3])) {   /* class quizzes: score, time and the questions missed */
        var kc = c[2] + '|' + c[3];
        (cls[kc] = cls[kc] || []).push({ when: c[0], right: +c[4], total: +c[5], secs: +c[6], missedText: c[7] || '', id: c[8] || '', remote: true });
        return;
      }
      var t = { when: c[0], right: +c[4], total: +c[5], secs: +c[6], ans: {}, time: {}, backs: 0, id: c[8] || '', remote: true }, aid = '';
      String(c[7] || '').split(', ').forEach(function (bit) {
        var m = /^Q(\d+):([A-Z-])(ok|x) (\d+)s$/.exec(bit);
        if (m) { var n = +m[1] - 1; if (m[2] !== '-') t.ans[n] = m[2].charCodeAt(0) - 65; t.time[n] = +m[4]; return; }
        m = /^went back (\d+)x$/.exec(bit); if (m) { t.backs = +m[1]; return; }
        m = /^aid:(.+)$/.exec(bit); if (m) aid = m[1];
      });
      var k = c[2] + (aid ? '|id:' + aid : '|t:' + c[3]);
      (out[k] = out[k] || []).push(t);
    });
    REMOTE.rows = out; REMOTE.cls = cls; REMOTE.und = und; REMOTE.at = Date.now();
  }
  function loadRemote(force) {
    var u = window.SCORE_READ;
    if (!u || REMOTE.busy || (!force && Date.now() - REMOTE.at < 60000)) return REMOTE.busy || Promise.resolve(false);
    REMOTE.busy = fetch(u + '&t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); })
      .then(function (t) { var before = JSON.stringify(REMOTE.rows); parseRemote(t); return JSON.stringify(REMOTE.rows) !== before; })
      .catch(function () { var first = !REMOTE.at; REMOTE.at = Date.now(); return first; })
      .then(function (changed) { REMOTE.busy = null; return changed; });
    return REMOTE.busy;
  }
  /* After new tries arrive, redraw lists (never in the middle of an activity). */
  function refreshRemote(force) {
    loadRemote(force).then(function (changed) {
      if (!changed) return;
      var p = location.hash.replace(/^#\/?/, '').split('/')[0];
      if (['', 'today', 'homework', 'calendar', 'review', 'subject'].indexOf(p) >= 0 || /\/day\//.test(location.hash)) route();
    });
  }
  function tryHref(week, id, n) { return '#/review/' + week + '/' + id + '/' + n; }
  function niceWhen(s) {
    var m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/.exec(String(s || ''));
    return m ? dayLabel(m[1]) + ', ' + m[2] : String(s || '');
  }
  /* Every finished try of every homework, newest first. */
  function allTries(all, onlyParts) {
    var rows = [], seen = {};
    all.forEach(function (x) {
      if (onlyParts && !dayParts(x.w, x.d).some(function (p) { return onlyParts.indexOf(p) >= 0; })) return;
      if (x.d.kind !== 'homework') return;   /* class-day quizzes show on that class day's page, not here */
      dayHw(x.w, x.d).forEach(function (a) {
        var k = x.w.week + '/' + a.id; if (seen[k]) return; seen[k] = true;
        hwTries(x.w.week, a).forEach(function (t, n) { rows.push({ x: x, a: a, t: t, n: n + 1 }); });
      });
    });
    rows.sort(function (p, q) { return String(p.t.when) < String(q.t.when) ? 1 : -1; });
    return rows;
  }
  function tryRow(r) {
    var wrong = r.t.total - r.t.right;
    return h('a', { class: 'day-row', href: tryHref(r.x.w.week, r.a.id, r.n) },
      dateBadge(r.x.d.date),
      h('span', { class: 'dr-title' },
        h('span', { class: 'dr-kind hw' }, '📋 ' + L('Homework for ', '作业：') + dayLabel(r.x.d.date) + '  ·  ' + L('Try ', '第 ') + r.n + L('', ' 次')),
        h('span', { class: 'dr-name' }, tx(r.a.title)),
        h('span', { class: 'dr-meta' }, chip(r.t.right + ' / ' + r.t.total + (wrong ? '  ·  ' + wrong + ' ' + L('wrong', '错') : '  ·  ' + L('all right', '全对')), wrong ? 'started' : 'done'),
          h('small', { class: 'muted' }, '🕒 ' + niceWhen(r.t.when) + '   ⏱️ ' + fmtTime(r.t.secs)))));
  }
  /* Homework Review: one block per quiz. The latest try on top, then every try's score in order (First try, Second try, ...). */
  var ORD_EN = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
  var ORD_ZH = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  function tryGroups(rows) {
    var g = {}, order = [];
    rows.forEach(function (r) { var k = r.x.w.week + '/' + r.a.id; if (!g[k]) { g[k] = []; order.push(k); } g[k].push(r); });
    return order.map(function (k) {
      var list = g[k].slice().sort(function (p, q) { return p.n - q.n; }), latest = list[list.length - 1];
      return h('div', { class: 'try-group' }, tryRow(latest),
        list.length > 1 ? h('div', { class: 'try-steps' }, list.map(function (r) {
          var i = r.n - 1, wrong = r.t.total - r.t.right;
          return h('a', { class: 'try-step' + (r === latest ? ' latest' : ''), href: tryHref(r.x.w.week, r.a.id, r.n) },
            h('b', null, (ORD_EN[i] ? L(ORD_EN[i] + ' try', '第' + ORD_ZH[i] + '次') : L('Try ' + r.n, '第 ' + r.n + ' 次')) + ': '),
            h('span', { class: wrong ? 'ts-bad' : 'ts-ok' }, r.t.right + ' / ' + r.t.total),
            h('small', { class: 'muted' }, '  🕒 ' + niceWhen(r.t.when) + '  ⏱️ ' + fmtTime(r.t.secs)),
            r === latest ? h('small', { class: 'ts-latest' }, '  ' + L('latest', '最新')) : null);
        })) : null);
    });
  }
  function renderTryList() {
    S.nav = 'review'; setNav('review'); refreshRemote();
    var body = h('div', null, h('p', { class: 'muted' }, '…'));
    show(h('div', { class: 'page-head' }, h('h1', null, E('📋 Homework Review', '📋 作业讲评')),
      h('p', { class: 'muted' }, E('Every homework you finished, newest first, with the time you finished it and how long it took. Tap one to see every question, your answer and the right answer.',
        '你做完的每份作业，最新的在上面，有完成时间和用时。点一份可以看每道题、你的答案和正确答案。'))), body);
    allDays().then(function (all) {
      var rows = allTries(all);
      clear(body);
      if (!rows.length && window.SCORE_READ && !REMOTE.at) return add(body, h('div', { class: 'card empty' }, E('⏳ Loading your homework…', '⏳ 正在加载你的作业…')));
      if (!rows.length) return add(body, h('div', { class: 'card empty' }, E('No homework finished yet. When you submit a homework quiz, it shows here (on every device).', '还没有做完的作业。提交作业小测后，会出现在这里（每台设备都能看到）。')));
      add(body, h('div', { class: 'card list' }, tryGroups(rows)));
    }).catch(renderError);
  }
  /* One try as a single page: every question, every option, her answer marked right or wrong, the right answer, why. */
  function renderTry(week, aid, n) {
    S.nav = 'review'; setNav('review');
    show(backLink('#/review'), h('p', { class: 'muted' }, '…'));
    loadWeek(week).then(function (w) {
      var a = actById(w, aid);
      if (!a) return renderError();
      var tries = hwTries(week, a), t = tries[n - 1];
      if (!t) return renderError();
      var d = (w.days || []).filter(function (x) { return (x.activities || []).indexOf(aid) >= 0 && x.kind === 'homework'; })[0];
      var wrong = t.total - t.right;
      var nav = function () { return h('div', { class: 'row noprint' },
        n > 1 ? h('a', { class: 'btn ghost', href: tryHref(week, aid, n - 1) }, '‹ ' + L('Try ', '第 ') + (n - 1) + L('', ' 次')) : null,
        n < tries.length ? h('a', { class: 'btn ghost', href: tryHref(week, aid, n + 1) }, L('Try ', '第 ') + (n + 1) + L('', ' 次') + ' ›') : null,
        h('button', { class: 'btn ghost', onclick: function () { window.print(); } }, '🖨️ ' + L('Save as PDF', '存为 PDF')),
        h('a', { class: 'btn', href: '#/w/' + week + '/' + aid }, '🔁 ' + L('Try again', '再做一次'))); };
      show(h('div', { class: 'noprint' }, backLink('#/review')),
        h('div', { class: 'card rv-head' },
          h('div', { class: 'plan-kind' }, E('Homework Review', '作业讲评')),
          h('h1', null, tx(a.title)),
          h('div', { class: 'rv-facts' },
            d ? h('span', null, '📅 ' + L('Homework for ', '作业日期：') + dayLabel(d.date)) : null,
            h('span', null, '🕒 ' + L('Finished: ', '完成时间：') + niceWhen(t.when)),
            h('span', null, '⏱️ ' + L('Time taken: ', '用时：') + fmtTime(t.secs)),
            h('span', null, '🔁 ' + L('Try ', '第 ') + n + L(' of ', ' 次，共 ') + tries.length + L('', ' 次'))),
          h('div', { class: 'rv-score' }, h('b', { class: 'bigscore' }, t.right + ' / ' + t.total),
            h('span', null, '✅ ' + t.right + ' ' + L('right', '对') + '   ❌ ' + wrong + ' ' + L('wrong', '错'))),
          nav()),
        (a.questions || []).map(function (q, i) {
          var pick = t.ans[i], ok = pick === q.answer;
          return h('div', { class: 'card rv-q ' + (ok ? 'ok' : 'bad') },
            h('div', { class: 'rv-qhead' }, h('span', { class: 'wn' }, String(i + 1)),
              h('span', { class: 'rv-mark' }, ok ? '✅ ' + L('Right', '对') : pick == null ? '⚪ ' + L('No answer', '没有作答') : '❌ ' + L('Wrong', '错')),
              t.time[i] != null ? h('small', { class: 'muted' }, '⏱️ ' + fmtTime(t.time[i])) : null),
            q.context ? h('div', { class: 'box teach' }, rich(q.context)) : null,
            h('div', { class: 'rv-qtext' }, QT(q)),
            h('ul', { class: 'rv-opts' }, q.options.map(function (o, j) {
              var mine = pick === j, right = j === q.answer, cls = mine && right ? 'mine right' : mine ? 'mine wrong' : right ? 'right' : '';
              var tag = mine && right ? '✅ ' + L('Your answer. Right!', '你的答案，答对了！') : mine ? '❌ ' + L('Your answer. This is wrong.', '你的答案，这是错的。')
                : right ? '✅ ' + L('Right answer', '正确答案') : null;
              return h('li', { class: cls }, h('span', { class: 'rv-letter' }, String.fromCharCode(65 + j)), h('span', { class: 'rv-otext' }, OT(q, o)),
                tag ? h('span', { class: 'rv-tag' }, tag) : null);
            })),
            whyBox(q, pick == null ? null : q.options[pick]));
        }),
        h('div', { class: 'rv-foot' }, nav()));
    }).catch(renderError);
  }

  /* =========== SUBJECTS (like a school "course" page): everything for one subject in one place =========== */
  var CODE_PART = null;
  function codePart(code) { return (CODE_PART && CODE_PART[code]) || String(code).replace(/\d.*$/, ''); }
  function dayParts(w, d) {
    var out = [];
    (d.book || []).forEach(function (c) { var p = codePart(c); if (out.indexOf(p) < 0) out.push(p); });
    (d.activities || []).forEach(function (id) { var a = actById(w, id); if (a && a.part && out.indexOf(a.part) < 0) out.push(a.part); });
    return out;
  }
  function actParts(w, a) {
    if (a.part) return [a.part];
    var out = [];
    (w.days || []).forEach(function (d) { if ((d.activities || []).indexOf(a.id) >= 0) dayParts(w, d).forEach(function (p) { if (out.indexOf(p) < 0) out.push(p); }); });
    return out;
  }
  function getSubjects() {
    var book = S.student.mainBook ? loadBook().catch(function () { return null; }) : Promise.resolve(null);
    return book.then(function (b) {
      CODE_PART = {};
      if (b) b.chapters.forEach(function (c) { CODE_PART[c.code] = c.part; });
      if (S.student.subjects && S.student.subjects.length) return { list: S.student.subjects, book: b };
      var icons = ['📘', '📗', '📙', '📕'];
      return { list: ((b && b.parts) || []).map(function (p, i) {
        var t = p.title || {};
        return { id: p.id, icon: icons[i % 4], title: { en: String(t.en || p.id).split(':')[0], zh: String(t.zh || '').split('：')[0] }, parts: [p.id] };
      }), book: b };
    });
  }
  function subjParts(sb) { return sb.parts || [sb.id]; }
  function renderSubjects() {
    S.nav = 'subjects'; setNav('subjects');
    var body = h('div', null, h('p', { class: 'muted' }, '…'));
    show(h('div', { class: 'page-head' }, h('h1', null, E('Subjects', '科目')),
      h('p', { class: 'muted' }, E('Everything for one subject in one place: homework, reviews, classes, Main Book, school homework, practice and files.',
        '一个科目的所有内容都在一起：作业、讲评、课程、主课本、学校作业、练习和资料。'))), body);
    Promise.all([getSubjects(), allDays()]).then(function (res) {
      var subs = res[0].list, all = res[1], today = todayISO();
      clear(body);
      if (!subs.length) return add(body, h('div', { class: 'card' }, L('No subjects yet.', '还没有科目。')));
      add(body, h('div', { class: 'subj-grid' }, subs.map(function (sb) {
        var ps = subjParts(sb), mine = all.filter(function (x) { return dayParts(x.w, x.d).some(function (p) { return ps.indexOf(p) >= 0; }); });
        var todo = mine.filter(function (x) { return x.d.kind === 'homework' && x.s && !x.s.done; });
        var late = todo.filter(function (x) { return x.d.date < today; }).length;
        var nextUp = mine.filter(function (x) { return x.d.date >= today; })[0];
        var chs = res[0].book ? res[0].book.chapters.filter(function (c) { return ps.indexOf(c.part) >= 0; }).length : 0;
        return h('a', { class: 'subj-card', href: '#/subject/' + sb.id },
          h('div', { class: 'subj-band' }, h('span', { class: 'subj-ico' }, sb.icon || '📚')),
          h('div', { class: 'subj-body' },
            h('b', { class: 'subj-title' }, tx(sb.title)),
            h('span', { class: 'small muted' }, todo.length + ' ' + L('homework to do', '份作业待做') + (late ? '  ·  ' + late + ' ' + L('late', '逾期') : '') + '  ·  ' + chs + ' ' + L('chapters', '章')),
            nextUp ? h('span', { class: 'small' }, L('Next: ', '下一个：') + dayLabel(nextUp.d.date) + ' · ' + tx(nextUp.d.title)) : null));
      })));
    }).catch(renderError);
  }
  var SUBJ_TABS = [['overview', '🏠', 'Overview', '概览'], ['homework', '📝', 'Homework', '作业'], ['review', '📋', 'Homework Review', '作业讲评'],
    ['class', '👩‍🏫', 'Classes', '课程'], ['book', '📖', 'Main Book', '主课本'], ['school', '🏫', 'School homework', '学校作业'],
    ['practice', '🎯', 'Practice', '练习'], ['files', '📚', 'Files', '资料']];
  function renderSubject(id, tab) {
    S.nav = 'subjects'; setNav('subjects');
    show(backLink('#/subject'), h('p', { class: 'muted' }, '…'));
    Promise.all([getSubjects(), allDays(),
      S.student.schoolHomework ? loadSchool().catch(function () { return null; }) : null,
      getJSON(DATA + 'library.json').catch(function () { return { files: [] }; })]).then(function (res) {
      var sb = res[0].list.filter(function (x) { return x.id === id; })[0];
      if (!sb) return renderError();
      var ps = subjParts(sb), inP = function (p) { return ps.indexOf(p) >= 0; }, book = res[0].book, today = todayISO();
      var days = res[1].filter(function (x) { return dayParts(x.w, x.d).some(inP); });
      var hwDays = days.filter(function (x) { return x.d.kind === 'homework'; }), classDays = days.filter(function (x) { return x.d.kind !== 'homework'; });
      var tries = allTries(res[1], ps);
      var chs = book ? book.chapters.filter(function (c) { return inP(c.part); }) : [];
      var sheets = res[2] ? res[2].sheets.filter(function (x) { return inP(x.part); }) : [];
      var files = (res[3].files || []).filter(function (f) { return inP(f.part); }).sort(function (p, q) { return p.date < q.date ? 1 : -1; });
      var practice = [], seen = {};
      res[1].forEach(function (x) { (x.d.activities || []).forEach(function (aid) {
        var a = actById(x.w, aid); if (!a || a.type === 'hwquiz' || seen[x.w.week + aid]) return;
        if (actParts(x.w, a).some(inP)) { seen[x.w.week + aid] = 1; practice.push({ w: x.w, a: a }); }
      }); });
      var counts = { homework: hwDays.length, review: tries.length, 'class': classDays.length, book: chs.length, school: sheets.length, practice: practice.length, files: files.length + chs.length };
      var tabs = h('div', { class: 'subj-tabs' }, SUBJ_TABS.filter(function (t) { return t[0] === 'overview' || counts[t[0]]; }).map(function (t) {
        return h('a', { class: 'chip' + (tab === t[0] ? ' on' : ''), href: '#/subject/' + id + '/' + t[0] }, t[1] + ' ' + L(t[2], t[3]) + (t[0] !== 'overview' ? ' (' + counts[t[0]] + ')' : ''));
      }));
      function listOrEmpty(arr, fn) { return arr.length ? h('div', { class: 'card list' }, arr.map(fn)) : h('div', { class: 'card empty' }, L('Nothing here yet.', '这里还没有内容。')); }
      function chapterList() {
        return listOrEmpty(chs, function (c) {
          var soon = !c.slides || !c.slides.length;
          return h(soon ? 'div' : 'a', { class: 'list-link' + (soon ? ' muted' : ''), href: soon ? null : '#/book/' + c.code },
            h('span', null, '📖 ' + c.code + '  ' + tx(c.title)), h('span', { class: 'small' }, soon ? L('Coming soon', '即将推出') : c.slides.length + ' ' + L('pages', '页') + ' →'));
        });
      }
      var out = [];
      if (tab === 'overview') {
        var todo = hwDays.filter(function (x) { return x.s && !x.s.done; });
        var nextClass = classDays.filter(function (x) { return x.d.date >= today; })[0];
        out.push(h('h2', { class: 'sec' }, E('To do', '待做')),
          todo.length ? h('div', { class: 'card list' }, todo.slice(0, 5).map(dayRow)) : h('div', { class: 'card empty-today' }, E('All homework for this subject is done. 🎉', '这个科目的作业都做完了。🎉')));
        if (nextClass) out.push(h('h2', { class: 'sec' }, E('Next class', '下一节课')), h('div', { class: 'card list' }, dayRow(nextClass)));
        if (tries.length) out.push(h('h2', { class: 'sec' }, E('Latest homework review', '最新的作业讲评')), h('div', { class: 'card list' }, tryGroups(tries).slice(0, 3)));
        out.push(h('h2', { class: 'sec' }, E('Modules', '模块')), h('div', { class: 'tiles' }, SUBJ_TABS.slice(1).filter(function (t) { return counts[t[0]]; }).map(function (t) {
          return h('a', { class: 'tile', href: '#/subject/' + id + '/' + t[0] }, h('span', { class: 'ico' }, t[1]), h('span', null, L(t[2], t[3])), h('span', { class: 'sub' }, String(counts[t[0]])));
        })));
      } else if (tab === 'homework') out.push(dayListByWeek(hwDays));
      else if (tab === 'class') out.push(dayListByWeek(classDays));
      else if (tab === 'review') out.push(tries.length ? h('div', { class: 'card list' }, tryGroups(tries)) : listOrEmpty(tries, tryRow));
      else if (tab === 'book') out.push(chapterList());
      else if (tab === 'school') out.push(listOrEmpty(sheets, function (x) {
        var dn = sheetDone(x.id);
        return h('a', { class: 'list-link', href: '#/school/' + x.id },
          h('span', null, (x.icon || '📄') + ' ' + tx(x.title), h('div', { class: 'small muted' }, tx(x.subject) + ' · ' + x.items.length + ' ' + L('questions', '题'))),
          h('span', { class: 'small' }, dn ? '✅ ' + L('Done', '完成') : '⏳ ' + L('To do', '待完成')));
      }));
      else if (tab === 'practice') out.push(practice.length ? h('div', { class: 'tiles' }, practice.map(function (p) { return actTile(p.w, p.a.id); })) : listOrEmpty([], null));
      else if (tab === 'files') {
        out.push(h('h2', { class: 'sec' }, E('Files', '文件')), listOrEmpty(files, function (f) {
          return h('a', { class: 'list-link', href: '../' + f.file, target: '_blank', rel: 'noopener' },
            h('span', null, '📄 ' + tx(f.title), h('div', { class: 'small muted' }, dayLabel(f.date) + (f.size ? '  ·  ' + f.size : ''))), h('span', { class: 'small' }, '⬇️ ' + L('Open', '打开')));
        }));
        if (chs.length) out.push(h('h2', { class: 'sec' }, E('Main Book chapters to print or save as PDF', '主课本各章（打印或存为 PDF）')), listOrEmpty(chs.filter(function (c) { return c.slides && c.slides.length; }), function (c) {
          return h('a', { class: 'list-link', href: 'print.html?book=' + c.code, target: '_blank', rel: 'noopener' }, h('span', null, '📖 ' + c.code + '  ' + tx(c.title)), h('span', { class: 'small' }, '🖨️ ' + L('Open', '打开')));
        }));
      }
      show(backLink('#/subject'),
        h('div', { class: 'subj-head' }, h('span', { class: 'subj-ico' }, sb.icon || '📚'), h('div', null, h('h1', null, tx(sb.title)),
          h('p', { class: 'muted small' }, (book ? (book.parts || []).filter(function (p) { return inP(p.id); }).map(function (p) { return tx(p.title); }).join('  ·  ') : '')))),
        tabs, out);
    }).catch(renderError);
  }

  /* ---------------- start ---------------- */
  getJSON(DATA + 'student.json').then(function (st) {
    S.student = st;
    S.lang = 'both';
    document.title = 'Hi ' + st.name + '!';
    if (st.accent) document.documentElement.style.setProperty('--accent', st.accent);
    if (st.accentSoft) document.documentElement.style.setProperty('--accent-soft', st.accentSoft);
    if (window.TEACHER_MODE) return renderTeacher();
    if (window.PRINT_MODE) return renderPrint();
    S.who = lsGet(WHO_KEY, null);
    frame();
    window.addEventListener('hashchange', function () { S.relang = null; route(); });
    route();
    flush();
    refreshRemote(true);
  }).catch(function () {
    document.body.appendChild(h('div', { class: 'wrap empty' }, 'Sorry, this page could not load. Check your internet and try again.'));
  });
})();
