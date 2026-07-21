# Third-Party Skill: UI/UX Pro Max

The skills in this directory (`banner-design`, `brand`, `design`, `design-system`,
`slides`, `ui-styling`, `ui-ux-pro-max`) are vendored from:

- Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Version: 2.11.0
- License: MIT (Copyright (c) 2024 Next Level Builder)

Installed as project-level Claude Code skills rather than through the
package's marketplace/plugin mechanism, so a few script paths were rewritten
from `${CLAUDE_PLUGIN_ROOT}`/`~/.claude/skills/...` to paths relative to this
repository's root (`.claude/skills/<skill>/...`). No functional changes were
made beyond that.

`banner-design` references a few sibling skills (`ai-artist`, `ai-multimodal`,
`chrome-devtools`, `frontend-design`, `assets-organizing`) that are not part
of this package and are not installed here; its AI-image-generation and
screenshot-export steps won't work without them, but its size/style
reference tables are usable standalone.

See the upstream repository for full documentation and the MIT license text.
