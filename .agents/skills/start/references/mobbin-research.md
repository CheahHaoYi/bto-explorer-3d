# Mobbin competitor and primary-flow research

Use this during Start for an app, website, or webapp, after the team explicitly confirms the idea and framing. Skip it for other media. First research related competitors, then recommend the primary user flows. Keep the research small enough for Start; aesthetic redesign belongs to Design.

## Ensure Mobbin is available

Discover the available Mobbin tools and their connection provenance before searching. Select the connection in this order:

1. The Mobbin app or connector explicitly selected by the participant, including an `@Mobbin` mention.
2. The connected Mobbin app in the current host.
3. A standalone Mobbin MCP connection, only when neither of the above is available.

In Codex, app tools may be named `mcp__codex_apps__mobbin_*`, while a standalone connection may expose `mcp__mobbin__*`. These are examples, not fixed schemas; inspect the actual session tools. Do not treat similarly named connections as interchangeable or assume they share authentication, account, or plan access. Keep subsequent screen and flow searches on the connection that succeeds.

Reuse existing official skills and the selected connection. Install only when needed capabilities are missing. Use the official skills from [mobbin/skills](https://github.com/mobbin/skills), following its current installation instructions for the active host. Prefer the native plugin when installation is needed because it includes both skills and the Mobbin MCP search connection. The documented Codex setup is:

```bash
codex plugin marketplace add mobbin/skills
codex plugin add mobbin@mobbin
```

For a host supporting only Agent Skills, use `npx skills add mobbin/skills` and configure the Mobbin MCP separately using the host's supported configuration mechanism and `https://api.mobbin.com/mcp`. Preserve unrelated configuration. Do not treat a skills-only installation as a working search connection.

Read the installed Mobbin `best-practices` and `search` skills before searching. Report any reload or sign-in step needed; do not claim availability from an installation success alone. Access requirements belong to the selected connection; a paid-plan error from a standalone connection does not establish the participant's plan or the connected app's access. Do not purchase a plan or create an account without authorization.

If a connection refuses a search, stop calls to that connection and report its actual reason. Record which connection and tool failed in `PROJECT-KNOWLEDGE.md`; do not label all Mobbin access unavailable or prescribe an upgrade based on that response alone. If an unselected standalone connection was used by mistake, correct the routing once to the participant-selected or preferred connected app for the requested search. An explicit participant request to retry or select another connector also authorizes that attempt. Do not cycle queries or connections to evade an account-wide restriction. If the correctly selected connection is unavailable or refuses access, follow Mobbin's failure guidance and record the affected research as pending. Broader precedent research may continue separately, but do not present it or proposed flows as Mobbin findings. The team may still agree to clearly labeled provisional flows based on their own decisions.

## Research related competitors

Use Mobbin's `search` skill to find related products and inspect how their interfaces address the confirmed idea. Search by the domain and core task; use `search_screens`, `search_sections`, or `search_flows` according to the target. Check the returned product names and images before describing them. Category searches can reveal candidates; named-product searches can inspect competitors found through broader research. Mobbin has no separate competitor-search tool.

Combine this with App Store or other relevant store listings, official product websites, and focused web research. Mobbin adds interface evidence; it does not replace research into what a product offers or whom it serves. Cite each claim to the source that actually supports it. Do not infer pricing, popularity, audience needs, or market coverage from a Mobbin capture.

Present a few related products, usually three overall rather than three per source. For each, explain the relevant overlap, observed interface pattern, and important difference. Distinguish direct competitors from adjacent products and interaction inspiration. Link the actual Mobbin results alongside the applicable official listing or website. Record the findings in Related experiences on the same Page and in the knowledge base; keep absent or partial evidence explicit.

## Research and recommend the primary user flows

Derive the primary journey from the confirmed audience, situation, and intended outcome. If several journeys are equally plausible, ask one focused question to choose the primary one. Include role-specific or alternate paths only when essential to that experience. Avoid defaulting to onboarding or login when those are not the core experience.

After competitor research, use Mobbin's `search` skill with `search_flows` for each essential journey, one journey per query, with the appropriate supported platform. Reuse relevant competitor flows already inspected. Follow its search guidance for unsupported platforms and label any platform analogy accurately. Keep research small: inspect a few relevant existing flows, usually two or three for the core journey. Search by the task people perform. Inspect the ordered screens and available previews before drawing conclusions; isolated screen matches do not establish a complete journey. Screen or website-section searches can supplement a flow when relevant.

Lay out a recommended primary flow in plain language: the starting situation, ordered actions and screens or states, and the feedback or outcome at the end. Show any essential related paths separately, with the relevant role or branch named. Include only essential setup or recovery states for this idea. Explain briefly which observed patterns informed the recommendation, what you adapted, and why it fits their purpose and hackathon scope. Link the actual Mobbin flows returned by tools; label partial matches or cross-domain references as such. References show interaction patterns, not evidence of audience demand.

Ask one main question: **Do these primary user flows fit your idea, or what would you change?** Revise from their answer. Wait for explicit agreement; liking a reference, silence, or the earlier idea confirmation does not approve the recommendation.

## Extend the brief

After agreement, add an editable Primary user flows section to the same project Page and summarize it in `PROJECT-KNOWLEDGE.md`. Record each essential journey's starting situation and outcome, ordered steps, source links and selected adaptations, and material open assumptions. Distinguish confirmed flows from alternatives and untested behavior. Read current Page content before editing, preserve team edits, use current edit guards, and read back the save. If the Page cannot save, record the pending update locally and report it.

Carry the competitor findings, agreed flows, and their references into Develop and Design. Do not restart competitor or flow research in those stages unless a new question or changed requirement warrants it. Design's screen redesign can perform its own focused reference searches.
