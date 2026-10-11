# Project knowledge

Start is at additional competitor research and primary-flow review. The participant wants an iPhone couples app where a mini version of the sender carries care reminders to their partner's Home Screen widget. The first-version scope is agreed; recommended flows still need participant agreement. Implementation and experience checks belong to Develop.

## Progress and shared Page

- Current stage: Start — Additional competitor research and primary flow review.
- Project Page: [Couples Care Reminder App Project Brief](https://chatgpt.com/space/page_dacc81be83fc8191a71b64d03b5a5f5d) — ID `page_dacc81be83fc8191a71b64d03b5a5f5d`.
- Page sync: Existing brief preserved. Additional competitor comparison, Mobbin interface/flow references, two native Mobbin reference images, corrected connection status, and Workshop progress saved and read back at sequence 10. Reference image files inspected; rendered Page layout remains unverified. Proposed primary flows are intentionally pending participant agreement before adding them as requirements.
- Last meaningful update: 2026-10-11 — participant requested renewed competitor/flow research, selected @Mobbin after a standalone connection failed, and requested a Start skill routing fix. The selected Mobbin app searches succeeded. First-version scope remains confirmed.
- Next checkpoint: Review the recommended send-and-receive care journey, scheduling branch, and partner/widget setup. After explicit agreement, add an editable Primary user flows section to the same Page. The completed PRD and suggested demonstration still await final review. Develop and Design have not begun.

## Team details

Project name, team name, member names, and up to two selected tracks: not yet provided. Available tracks are Design × Tech, Culture × Tech, Best Use of Tech, and Common Ground Award.

## Idea and purpose

Confirmed idea: an app for couples to remind each other in two ways: schedule a cute reminder with text and an animation, or tap to send the other person an immediate notification. Examples supplied by the participant: eat, take pills, drink water, and walk, described as "life improvement stuff." Latest participant direction: a miniature avatar of you lives in your partner's widget and carries your reminders. Chibi and pixel are candidate styles, not a chosen aesthetic. They describe the app as similar to Widgetable but simpler and focused only on reminders. First version uses simple avatars, text, send now or schedule for later, an iPhone Home Screen widget, and a short arrival animation. Dress-up is deferred. These are intended capabilities; nothing has been built or tested.

Superseded: the earlier childlike messenger analogy and proposed shared-pet reference direction. The participant explicitly shifted the character to a mini partner because the pet felt too similar to Widgetable. This is the participant's design rationale, not a verified uniqueness claim.

## Audience and context

Confirmed intended audience: couples who are apart at work, including long-distance couples. The participant says these reminders are currently sent as texts. Desired recipient feelings: happiness and feeling loved; the participant's phrasing is "less naggy more lovey." This is intended impact, not a tested outcome. Confirmed platform and first-version placement: iPhone Home Screen widget. No audience research has been conducted; the texting behavior is participant-reported.

## References and decisions

Current pyramid: foundation is everyday care reminders for couples to feel loved; middle is time apart at work or across distance and an iPhone Home Screen widget; top is a mini partner reminder messenger.

Confirmed first-prototype scope: one simple avatar per partner, text reminder, send now or choose a time, recipient-side Home Screen widget message with a short arrival transition, and dress-up deferred. Native delivery setup and resources need checking during Develop. No substitution of a simulation has been agreed; discuss and label any necessary scope adjustment.

Suggested demonstration, awaiting team review: send "Remember to eat ❤️", show the recipient's mini partner and text in the widget, then demonstrate a scheduled message. This is an agent suggestion derived from the intended experience, not agreed acceptance criteria. Remaining build questions include partner pairing, notification permission, cross-device delivery, iOS versions, and time zones; visual style remains open.

Apple constraints verified from official documentation on 2026-10-11: [widget data-update animations](https://developer.apple.com/documentation/widgetkit/animating-data-updates-in-widgets-and-live-activities) have a two-second maximum; [refreshes](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date) and [widget push updates](https://developer.apple.com/documentation/widgetkit/updating-widgets-with-widgetkit-push-notifications) are managed by iOS budgets. Widget updates are opportunistic, so immediate sending is distinct from guaranteed immediate widget refresh. Notifications and cross-device delivery need separate implementation and real checks in Develop.

Participant reference direction: Widgetable's widget experience is a starting point, simplified to reminders with mini partner avatars. No specific obimy or Finch aspects have been selected.

Additional references already on the latest Page, recovered during this run: [noteit](https://apps.apple.com/us/app/noteit-bff-widget/id1570369625), [Loveit](https://apps.apple.com/us/app/loveit-long-distance-couples/id1609366842), and [Couple Reminder](https://apps.apple.com/ie/app/couple-reminder/id6784205763). Their existing comparison was preserved; these have not become selected design decisions.

Additional competitor research verified from official descriptions in this run:
- [Cupla](https://www.cupla.app/the-app/): shared/assigned to-dos, reminders and recurring tasks. Functional overlap; a broader shared-planning product. Suggested adaptation: clear recipient and time summary.
- [Nujj](https://play.google.com/store/apps/details?id=com.usheer.nujj): Android listing describes QR pairing, shake-to-nudge notifications, and reminders. Affectionate-nudge/functional overlap; not an inspected iPhone flow. Suggested adaptation: a short send-now action.
- [Love8](https://apps.apple.com/us/app/love8-app-for-couples/id6448163027): notes, Miss You effects, and distance/anniversary widgets. Adjacent connection reference; description does not establish scheduled avatar-delivered care reminders.
- [Abode official site](https://www.getabode.app/) and [inspected Mobbin home screen](https://mobbin.com/screens/5bbb9bb6-81bd-4410-86d9-148fbc309603): shared notes, doodles, to-dos, and widgets for friends. Screen shows shared-space tiles and a composer. Adjacent widget competitor; proposed adaptation is one partner and one care message as the focus.

Inspected Mobbin iPhone flow references, used for structure rather than competitor claims:
- [Tolan friend chat](https://mobbin.com/flows/6984ba32-4fb4-4c70-9ccc-eea8a37f3448): friend selection, text composition, and messages appearing in conversation. Analogy for composing/sending; not widget or care delivery.
- [Messages scheduling](https://mobbin.com/flows/be9da56e-90e1-4ab5-b2da-9139133fd87d): Send Later, date/time picker, visible selected time, and scheduled message with Edit. All six screens inspected through previews and downloaded missing screens.
- [Clue connection](https://mobbin.com/flows/a1663af5-6362-41aa-be38-006ab66cf903): sharing explanation, invite/code entry, named connection, and removal control. All five screens inspected. Pairing analogy only; cycle-data sharing is outside scope.
Named searches did not return noteit screens or the requested Abode/Paired flows. No exact mini-partner widget delivery flow established. Search results were checked by returned app name and visible content; unrelated results were not attributed to named competitors.

Proposed primary flows, awaiting participant agreement; not implemented or tested:
1. Send now: while apart, sender opens the partner home, writes a care reminder, previews their mini avatar with the message, and taps Send now. Show sending/sent or failed with draft-preserving retry; do not equate sent with read. Recipient gets the care notification and sees the sender avatar/message when the widget updates; tapping opens the message. Tolan's chat structure informs composition; widget/avatar delivery is derived from the agreed brief.
2. Schedule branch: same composer, Schedule for later, date/time selection with explicit recipient time, preview, confirm, and an upcoming-message summary with edit/cancel. Messages informs visible scheduling and editing. Time-zone presentation and edit/cancel are new recommendations, not confirmed additions.
3. Essential setup: choose a simple avatar, invite partner or enter their code, show both connected, explain/enable notifications, guide widget placement, and try a sample reminder. Clue informs invite/code and connection feedback. Exact setup order and sample reminder are recommendations.
The purpose is the participant's desired "less naggy, more lovey" experience. A reply/acknowledgement is not currently in confirmed scope.

Native Page images added this run: Abode `library-file:fde1_bGliZmlsZV9SNDNQQlRKY0h3UDVDY0J2ckh5LVNn_FileDrive_fba049f2c73c8191b3f17727382afe9c`; Messages `library-file:fde1_bGliZmlsZV9OVnA4bjBoUjA4TlFBeXNNR3ZZTHp3_FileDrive_fba049f2c73c8191b3f17727382afe9c`. Downloaded from Mobbin's high-resolution image URLs; credited reference material, not prototype assets.

Researched references reviewed during Start:
- [Widgetable official listing](https://play.google.com/store/apps/details?hl=en&id=com.widgetable.theme.android): co-parented virtual pets, widgets, shared messages. Agent suggestion: a character that feels shared. Difference: caring for a virtual pet rather than a messenger delivering care reminders for the person.
- [obimy official listing](https://apps.apple.com/us/app/obimy-feel-them-with-you/id1529189515): affectionate tactile gestures, including hugs and kisses, for distant loved ones. Agent suggestion: a playful gesture alongside an instant reminder. Difference: emotional expression rather than scheduled everyday-care reminders.
- [Finch official overview](https://finchcare.com/about-finch): virtual bird connected to personal self-care goals, dress-up, and encouragement from friends. Agent suggestion: an encouraging character and clothing. Difference: goal-linked pet adventures and rewards rather than partner-authored care messages.

Official promotional screenshots from their Google Play listings were downloaded, visually inspected, uploaded and inserted into the Page. Native image references:
- Widgetable: `library-file:fde1_bGliZmlsZV90eklKX2xTRV9NME1GOExBNFVXa293_FileDrive_fba049f2c73c8191b3f17727382afe9c`.
- obimy: `library-file:fde1_bGliZmlsZV9VVF9jTjQxRXNqVU9UaHRGa0tWSE9n_FileDrive_fba049f2c73c8191b3f17727382afe9c`.
- Finch: `library-file:fde1_bGliZmlsZV9ZZzZFaXhMRDhjaEVGWlJiLTFaWURR_FileDrive_fba049f2c73c8191b3f17727382afe9c`.
These are credited reference materials, not selected prototype assets; no reuse license established. Listings describe products, not evidence that this project's intended audience will respond as hoped.

Current pyramid native Page image: `library-file:fde1_bGliZmlsZV9DUVFZUXJ3QVhCSlRxVS1ncUpWT1FB_FileDrive_fba049f2c73c8191b3f17727382afe9c`. Local source: `/Users/lucas/.codex/visualizations/2026/10/10/01a126b8-8ead-7442-9555-c422620fa04c/confirmed-partner-pyramid.png`. Captures the agreed Home Screen placement and first-version scope.

## Actual build

Prototype location, implemented capabilities, simulations, limitations, setup requirements, tools/technologies/hardware actually used, and checks performed: no build yet. Keep plans separate from working behavior.

## Experiments and next ideas

What the team tried, learned, discovered, and would do with more time: not yet discussed. Keep agent suggestions separate from team decisions.

## Design direction

Participant proposed chibi or pixel avatars representing the partner. No choice between those styles, mood-board selection, or applied design exists yet. Design stage has not begun.

## Collaboration

Team skills, contributions, and what working together enabled: not yet supplied. Do not invent people or divide credit without evidence.

## Links and judge access

Live demo/deployed project, demo video, source code, optional Figma/prototype, and supporting materials: not yet supplied. Record access checks and brief setup instructions when known. A local file path is not a judge-accessible link.

## AI tools and external resources

Codex assisted the Start conversation, writing, research synthesis, and local project summary. Local file tools read workshop guidance and saved notes. Python with Pillow previously rendered the strategic pyramid and materialized official screenshot files; this was document illustration work, not app implementation. Web search/read tools researched official sources. The standalone `mcp__mobbin__search_screens` connection returned a paid-plan restriction. The participant-selected app connector `mcp__codex_apps__mobbin_search_screens` succeeded on the same query, and `mcp__codex_apps__mobbin_search_flows` also succeeded. Use the selected app connector for subsequent research. The underlying authentication/entitlement difference is unknown; do not infer the participant's plan from the standalone error. Python downloaded high-resolution Mobbin references; local image viewing checked selected files. Pages tools created the private project Page, uploaded images, inserted native references, and read back saves. An earlier Computer Use attempt could not inspect Codex; Page rendering remains unverified. No app coding, generative images, prototype assets, or datasets have been used yet. The assistant's exact model name is unavailable. A separate participant-authorized workshop-kit edit updated Start connection routing and passed the skill validator; it is not prototype development.

## Submission draft

Not drafted. When Submit runs, record the latest seven-section draft, chosen tracks, word counts for sections 2 and 3, unresolved fields or access checks, and review status. Do not mark an entry as submitted unless an authorized external submission actually occurred.
