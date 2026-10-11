---
name: submit
description: Prepare a concise Common Ground hackathon project submission from existing project context, Codex Pages, and the local knowledge base, asking only for missing information. Use when a team invokes Submit or asks to draft its entry; drafting does not send the submission.
---

# Submit

Generate the team's entry using [the supplied Common Ground template](references/submission-template.md). Use what is already known; ask only for genuinely missing information. This skill is available independently of Start, Develop, or Design and does not require a polished or technically complex project.

## Recover the project context

Read `PROJECT-KNOWLEDGE.md` in the active project root, the latest linked project Page, the current conversation, and relevant prototype/source documentation. Create the knowledge base if absent; do not confuse an empty starter with a real project. Recover existing links before asking the team to repeat them. Inspect the actual build where feasible without changing it.

Follow the active Pages tools and applicable guidance. Participant corrections govern intended meaning; fresh build evidence governs what exists. Do not turn planned PRD features into claims about the delivered prototype. Resolve only material contradictions. Do not infer team names, members, selected tracks, experiments, learning, contributions, or model identities from unrelated context.

Check coverage against all seven sections before asking anything. If the necessary context is present, draft immediately without running an interview or asking for permission to generate the entry. If only a few fields are missing, draft the supported parts and ask targeted questions for those fields. If there is no project context, use the template as the interview structure, working through it in short conversational turns rather than dumping all questions at once. A closely related cluster of missing fields may be asked together.

## Fill only the gaps

Collect these details when they are not already established:

1. Project name, team name, member names, and the team's choice of up to TWO tracks: Design × Tech, Culture × Tech, Best Use of Tech, Common Ground Award. If they have not chosen, offer a grounded suggestion and let them choose. Do not invent award eligibility rules. If they select more than two, help them narrow it before marking the draft complete.
2. One-liner, problem or inspiration, what they built and how it works, and what makes their approach interesting. Creative meaning is valid; novelty or commercial differentiation is not mandatory.
3. Actual tools/technology, the current working state, what they experimented with and learned, and what they would do next. Ask for their experience or intention when no evidence supplies it; do not invent a lesson or roadmap to fill a field.
4. Demo/deployment, demo video, source code, optional Figma/prototype, supporting materials, and any setup instructions. Source code is required for code-based projects; for a project not based on code, mark it not applicable with a short reason. Distinguish missing material, not applicable material, and an available link. Hardware or in-person experiences can be explained through a video and setup instructions. Do not fabricate an upload or deployment.
5. The applicable Design × Tech and/or Culture × Tech reflection. Answer both when both are selected. When neither is selected, mark this section not applicable; do not invent extra prompts for Best Use of Tech or Common Ground Award. Use established intent and results, asking only where the reflection would otherwise be speculation.
6. How the team combined skills, disciplines, or perspectives and what collaboration contributed. For an established solo participant, describe the actual solo process honestly rather than inventing collaborators.
7. AI tools/models and their purposes, plus credit for third-party assets, datasets, and references. Recover actual research, code, image, design, and writing assistance from the knowledge base and current work. Include assistance used to prepare the entry itself. Unknown model versions remain unknown; do not claim no AI was used when this workflow assisted the project or submission. Ask about external work that is not visible to the agent.

Never ask a question solely because it appears in the template if its answer is already available. Keep an unresolved checklist outside a partially drafted submission and leave missing facts clear. A participant can request a partial draft; label it as such and do not mark it ready.

## Draft the seven sections

Preserve the template's seven numbered sections, field labels, four track names, and conditional reflections. Write concise, concrete prose in the team's voice. Describe the idea, what was explored, what exists now, and why it matters without exaggerating impact, validation, novelty, cultural authority, or build maturity.

The 100-word limit applies to the WHOLE Project Overview section, across its four fields, and separately to the WHOLE Build section, across its four fields. It is not 100 words per field. Aim comfortably below each cap and count programmatically before delivery, including field labels conservatively. The helper [check_word_limits.py](scripts/check_word_limits.py) reads a Markdown export or standard input and checks sections 2 and 3; use temporary text for the check rather than creating another shared project document. A passing word count does not establish completeness or accuracy.

Keep links out of those limited descriptions when they belong in section 4. Use real, direct URLs. A localhost URL, private file path, inaccessible repository, or successful signed-in Page read does not prove judges can access it. Check access without the team's credentials when the available tools permit it; otherwise record access as unverified and ask the team to check. Do not change permissions, publish, or upload files as part of drafting without authorization. Keep setup instructions short and specific.

## Save and present

Save the draft in a Submission section of the existing project Page, preserving the PRD and unrelated sections. If this is a new project without a Page, create one with the supplied project name and supported context, then add the submission; do not start the full Start interview. Use real returned links, fresh edit guards, and read-back verification.

Update `PROJECT-KNOWLEDGE.md` with recovered facts, actual AI attribution, latest submission text, section word counts, unresolved fields/access checks, and review status. Reconcile existing edits rather than replacing the file blindly. If Pages is unavailable, maintain the local knowledge base, present the draft in chat, and state that the Page update is pending; do not claim the draft was saved there.

Present the reusable submission in chat as a document writing block where the host supports it, or ordinary copyable Markdown otherwise. Put missing-information notes and word counts outside the finished artifact. Provide the actual Page link when saved. Invite corrections without requiring a redundant question round when context was sufficient.

Mark the entry ready for team review only when required details, applicable reflections, attribution, and word limits are complete. Separately identify missing required source links and unverified judge access; do not hide these in a polished draft. Drafting one entry per team is the output of this skill. It does not send an external form, change sharing, or generate a demo video. Never claim the entry has been submitted merely because the draft is finished.
