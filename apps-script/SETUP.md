# Score Sheet Setup (about 10 minutes, one time only)

1. Go to **sheets.google.com** and make a new blank spreadsheet. Name it **Tutoring Scores**.
2. In the menu, click **Extensions → Apps Script**. A new tab opens.
3. Delete everything in the code box. Open the file `apps-script/Code.gs` on your Mac, copy all of it, and paste it into the code box.
4. Click the **💾 Save** icon.
5. Click the blue **Deploy** button (top right), then **New deployment**.
6. Click the **⚙️ gear** next to "Select type" and choose **Web app**.
7. Fill in:
   - Description: `scores`
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy**. Google asks for permission:
   click **Authorize access**, choose your Google account, click **Advanced**, then **Go to (unsafe)**, then **Allow**.
   (It says "unsafe" only because you wrote the script yourself. It only touches this one sheet.)
9. Copy the **Web app URL**. It starts with `https://script.google.com/macros/s/` and ends with `/exec`.
10. Send that URL to Claude, or paste it yourself into `site/config.js` between the quotes:
    `window.SCORE_URL = 'https://script.google.com/macros/s/.../exec';`

**Test it:** open the URL in your browser. You should see "Score collector is running."

**For parent reports:** in the sheet, click **File → Download → Comma-separated values (.csv)** and save it into the `scores/` folder.

**If you edit the script later:** Deploy → Manage deployments → ✏️ edit → Version: **New version** → Deploy. The URL stays the same.
