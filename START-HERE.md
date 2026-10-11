# Cultural Hackathon Agent Kit

Draft for first testing. Updated 10 October 2026.

Use this kit to work from an idea to a prototype, its aesthetic direction, and a Common Ground submission draft. It supports apps, games, installations, artworks, and participatory experiences. You can start with an unfinished idea and use ordinary language throughout.

## Open the kit

1. Unzip the whole folder. Keep the hidden `.agents` folder inside it.
2. Open `cultural-hackathon-kit` as a project folder in Codex and start a chat there.
3. Make sure Codex can create and edit Pages. Research uses web search and, for relevant digital interfaces, Mobbin when connected. Image generation is used for the strategic pyramid when available.
4. Send: **Use the Start skill in this folder.** You can also invoke it as `$start` where supported.

The agent's first question should be: **What are you hoping to make?**

The workshop shorthand is `/start`, `/develop`, `/design`, and `/submit`. The kit recognizes these messages if the host sends them to the agent; it does not install native slash-menu commands. If the host intercepts a slash command, use the plain-language prompts below.

## Work through the four stages

| Stage | What happens | Prompt |
| --- | --- | --- |
| Start | Explain your idea, explore the audience and context, review a pyramid, look at related work, and agree on a PRD. | Use the Start skill in this folder. |
| Develop | Read your corrected PRD, make a build plan, create a greybox, and try the experience together. | Use the Develop skill with this project Page: [paste link]. |
| Design | Share a mood board or find references together, refine the direction, and apply it to the prototype. | Use the Design skill with this project Page: [paste link]. |
| Submit | Draft the seven-section Common Ground entry from existing context and ask only for missing details. | Use the Submit skill in this folder. |

Start aims to take about 30 minutes. Develop and Design happen during the rest of the hackathon. Edit your project Page whenever you need to; the agent should read those edits before proceeding. Keep the Page link for your team and for the next stage. Use Pages' sharing controls to give teammates access.

Your shared project brief, PRD, and submission draft live in Pages. All four skills also read and update `PROJECT-KNOWLEDGE.md` in this folder so a new chat can recover your project context. This file starts empty and records your decisions, actual build, experiments, team contributions, links, and AI/tool attribution as you work. If a Page update cannot be saved, the agent should say so and record it as pending in the knowledge base.

You can use Submit without completing the other stages. It follows the supplied Common Ground template, limits the whole Project Overview and the whole Build section to 100 words each, and includes the reflections for your chosen tracks. It prepares one draft for your team to review and copy into the event's submission form; it does not send the entry.

## First walkthrough

Lucas will be the first tester. A workout tracker or another fitness-app idea is a possible example, not a predetermined project.

Run Start from the beginning. Notice whether the questions help you express your idea, whether the reflection sounds like you, whether the references are useful, and whether the PRD preserves your decisions. Then try Develop and Design when ready.

No participant walkthrough has been run yet. File-format checks do not establish that the workshop flow works.

## Edit the kit

- `AGENTS.md`: shared behavior and routing.
- `.agents/skills/start/SKILL.md`: questions, research, and PRD handoff.
- `.agents/skills/start/references/prd-outline.md`: project document structure.
- `.agents/skills/develop/SKILL.md`: planning, greybox building, and testing.
- `.agents/skills/design/SKILL.md`: aesthetic exploration and application.
- `.agents/skills/submit/SKILL.md`: context-aware submission drafting.
- `.agents/skills/submit/references/submission-template.md`: the supplied Common Ground template.
- `PROJECT-KNOWLEDGE.md`: the project's persistent local knowledge base.
- `FACILITATOR-NOTES.md`: the decisions behind this draft.

These are editable text files. Preserve the name and description at the top of each skill. After edits, reopen the project if Codex does not show the updated skill.
