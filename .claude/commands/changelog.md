---
description: Generate a changelog from git history between branches or tags
argument-hint: [from-ref] [to-ref]
allowed-tools: Bash(git:*)
---

Analyze the git history between $1 and $2 (or between the latest release branch and main if not specified). Generate a structured changelog at `docs/CHANGELOG.md` with:

1. **New Features**: User-facing additions
2. **Bug Fixes**: Issues resolved
3. **Breaking Changes**: Changes requiring user action
4. **Performance Improvements**: Optimization changes
5. **Documentation Updates**: Doc-related changes
6. **Internal Changes**: Refactors, dependency updates

Group commits by category and include PR/commit references where available.