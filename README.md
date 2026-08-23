# Rutba-Native-Apps
Rutba Native Workspace Apps

## Contribution Policy – AI Name Restriction

This repository enforces a strict rule: **no AI model names, AI organisation
names, or AI product names** may appear anywhere in the codebase.  This covers:

* Commit messages (including `Co-authored-by:` trailers)
* Author / committer identity fields
* File names (tracked or staged)

Blocked terms include (but are not limited to): OpenAI, ChatGPT, GPT-3/4,
Codex, DALL-E, Copilot, Anthropic, Claude, Gemini, Bard, LLaMA, Mistral,
Grok, Cohere, Midjourney, Stable Diffusion, and similar AI model / org names.

### Enforcement

A **GitHub Actions workflow** (`.github/workflows/block-ai-names.yml`) runs
on every push and pull request and will **fail** the check if any blocked name
is detected.

### Local pre-commit hook (recommended)

Catch violations before you push by enabling the bundled hook:

```bash
git config core.hooksPath .githooks
```

The hook runs automatically on every `git commit` and rejects commits that
contain blocked AI names in filenames or commit messages.
