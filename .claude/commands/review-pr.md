---
description: "Review changes against the project rules and report findings in a consistent format."
---
<!-- rtv:generated -->
<!-- Generated from .agent/workflows/review-pr.md by `npm run agent:sync`. -->

# Review a pull request

1. Run the gate on the branch: `npm run check`. Anything red is a blocking finding.
2. Walk the diff with the skill `clean-code-review`: placement (architecture rule), imports (aliases, direction), types, component size and responsibilities, design-system usage, accessibility, tests, docs and changelog.
3. For UI changes also apply `accessibility-audit` and check dark mode and mobile layout.
4. Report findings ordered by severity (blocking → should fix → nit), each with file:line, the rule it breaks and a concrete fix. Praise what is good in one line, then stop.
