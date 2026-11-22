# Private Tutoring Website: Rules for Claude

I am Lawrence Jose, a private tutor. I am a beginner with code. When I need to do something myself, give me simple steps, one at a time.

Student details live in `students.md`. Read it at the start of every session.
Full background for each student is in `context/<STUDENT>_CONTEXT.md` (private, never on the site, never in GitHub). Read the student's file before any "New week" or build for that student. New inbox files win if they disagree.

On the site I am "Lawrence" or "Roy". Never "T. Roy", even if a context file says so.

## The goal

One website with a separate private page for each tutoring student. Each week I drop the documents I get from their schools and the materials I make into a folder. Claude turns them into interactive practice on that student's page: spelling practice with audio, flashcards, games, quizzes, reading practice and step-by-step guided answers. Students open their own link on iPad, phone or computer. No Claude account, no app, no password.

## Folders

- `inbox/<student>/` : I drop new files here each week (PDFs, Word files, slides, photos of worksheets and spelling lists).
- `archive/<student>/<week>/` : after a week is built, the processed files move here (ask me first).
- `site/` : the website.
- `scores/` : CSV downloads of my score sheet, used for parent reports.
- Files in `inbox/` and `archive/` (and my original student folders such as `Daisy/`, `Issie/`, `Lyra/`) are source material only. Never edit or delete them.

## Tech rules

- Plain HTML, CSS and JavaScript only. No frameworks, no build step.
- All content lives in data files: `site/data/<student>/<week>.json`, named by the Monday of that week (for example `2026-11-23.json`). Adding a week means adding a data file, not writing new code.
- Fast on phones and slow wifi.
- Add `<meta name="robots" content="noindex">` to every page.

## Site structure

- No home page listing the students. Each student has their own page at a hard-to-guess address (for example `/daisy-k7m2q/`). Students cannot find each other's pages. The site's main address only says "Ask your teacher for your link."
- Each student page has: "This Week" at the top (newest week), "Practice Anytime" (times tables, saved word banks), and "Past Weeks".
- Each week shows only the activities that fit that week's material. Choose from:
  1. **SPELLING**: listen and type. The browser reads each word aloud with an English voice, with a slow button. Letter hints. Missed words come back until all are correct. A "Test mode" that works like a real spelling test.
  2. **FLASHCARDS**: flip cards, shuffle, "I know it" and "Still learning" piles, like Quizlet. For bilingual students, the Chinese meaning goes on the back.
  3. **MATCH GAME**: tap matching pairs against a timer, best time saved.
  4. **SPEED QUIZ**: Kahoot style. 10 multiple choice questions, 20 second timer, more points for faster answers, 4 coloured answer buttons with shapes, streak bonus, final score screen.
  5. **READING**: a short passage at the student's level. Key words taught first, then multiple choice comprehension questions, then one "write a complete sentence" task with a checklist (capital letter, full stop, makes sense).
  6. **GUIDED ANSWERS**: for maths and homework questions. The question shows first, alone. Then "💡 Hint", "Show Step 1", "Show next step" until the end. Final answer in bold, then a "✅ WHY" line.
  7. **TIMES TABLES SPRINT** (in Practice Anytime): choose the tables, accuracy first, then speed.
- Bilingual students get an EN / 中文 switch. Instructions, hints and explanations in both languages. Questions stay in English.
- Every week also gets a print-friendly page that prints cleanly in black and white.

## Score tracking

- Each student's page already knows who they are from their link, so no name typing.
- Every spelling test, quiz and match result is sent to a Google Sheet I own, using a Google Apps Script web app. Columns: date and time, student, week, activity, score, total, time taken, words or questions missed.
- HOW IT WORKS NOW (set up 20 Nov 2026): scores go to a Google Form called "Score Collector" (one short-answer question, fields joined by tabs), which saves into the Google Sheet "Tutoring Scores (Form)". Its "Scores" tab splits them into the columns above with a formula. The form address and question id are in `site/config.js` (`SCORE_FORM`). No Apps Script needed. (The Apps Script route kept failing at Google's permission pop-up; `apps-script/` is kept only as a backup.)
- For parent reports: open the sheet, go to the **Scores** tab, then File → Download → CSV, and save it into `scores/`.
- If there is no internet, the activity still works, the score is kept in the browser and sent later.

## Weekly routine (commands I will type)

- **"New week for Daisy"** (or any student): read everything in `inbox/<student>/`. Show me a short list of what you found (spelling words, topics, questions, due dates) and which activities you plan to build. Wait for my OK. Then build, run the checks, show me the preview. After I approve, ask before moving the files to archive.
- **NEW STRUCTURE (22 Nov 2026, all students):** (1) ONE undated **Main Book** per student (`site/data/<student>/mainbook.json`, chapters by code, every word explained in simple words BEFORE it is used, basics first, pictures; set `mainBook: true`). (2) **Workbook** = class days (Daisy Tue/Thu/Sun, Lyra Wed/Sun, Issie Mon/Fri), max 25 questions, practice only. (3) **Homework** = non-class days (`kind: "homework"`), quizzes as `hwquiz`: one try, timer per question, records going back, results go to the score sheet. (4) **Homework Review** = question by question with the student: answer first, reveal answer + why, she scores herself. NEVER judge her answers from photos (photo reading was unreliable); no "her answer", no right/wrong lists, no stars from Claude. Class order: Homework Review, Main Book, Workbook, Workbook review.
- **Homework review (old notes below are replaced by the structure above):** mark every question from the photos. In the week file add a `reviews` entry per homework day: each item has the question, her answer, the right answer, `ok` true/false, a short `why` (EN + 中文), and for wrong ones a `whyWrong`. Unsure items get `check: true` (go through together), never a guess. Link fix-it practice in `practice`. This shows as the orange 📋 Homework Review button (Correct answers / Wrong answers buttons, stars) and fills the 📒 Homework Log. Set `homeworkLog: true` in the student's `student.json`.
- **Workbook for a lesson day** (e.g. "Sunday 22 November"): add a `days` entry with the date and its activity ids. The FIRST activity is a `lesson` (teaching slides Lawrence goes through with the student: pictures, moving diagrams, 🔊 read aloud), then the practice (flashcards, `fillblank`, match, quiz...). Shows as the purple 📘 Workbook button. Lyra's week 2026-11-16 is the model.
- After any change to `site/assets/`, bump the `?v=` number in every `site/*/index.html` and `print.html` so iPads load the new files.
- **"Parent report for Daisy"** (or any student): read the newest CSV in `scores/` and draft a short, warm, specific weekly report for the parents in one code block: Chinese first, then English for reference.
- **"Publish my changes"**: update the live site. The links stay the same.

## Content rules

- Use the school documents to learn WHAT to practise: word lists, topics, question types. Copy spelling words and homework questions exactly when the student must practise those exact items. Write my own extra practice and passages in the same style.
- Never put scans or photos of school pages on the site.
- Never put surnames, school names, teacher names, other children's names, or grades and scores from school reports on the site.
- Names in examples and stories: English names only (Lily, James, Emma, Tom, Sophie), plus the student's own name now and then. Never Thai, Chinese or Indian names.
- Favourite topics for each student are in `students.md`. Daisy: K-pop, animals, swimming, stationery shopping, phones, food, festivals, adventure.
- Tone: simple, warm, encouraging, never condescending. Praise on every correct answer.
- No em dashes anywhere in site text.

## Accuracy rules (MOST IMPORTANT)

- Check every answer with a Python script before it goes into a data file.
- If a school answer key exists, every answer must match it. If your working disagrees, do not guess: add it to `CHECK-ME.md` with the file name and question number, and ask me.
- Spelling words must match the source list exactly. Run a check script comparing each data file to its source list.
- Maths: show every step, never skip an in-between value. Units on every final answer. Correct notation: cm², 2³, never cm^2 or 2^3.
- Quiz wrong options should be believable common mistakes.
- Chinese: simple, standard Simplified Chinese.

## Design rules

- Big, clean and friendly for ages 11 to 14. Body text at least 20px on phones and 24px on computers. All question text bold.
- Colours: orange = question, yellow = hint, green = answer, blue = teaching, dark blue = titles.
- Each student page has its own accent colour and greets them by first name ("Hi Daisy!").

## How we work

- Build the site and Daisy's page first, using what is in `inbox/daisy/`. Show me the preview and wait for my feedback before the other students.
- After that, one student per session.
- Before you change, move or delete any file I made, tell me which file and what change, and wait for my OK. Creating new website files inside this folder is fine once I approve the plan.
- Keep your messages to me short. After each task, tell me exactly what you changed.

## Publishing

- The site is live on GitHub Pages from the PUBLIC repo `lawrenceroy1-lab/study-hub` (my choice, 20 Nov 2026: students go by nicknames only). Live address: https://lawrenceroy1-lab.github.io/study-hub/
- "Publish my changes" = run `python3 checks/run_checks.py`, then commit and push to `main`. The GitHub Action in `.github/workflows/pages.yml` publishes `site/` automatically. Links stay the same.
- Because the repo is public: before every push, check that no real names, surnames, school names, parents' or teachers' names are in ANY uploaded file (not just `site/`). Real names live only in `checks/private_words.txt`, `students.md` and `context/`, which are git-ignored. Never commit those.
