/* Where scores are sent. Uses a Google Form that saves into my Google Sheet.
   url   = the form's formResponse address
   entry = the id of the form's one question (looks like entry.123456789)
   Leave url empty and scores are kept on the device until it is filled in. */
window.SCORE_FORM = {
  url: 'https://docs.google.com/forms/d/e/1FAIpQLSc6WJwSnM-5ur7mM0TQmpUw-jHpoSRqlWR_J484eVACiW63rQ/formResponse',
  entry: 'entry.1077997005'
};
window.SCORE_URL = '';

/* Where the site reads scores back (the same Google Sheet, shared "anyone with the link can view"),
   so Homework Review shows every try on every device. 25 Nov 2026 */
window.SCORE_READ = 'https://docs.google.com/spreadsheets/d/1oklMgA6bU11A9qDMghazLsHcHh89o74bjbSSlLOX6bQ/gviz/tq?tqx=out:csv&sheet=Form%20Responses%201';
