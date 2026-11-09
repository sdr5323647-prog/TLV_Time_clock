TIME CLOCK  -  work hours tracker (phone, tablet, computer)

WHAT IT IS
A small web app. No ads, no tracking. Works offline. Install it like an app.

HOW SYNC WORKS (optional, step B below)
Each person signs in with their own Google account. Their hours are saved in a hidden app folder
inside THEIR OWN Google Drive - not on your server, and not in any database you own.
 - Nobody else can read the data: not you, not the person who hosts the app.
 - There is no extra password to forget. If a phone is lost or the browser is cleared, signing in
   with Google on any device brings everything back.
 - You pay nothing and store nothing.
Without sync the app still works; each device then keeps its own private copy.


A) PUT THE APP ONLINE  (2 minutes, free)
1. Go to https://app.netlify.com/drop
2. Drag this whole folder (time-clock-app) onto the page.
3. Netlify gives you a link such as https://something.netlify.app
   Write it down - you need it in B4.  (Optional: Site settings -> change site name.)


B) TURN ON SYNC  (one time, about 15 minutes, free)
Google's screen names change now and then; the idea of each step stays the same.
1. Go to https://console.cloud.google.com -> project selector (top bar) -> New project
   -> name "Time Clock" -> Create. Make sure that project is selected.
2. Menu -> APIs & Services -> Library -> search "Google Drive API" -> Enable.
   Then search "Google Sheets API" -> Enable (used for the automatic backup spreadsheet).
3. Menu -> APIs & Services -> OAuth consent screen (may be called "Google Auth Platform") -> Get started.
   - App name: Time Clock. User support email: yours. Audience: External. Contact email: yours.
   - Data Access / Scopes -> Add or remove scopes -> tick these two, then Save:
       .../auth/drive.appdata      ("See, create and delete its own configuration data in your Google Drive")
       .../auth/drive.file         ("See, edit, create and delete only the specific Google Drive files you use with this app")
       .../auth/userinfo.email
     These are the only permissions the app asks for (drive.file = only the backup spreadsheet the app creates). It can NOT see anything else in anyone's Drive.
   - Audience -> "Publish app" (move it from Testing to In production).
     If you leave it in Testing, only people you add as "Test users" can sign in.
     These two scopes are low-risk, so Google does not require a verification review.
4. Menu -> APIs & Services -> Credentials -> Create credentials -> OAuth client ID
   -> Application type: Web application -> name: Time Clock web
   -> Authorized JavaScript origins -> Add URI -> your Netlify address exactly, e.g.
      https://something.netlify.app      (no slash at the end)
   -> Create. Copy the "Client ID" (it ends with .apps.googleusercontent.com).
5. Open the file  sync-config.js  in this folder with Notepad / any text editor, paste the
   Client ID between the quotes, save.  (The Client ID is public; it is not a secret.)
   Shortcut: send the Client ID to whoever built this app for you and they can fill it in.
6. Upload the folder to Netlify again (drag it onto your site's "Deploys" page).
   Open the link, tap the gear icon, tap "Sign in with Google". Done.


C) HOW EACH PERSON USES IT
- Open the link. Phone/tablet (Chrome): menu -> "Install app" / "Add to Home screen".
  iPhone/iPad (Safari): Share -> "Add to Home Screen". Computer (Chrome/Edge): install icon in the address bar.
- Gear icon -> "Sign in with Google" on every device. Hours then sync automatically.
- Hours entered before signing in are uploaded on the first sign-in.
- Sync is not instant: it runs a few seconds after a change, when the app is opened or comes to the
  front, and about once a minute.
- Google lets an app keep access for one hour at a time. After that the app shows
  "Tap to reconnect"; the next tap anywhere renews it (a Google window flashes for a second).
  Everything keeps working offline in the meantime.
- On a shared device use "Sign out & clear this device".
- Settings -> Backup lets you download / restore a file copy of your data at any time.


THINGS TO KNOW
- Honest limit: you host the app code, so a modified copy of the code could in theory misuse
  people's Google access. Only ever host the files from this package.
- To remove the stored data completely: Google Account -> Data & privacy -> Third-party apps and
  services -> Time Clock -> Delete app data.
- Conflicts: if the same entry is changed on two devices, the most recent change wins.
- "Hours report (Excel)" fills in the Torah Live hours template. Everyone else can use CSV.


UPDATING
Replace the files on Netlify. If you change index.html, also bump CACHE = 'timeclock-v4' in sw.js
(for example to 'timeclock-v5') so devices pick up the new version.
