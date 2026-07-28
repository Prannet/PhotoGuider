# Manual Device Test Checklist

Run this checklist on a real iPhone and a real Android phone before each release, and before the first rollout to coworkers. Automated tests cover the app's logic but cannot exercise the camera, share sheet, or a real Microsoft/SharePoint login.

## Setup
- [ ] App installed to the home screen from the deployed URL on both an iPhone and an Android phone.

## Vehicle session, happy path
- [ ] Start a new session, choose Vehicle, enter a Unit # using the numeric keypad.
- [ ] Take at least one photo in every required category (Front, Driver's Side, Passenger Side, Back, Tire, Interior, Speedometer).
- [ ] Take two photos in Driver's Side and confirm both appear as separate thumbnails.
- [ ] Add a Damages photo with a note, and confirm the note field appears only for Damages/Additional.
- [ ] Confirm "Finish Session" stays disabled until all required categories have at least one photo, then enables.

## Other Item session
- [ ] Start a new session, choose Other Item, enter a Name using the text keyboard (e.g. `Oak Dresser`).
- [ ] From either Vehicle or Other Item's identifier screen, tap "Start Over" and confirm it returns to the start screen without creating a session.
- [ ] Confirm the category list shown is Front, Left Side, Right Side, Back, Detail/Close-up, Damages, Additional (no Tire/Interior/Speedometer).
- [ ] Confirm "Finish Session" is disabled until Front has a photo, then enables — Left Side, Right Side, Back, and Detail/Close-up are optional and do not block it.

## Offline capture
- [ ] Turn on airplane mode mid-session, continue taking photos in remaining categories, confirm no errors and progress is retained.
- [ ] Close the app (or the tab) mid-session, reopen it, and confirm the in-progress session resumes with photos intact.

## Sending
- [ ] With connectivity restored, tap "Send to SharePoint," sign in with a real work account on first use, and confirm the zip appears in the target SharePoint folder.
- [ ] Tap "Send via Email," confirm the phone's native share sheet opens with the zip attached, and confirm sending completes.
- [ ] Turn on airplane mode, attempt a send, confirm it shows "Failed — Retry" and the session is not lost; turn connectivity back on and retry successfully.
- [ ] On the Review & Send screen, confirm "Start Over" is disabled while a send is in progress, then tap it once idle, confirm it, and confirm the session is discarded and the app returns to the start screen.

## Duplicate identifier
- [ ] Start a second session on the same phone using an identifier already sent earlier that same day, and confirm the warning appears before a second confirmation is required.

## Cross-device
- [ ] Repeat the "Sending" section on the other phone platform (if the first pass was iPhone, repeat on Android, or vice versa).
