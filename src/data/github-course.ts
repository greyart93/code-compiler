import type { LessonSeed, SectionSeed } from "./course-types";

/**
 * GitHub course content.
 *
 * These lessons are intentionally non-runnable in the Playground: they teach
 * local Git and GitHub workflows, so a "Run" button that only echoes a command
 * would be misleading. The practice steps are meant to be done in a real
 * terminal and a real repository.
 *
 * Authoring note: `md` supports @@ fences, ~~inline code~~, @BT@ for a literal
 * backtick inside a code block, and @D@ for a literal dollar sign before `{`
 * in GitHub Actions expressions.
 */
const md = (raw: string) =>
  raw
    // Only whole-line markers are fences, so code examples that happen to
    // contain @@ stay intact.
    .replace(/^@@([a-z0-9+#.-]*)[ \t]*$/gm, (_, lang: string) => "```" + lang)
    .replace(/~~([^~\n]+)~~/g, "`$1`")
    .replace(/@BT@/g, "`")
    .replace(/@D@/g, "$");

export const GITHUB_FOUNDATIONS: SectionSeed = {
  id: "github-foundations",
  title: "GitHub Foundations",
  lessons: [
    {
      id: "github-mental-model",
      title: "Git, GitHub & the mental model",
      minutes: 7,
      md: md(String.raw`# Git is the tool. GitHub is the place.

Git is a distributed version-control system that runs on your machine. GitHub is
a hosting and collaboration platform built around Git repositories.

You can use Git without GitHub. You cannot use GitHub without Git concepts.

## The five objects to keep straight

| Object | What it is |
|---|---|
| **Working tree** | The files you are editing right now |
| **Index (staging area)** | The snapshot you are preparing for the next commit |
| **Commit** | An immutable snapshot + message + parent pointer |
| **Branch** | A movable name pointing at a commit |
| **Remote** | Another copy of the repository, usually ~~origin~~ on GitHub |

A commit is not “the files as they are on disk.” It is a snapshot you chose to
record. That is why ~~git add~~ exists: it lets you decide what goes into the
snapshot.

## Install and identify yourself

@@bash
git --version
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
@@

Use the email attached to your GitHub account if you want commits linked to your
profile. Check the result:

@@bash
git config --global --list
@@

## Authenticate

For HTTPS, GitHub no longer accepts account passwords from Git. Use one of:

- **SSH key** (best for daily terminal work)
- **Personal access token** (fine for scripts and HTTPS)
- **GitHub CLI** (easiest all-round setup)

@@bash
gh auth login
gh auth status
@@

~~gh auth login~~ walks you through GitHub.com, HTTPS or SSH, and browser or
token authentication.

## The daily mental model

@@text
edit files
   ↓
git status / git diff      ← what changed?
   ↓
git add <files>            ← choose the snapshot
   ↓
git commit -m "..."        ← record it locally
   ↓
git push                   ← publish the commit
@@

Nothing leaves your machine until you push. Nothing enters the shared branch
until a pull request is merged.

## Local vs remote

@@bash
git remote -v
@@

A clone usually has one remote named ~~origin~~. A fork usually has two:

- ~~origin~~ → your fork
- ~~upstream~~ → the original project

That distinction matters in the open-source lesson.

> **Rule of thumb:** commit early and often locally; push when the branch is in
> a state someone else could look at.`),
      exercises: [
        {
          type: "quiz",
          prompt: "What does a Git commit actually store?",
          answers: [
            "a snapshot of the staged changes",
            "a snapshot",
            "staged changes",
            "a snapshot of the index",
          ],
          placeholder: "describe the snapshot",
          hint: "The working tree can contain changes that are not in the commit.",
          explanation:
            "A commit records the staged snapshot plus metadata and a parent pointer. Unstaged edits stay in the working tree.",
        },
        {
          type: "fill-blank",
          prompt: "Set the name Git writes into commits.",
          template: "git config --global ___ \"Ada Lovelace\"",
          blanks: [{ options: ["user.name", "user.email", "author.name"], answer: "user.name" }],
          explanation:
            "`user.name` is the display name; `user.email` is the address GitHub uses to link the commit to an account.",
        },
      ],
    },
    {
      id: "github-first-repo",
      title: "Create & publish your first repository",
      minutes: 9,
      md: md(String.raw`# From empty folder to pushed repository

There are two paths: create on GitHub and clone, or create locally and push.
Learn both; they solve different problems.

## Path A — create on GitHub, then clone

1. On GitHub, click **New repository**.
2. Choose a name, visibility, and optionally a README, ~~.gitignore~~, and license.
3. Create it.
4. Clone it:

@@bash
git clone git@github.com:YOUR_USER/YOUR_REPO.git
cd YOUR_REPO
@@

HTTPS works too:

@@bash
git clone https://github.com/YOUR_USER/YOUR_REPO.git
@@

## Path B — start locally with GitHub CLI

@@bash
mkdir hello-github
cd hello-github
git init
printf "# Hello GitHub\n" > README.md
git add README.md
git commit -m "docs: add README"
gh repo create hello-github --public --source=. --remote=origin --push
@@

~~gh repo create~~ creates the remote and can push the current branch in one
step. Open it:

@@bash
gh repo view --web
@@

## The first commit, slowly

@@bash
git status
git diff
git add README.md
git diff --staged
git commit -m "docs: add README"
git log --oneline --decorate -5
@@

- ~~git status~~ shows what is staged, unstaged, and untracked.
- ~~git diff~~ shows unstaged changes.
- ~~git diff --staged~~ shows exactly what the commit will contain.
- ~~git log~~ shows the history.

Read ~~git diff --staged~~ before every commit. It is the cheapest code review
you will ever do.

## What belongs in the first commit

Good first commits are small:

- README with what the project is and how to run it
- license (if open source)
- ~~.gitignore~~ for dependencies, build output, and secrets
- the smallest runnable skeleton

Do not commit ~~node_modules~~, ~~.env~~, build output, or editor junk.

## A sane Node .gitignore

@@gitignore
node_modules/
dist/
.next/
coverage/
.env
.env.*
!.env.example
.DS_Store
@@

If a file is already tracked, adding it to ~~.gitignore~~ does not untrack it:

@@bash
git rm --cached .env
@@

Then commit the removal. The file stays on disk but leaves the repository.

## Push and set upstream

@@bash
git push -u origin main
@@

~~-u~~ records the remote branch as the default for this local branch, so later
pushes can be just ~~git push~~.

> **Check:** open the repository on GitHub and confirm the README is there.
> A push that “worked” locally but is missing on GitHub is usually a remote or
> branch-name mistake.`),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Push the current branch and remember its upstream.",
          template: "git push ___ origin main",
          blanks: [{ options: ["-u", "--set-upstream", "-f"], answer: "-u" }],
          explanation:
            "`-u` (or `--set-upstream`) links the local branch to the remote branch, so future `git push` calls know where to go.",
        },
        {
          type: "quiz",
          prompt: "Which file should usually never be committed?",
          answers: [".env", "env", "the .env file", "dotenv"],
          placeholder: "filename",
          hint: "It usually contains database URLs and API keys.",
          explanation:
            "`.env` often holds secrets. Commit `.env.example` with placeholder values instead, and keep `.env` ignored.",
        },
      ],
    },
    {
      id: "github-daily-loop",
      title: "The daily loop: status → add → commit → push",
      minutes: 10,
      md: md(String.raw`# The loop you will run a thousand times

@@bash
git status
git diff
git add -p
git commit -m "feat: add repository search"
git push
@@

## 1. Start from a clean base

@@bash
git switch main
git pull --ff-only
@@

~~--ff-only~~ refuses to create a merge commit when the remote has diverged. If
it fails, inspect the divergence instead of blindly merging.

## 2. Stage deliberately

@@bash
git add src/search.ts
git add -p
@@

~~git add -p~~ walks through each hunk and asks whether to stage it. This is how
you keep unrelated changes out of one commit.

@@bash
git restore --staged src/experiment.ts   # unstage, keep edits
git restore src/experiment.ts            # discard edits (destructive!)
@@

## 3. Write a commit message people can use

A useful default is Conventional Commits:

@@text
feat: add repository search
fix: handle empty search query
docs: explain the local setup
refactor: extract the API client
test: cover the conflict path
chore: bump dependencies
@@

The subject is imperative, short, and specific. The body explains **why**, not
what the diff already shows.

@@bash
git commit -m "fix: handle empty search query" -m "An empty query used to return every repository. Return an empty result instead and cover it with a test."
@@

## 4. Inspect before you push

@@bash
git log --oneline --decorate -5
git diff origin/main...HEAD
@@

~~origin/main...HEAD~~ shows what your branch adds relative to the remote base.
If that is not the change you intended, fix it now.

## 5. Push

@@bash
git push
@@

If the branch is new:

@@bash
git push -u origin HEAD
@@

## Undo without fear

| Situation | Safe command |
|---|---|
| Discard unstaged edits in one file | ~~git restore <file>~~ |
| Unstage a file | ~~git restore --staged <file>~~ |
| Fix the last commit message (not pushed) | ~~git commit --amend~~ |
| Undo a pushed commit safely | ~~git revert <sha>~~ |
| Throw away local commits (not shared) | ~~git reset --hard <sha>~~ |

~~git reset --hard~~ destroys uncommitted work and rewrites your local branch.
Never use it on a shared branch. ~~git revert~~ creates a new commit that
reverses an old one, which is safe for history others already have.

## Keep the working tree honest

@@bash
git status --short
@@

A clean tree before switching branches prevents “where did my changes go?”
mysteries. If you need to switch with work in progress, commit it or stash it:

@@bash
git stash push -m "wip: search UI"
git stash list
git stash pop
@@

Stashes are local and easy to forget. Prefer a real WIP commit on a branch.`),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Stage only the hunks you choose.",
          template: "git add ___",
          blanks: [{ options: ["-p", "--patch", "-A"], answer: "-p" }],
          explanation:
            "`git add -p` (patch mode) lets you stage individual hunks, keeping unrelated edits out of the commit.",
        },
        {
          type: "quiz",
          prompt: "Which command safely undoes a commit that is already pushed?",
          answers: ["git revert", "revert", "git revert <sha>"],
          placeholder: "command",
          hint: "It creates a new commit instead of rewriting history.",
          explanation:
            "`git revert` records a new commit that reverses the old one. `git reset` rewrites history and is unsafe on shared branches.",
        },
      ],
    },
    {
      id: "github-branches-prs",
      title: "Branches, pull requests & review",
      minutes: 10,
      md: md(String.raw`# Branch → change → pull request

GitHub flow is a short loop:

1. Create a branch.
2. Make commits.
3. Push the branch.
4. Open a pull request.
5. Address review and checks.
6. Merge and delete the branch.

## 1. Create a branch

@@bash
git switch main
git pull --ff-only
git switch -c feat/repo-search
@@

Name branches by intent, not by your name: ~~feat/repo-search~~,
~~fix/empty-query~~, ~~docs/setup-guide~~.

## 2. Commit and push

@@bash
git add -p
git commit -m "feat: add repository search"
git push -u origin HEAD
@@

## 3. Open the pull request

With GitHub CLI:

@@bash
gh pr create --fill --base main
@@

~~--fill~~ uses the commit subject and body. For a real PR, edit the description
so a reviewer knows:

- what changed
- why it changed
- how you tested it
- screenshots or recordings for UI changes
- linked issue: ~~Closes #123~~

Open it as a draft if it is not ready:

@@bash
gh pr create --draft --fill
gh pr ready
@@

## 4. Review and checks

@@bash
gh pr checks
gh pr view --web
@@

A pull request is a conversation around a diff. Reviewers can comment on a
line, suggest a change, approve, or request changes. Push more commits to the
same branch; the PR updates automatically.

Read failing checks before asking for review. A red CI run is information, not
an insult.

## 5. Merge strategies

| Strategy | History | When |
|---|---|---|
| **Merge commit** | Preserves every commit + a merge commit | Long-lived feature branches |
| **Squash and merge** | One commit on the base branch | Most small PRs |
| **Rebase and merge** | Linear, individual commits | Clean, intentional commit series |

Squash is the safest default for a noisy branch. Use merge commits when the
individual commits carry useful context.

@@bash
gh pr merge --squash --delete-branch
@@

## 6. Sync after merge

@@bash
git switch main
git pull --ff-only
git branch -d feat/repo-search
@@

Delete the remote branch too (the CLI flag above does it). The PR and its
history remain.

## Keep a PR small

A 40-file PR is not reviewed; it is skimmed. Split by behavior:

- one PR for the data model
- one for the API
- one for the UI
- one for the tests, if they are genuinely independent

Small PRs are easier to review, easier to revert, and less likely to sit open
for a week.`),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Create and switch to a feature branch.",
          template: "git switch ___ feat/repo-search",
          blanks: [{ options: ["-c", "-b", "--create"], answer: "-c" }],
          explanation:
            "`git switch -c` creates the branch and switches to it. `git checkout -b` is the older equivalent.",
        },
        {
          type: "quiz",
          prompt: "Which merge strategy collapses a noisy branch into one commit?",
          answers: ["squash", "squash and merge", "squash merge"],
          placeholder: "strategy",
          hint: "It produces a single commit on the base branch.",
          explanation:
            "Squash and merge combines all branch commits into one commit on the base branch, keeping the main history readable.",
        },
      ],
    },
  ],
};

export const GITHUB_COLLABORATION: SectionSeed = {
  id: "github-collaboration",
  title: "Collaboration & Automation",
  lessons: [
    {
      id: "github-issues-projects",
      title: "Issues, labels & project planning",
      minutes: 8,
      md: md(String.raw`# Issues are the unit of work

An issue is not a chat message. It is a durable description of a problem,
decision, or task, with a number you can reference from commits and pull
requests.

## A useful issue

@@text
Title: Empty search returns every repository

What happens:
- Open /search
- Submit an empty query
- Every repository is returned

Expected:
- An empty query returns no results and shows an empty state

Context:
- Reproduced on main at abc1234
- Likely in src/search.ts
@@

The title names the behavior, not the solution. The body gives a reproduction,
expected result, and context.

## Labels, assignees, milestones

- **Labels** group work: ~~bug~~, ~~enhancement~~, ~~docs~~, ~~good first issue~~.
- **Assignees** make ownership explicit.
- **Milestones** group issues toward a release or deadline.
- **Projects** give you a board/table view across repositories.

Do not use labels as a substitute for a clear description.

## Link the work

In a PR description or commit body:

@@text
Closes #42
Fixes #42
Resolves #42
@@

When the PR merges into the default branch, GitHub closes the issue
automatically. You can also reference an issue without closing it: ~~Refs #42~~.

## Issue templates

Commit ~~.github/ISSUE_TEMPLATE/bug.yml~~ so every report asks for the same
information:

@@yaml
name: Bug report
description: Something is broken
labels: [bug]
body:
  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      placeholder: "1. Open…\n2. Click…\n3. See…"
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
    validations:
      required: true
@@

Templates reduce the “it doesn't work” issue to a useful report.

## Triage

A simple weekly routine:

1. Close duplicates and link them to the canonical issue.
2. Ask for a reproduction when the report is not actionable.
3. Add a label and an owner.
4. Move “someday” work out of the current milestone.
5. Keep the board small enough to be believable.

## Practice

Create three issues in a scratch repository:

- a bug with reproduction steps
- a feature with a clear user story
- a docs task with a “good first issue” label

Open a PR that says ~~Closes #<number>~~ and confirm the issue closes on merge.`),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Close an issue automatically when the PR merges.",
          template: "___ #42",
          blanks: [{ options: ["Closes", "Refs", "See"], answer: "Closes" }],
          explanation:
            "`Closes #42` (also `Fixes`/`Resolves`) links the issue and closes it when the PR merges. `Refs` only references it.",
        },
        {
          type: "quiz",
          prompt: "Where do GitHub issue templates live?",
          answers: [".github/ISSUE_TEMPLATE", ".github/issue_template", "ISSUE_TEMPLATE"],
          placeholder: "directory",
          hint: "It is a hidden directory at the repository root.",
          explanation:
            "Templates live in `.github/ISSUE_TEMPLATE/`. GitHub detects them when someone opens a new issue.",
        },
      ],
    },
    {
      id: "github-conflicts-review",
      title: "Merge conflicts & code review",
      minutes: 10,
      md: md(String.raw`# Conflicts are normal

A conflict happens when two branches change the same part of a file and Git
cannot choose. It is not a failure; it is a decision point.

## Update your branch first

@@bash
git fetch origin
git switch feat/repo-search
git rebase origin/main
@@

Or merge instead of rebase:

@@bash
git merge origin/main
@@

Rebase gives a linear history but rewrites your branch. Never rebase a branch
that other people are working on unless everyone agrees.

## Read the conflict markers

@@diff
<<<<<<< HEAD
const limit = 10;
=======
const limit = 20;
>>>>>>> origin/main
@@

- ~~HEAD~~ is your current branch.
- The other side is the branch you are integrating.
- Delete the markers and keep the correct code, which may be a combination of
  both sides.

Then:

@@bash
git add src/search.ts
git rebase --continue
@@

Abort if you need to start over:

@@bash
git rebase --abort
@@

## Force-push safely after a rebase

@@bash
git push --force-with-lease
@@

~~--force-with-lease~~ refuses to overwrite remote work you have not seen. Plain
~~--force~~ can delete a teammate's commits.

## Reviewing a pull request

A good review is specific and kind:

- Point at the line, not the person.
- Explain the risk, not just the preference.
- Distinguish “must fix” from “nice to have.”
- Use a suggestion block for a concrete small change.
- Approve when the change is safe, even if you would have written it
  differently.

@@text
Suggestion: this query runs once per row. Could we batch it with ~~in~~?
@@

## Receiving review

- Assume good intent.
- Answer the concern, not the tone.
- Push fixes; do not force-push during an active review unless the branch is
  yours alone.
- Resolve conversations only when the change is actually addressed.
- Ask for clarification instead of guessing.

## Required checks and branch protection

A repository can require:

- an approving review
- passing CI checks
- a branch to be up to date before merge
- signed commits
- linear history

These are repository rules, not personal preferences. If a check is noisy or
wrong, fix the check rather than bypassing it repeatedly.`),
      exercises: [
        {
          type: "quiz",
          prompt: "Which flag safely force-pushes after a rebase?",
          answers: ["--force-with-lease", "force-with-lease", "git push --force-with-lease"],
          placeholder: "the flag",
          hint: "It checks that the remote has not moved since your last fetch.",
          explanation:
            "`--force-with-lease` only overwrites the remote if it still matches what you last saw, protecting teammates' commits.",
        },
        {
          type: "fill-blank",
          prompt: "Continue a rebase after resolving a conflict.",
          template: "git add src/search.ts\ngit rebase ___",
          blanks: [{ options: ["--continue", "--next", "--resume"], answer: "--continue" }],
          explanation:
            "Stage the resolved files, then run `git rebase --continue`. Use `--abort` to return to the pre-rebase state.",
        },
      ],
    },
    {
      id: "github-actions-ci",
      title: "GitHub Actions: CI from zero",
      minutes: 11,
      md: md(String.raw`# One workflow file, one honest check

GitHub Actions runs workflows in ~~.github/workflows/*.yml~~. A workflow has
triggers, jobs, and steps.

## The smallest useful CI

@@yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

concurrency:
  group: ci-@D@{{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
@@

Read it top to bottom:

- **on** decides when the workflow runs.
- **permissions** limits the automatic ~~GITHUB_TOKEN~~.
- **concurrency** cancels superseded runs on the same ref.
- **jobs.test** runs on a fresh Ubuntu runner.
- **steps** are sequential shell commands or reusable actions.
- ~~actions/checkout~~ clones your repository onto the runner.
- ~~actions/setup-node~~ installs Node and caches the npm download cache.

## Add a build and a matrix

@@yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node-version: [20, 22, 24]
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v5
        with:
          node-version: @D@{{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - run: npm run build --if-present
      - run: npm test
@@

~~fail-fast: false~~ lets every version finish, so you see the full compatibility
picture instead of stopping at the first failure.

## Secrets

Never put a token in YAML. Add it in **Settings → Secrets and variables →
Actions**, then reference it:

@@yaml
- run: npm run deploy
  env:
    API_TOKEN: @D@{{ secrets.API_TOKEN }}
@@

Secrets are masked in logs, but not magically safe: do not echo them, and do not
run untrusted pull-request code with production secrets. For PRs from forks,
GitHub does not expose repository secrets by default.

## Cache properly

~~setup-node~~ with ~~cache: npm~~ caches the package download cache. It does
not cache ~~node_modules~~. Use ~~npm ci~~ for reproducible installs from the
lockfile.

## Required checks

After the workflow has run at least once:

1. Open **Settings → Rules / Branches**.
2. Protect ~~main~~.
3. Require the CI check before merging.
4. Require a pull request and at least one approval.

A check nobody requires is decoration. A required check that fails on main is
an outage waiting to happen.

## Debugging a failed run

@@bash
gh run list
gh run view --log-failed
gh run watch
@@

Reproduce locally with the same command the workflow runs. “Works on my
machine” usually means “the workflow is missing a setup step,” not “CI is
wrong.”

## Practice

Add CI to a scratch repo, open a PR that intentionally fails a test, watch the
check fail, fix it, and confirm the check turns green before merging.`),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Where must workflow files live?",
          template: "___/workflows/ci.yml",
          blanks: [{ options: [".github", "github", ".git"], answer: ".github" }],
          explanation:
            "GitHub only discovers workflows under `.github/workflows/` with a `.yml` or `.yaml` extension.",
        },
        {
          type: "quiz",
          prompt: "Which block decides when a workflow runs?",
          answers: ["on", "triggers", "events"],
          placeholder: "YAML key",
          hint: "It can be a list, a map, or a single event.",
          explanation:
            "The `on` key declares triggers such as `push`, `pull_request`, `workflow_dispatch`, or a schedule.",
        },
      ],
    },
    {
      id: "github-pages-releases",
      title: "GitHub Pages, tags & releases",
      minutes: 9,
      md: md(String.raw`# Publish something real

## GitHub Pages

For a user site, name the repository ~~YOUR_USERNAME.github.io~~. For a project
site, any repository works and the site is served under a subpath.

The modern setup is a workflow, not a branch:

@@yaml
name: Deploy Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: @D@{{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - id: deployment
        uses: actions/deploy-pages@v5
@@

Then set **Settings → Pages → Source** to **GitHub Actions**.

If you use a framework, build first and upload the build output instead of the
repository root. Add a ~~.nojekyll~~ file when your build emits directories that
start with an underscore.

## Tags and releases

A tag is a name for a commit. A release is a GitHub object built around a tag,
with notes and optional assets.

@@bash
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
gh release create v1.0.0 --generate-notes
@@

Semantic versioning is a communication contract:

| Change | Version |
|---|---|
| Backwards-incompatible | MAJOR (2.0.0) |
| New feature, compatible | MINOR (1.3.0) |
| Bug fix, compatible | PATCH (1.3.1) |

Tags are cheap. Releases are for humans. Do not tag every commit; tag the
commits you are willing to support.

## Release checklist

- [ ] CI is green on the release commit.
- [ ] The changelog or generated notes are readable.
- [ ] The migration/deploy step is documented.
- [ ] The tag is pushed.
- [ ] The release is not marked “latest” by accident.
- [ ] A rollback path exists.

## Practice

Publish a one-page site with Pages, tag ~~v1.0.0~~, create a release, then change
one line, tag ~~v1.0.1~~, and compare the generated notes.`),
      exercises: [
        {
          type: "quiz",
          prompt: "What repository name creates a GitHub user site?",
          answers: [
            "username.github.io",
            "yourusername.github.io",
            "<username>.github.io",
          ],
          placeholder: "name pattern",
          hint: "It uses your GitHub username plus .github.io.",
          explanation:
            "A repository named `<username>.github.io` publishes the user site at `https://<username>.github.io`.",
        },
        {
          type: "fill-blank",
          prompt: "Create a release with generated notes.",
          template: "gh release create v1.0.0 ___",
          blanks: [{ options: ["--generate-notes", "--notes", "--auto"], answer: "--generate-notes" }],
          explanation:
            "`--generate-notes` builds release notes from merged PRs and commits. Review them before publishing.",
        },
      ],
    },
  ],
};

export const GITHUB_PRO: SectionSeed = {
  id: "github-pro",
  title: "Professional Workflow",
  lessons: [
    {
      id: "github-cli-automation",
      title: "GitHub CLI & automation",
      minutes: 8,
      md: md(String.raw`# Stop clicking through the same five screens

The GitHub CLI (~~gh~~) wraps the API and the common web flows. It is scriptable,
which makes it useful for repeatable work.

## Authenticate and inspect

@@bash
gh auth login
gh auth status
gh repo view --web
gh browse
@@

## Issues and pull requests

@@bash
gh issue list --state open --limit 20
gh issue create --title "Empty search returns everything" --body-file issue.md
gh pr create --fill --base main
gh pr checks
gh pr view --web
gh pr merge --squash --delete-branch
@@

## Actions

@@bash
gh run list --limit 10
gh run view <run-id> --log-failed
gh run watch
gh workflow list
gh workflow run ci.yml
@@

## Secrets and variables

@@bash
gh secret set API_TOKEN
gh secret list
gh variable set API_URL --body "https://api.example.com"
@@

Prefer ~~gh secret set~~ over pasting a token into a terminal command that will
end up in your shell history.

## Script with JSON output

@@bash
gh pr list --state open --json number,title,author --jq '.[] | "\(.number) \(.title)"'
@@

@@bash
gh api repos/OWNER/REPO/issues --paginate --jq '.[].title'
@@

~~gh api~~ is the escape hatch for anything the CLI does not wrap. Use
~~--paginate~~ for list endpoints; the default page is not the whole dataset.

## A small automation example

Close stale “needs reproduction” issues after 14 days:

@@bash
gh issue list \
  --label "needs reproduction" \
  --state open \
  --json number,updatedAt \
  --jq '.[] | select((now - (.updatedAt | fromdateiso8601)) > 1209600) | .number' \
  | while read -r number; do
      gh issue close "$number" --comment "Closing after 14 days without a reproduction."
    done
@@

Read the command before running it. ~~gh issue close~~ is not a dry run.

## Practice

Use only the CLI to:

1. Create an issue.
2. Create a branch and PR that closes it.
3. Watch the checks.
4. Merge and delete the branch.
5. List the last five workflow runs as JSON.

If you can do that without opening the website, you understand the CLI.`),
      exercises: [
        {
          type: "fill-blank",
          prompt: "List the status of checks on the current pull request.",
          template: "gh pr ___",
          blanks: [{ options: ["checks", "status", "ci"], answer: "checks" }],
          explanation:
            "`gh pr checks` shows each check and its state. `gh pr status` is about review/merge state, not CI checks.",
        },
        {
          type: "quiz",
          prompt: "Which flag returns machine-readable data from `gh` commands?",
          answers: ["--json", "json", "--format json"],
          placeholder: "flag",
          hint: "It is followed by a comma-separated field list.",
          explanation:
            "`--json number,title,author` returns structured data that you can filter with `--jq`.",
        },
      ],
    },
    {
      id: "github-security",
      title: "Security, secrets & repository rules",
      minutes: 10,
      md: md(String.raw`# Security is a set of defaults

Most repository compromises are boring: a leaked token, an over-broad
~~GITHUB_TOKEN~~, a dependency with a known CVE, or a maintainer without 2FA.

## Account security

- Enable two-factor authentication.
- Use SSH keys with a passphrase, or a fine-grained personal access token.
- Never reuse a token across projects.
- Review **Settings → Sessions** and revoke old devices.
- Be careful with OAuth apps and GitHub Apps; grant the minimum scopes.

## Repository security

- Require pull requests on the default branch.
- Require CI checks and at least one review.
- Restrict who can force-push and delete the branch.
- Enable secret scanning and push protection.
- Enable Dependabot alerts and security updates.
- Add CodeQL or another code-scanning workflow for supported languages.
- Limit Actions to trusted sources if your organization requires it.

## Least-privilege Actions token

@@yaml
permissions:
  contents: read
@@

Grant more only on the job that needs it:

@@yaml
permissions:
  contents: read
  pages: write
  id-token: write
@@

The default token permissions can be broad. Set them explicitly at the workflow
or job level.

## Dependabot

@@yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
@@

Dependabot opens PRs. It does not replace reviewing them. A major-version bump
still needs a human.

## Code scanning

A minimal CodeQL workflow:

@@yaml
name: CodeQL

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: "0 6 * * 1"

permissions:
  security-events: write
  contents: read

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript
      - uses: github/codeql-action/analyze@v3
@@

## If a secret leaks

1. **Rotate the secret immediately.** Deleting the commit is not enough; assume
   it is compromised.
2. Revoke the old token/key.
3. Remove it from the current tree.
4. If it is in history, rewrite history with a tool such as ~~git filter-repo~~,
   then force-push with coordination.
5. Add the file to ~~.gitignore~~ and enable push protection so it cannot happen
   again.
6. Check provider logs for abuse.

## Practice

In a scratch repository:

- Add Dependabot for npm and Actions.
- Set workflow permissions to ~~contents: read~~.
- Add a branch rule requiring CI.
- Commit a fake token, confirm push protection blocks it, then remove the file.

The goal is not a perfect security score. The goal is that the next mistake is
caught by a default instead of by a customer.`),
      exercises: [
        {
          type: "quiz",
          prompt: "What is the first step after committing a real API key?",
          answers: ["rotate the key", "rotate it", "revoke the key", "rotate"],
          placeholder: "one action",
          hint: "Deleting the commit does not un-leak the value.",
          explanation:
            "Rotate/revoke the key first. Then remove it from the tree and, if necessary, rewrite history. Assume anyone could have copied it.",
        },
        {
          type: "fill-blank",
          prompt: "Give the workflow token read-only repository contents.",
          template: "permissions:\n  ___: read",
          blanks: [{ options: ["contents", "repo", "actions"], answer: "contents" }],
          explanation:
            "`contents: read` is the usual least-privilege default for a CI job that only checks out and tests code.",
        },
      ],
    },
    {
      id: "github-open-source",
      title: "Contribute to open source",
      minutes: 9,
      md: md(String.raw`# From fork to merged PR

Every project is different, but the mechanics are consistent.

## 1. Read the project

Before writing code, read:

- ~~README.md~~ — setup and scope
- ~~CONTRIBUTING.md~~ — branch, test, and commit conventions
- ~~CODE_OF_CONDUCT.md~~ — expected behavior
- issue and PR templates
- open issues labeled ~~good first issue~~ or ~~help wanted~~

If the project uses a DCO or CLA, know that before you invest a weekend.

## 2. Fork and clone

Fork on GitHub, then:

@@bash
git clone git@github.com:YOUR_USER/PROJECT.git
cd PROJECT
git remote add upstream git@github.com:ORIGINAL_OWNER/PROJECT.git
git remote -v
@@

~~origin~~ is your fork; ~~upstream~~ is the original.

## 3. Branch from upstream

@@bash
git fetch upstream
git switch -c fix/empty-search upstream/main
@@

Branching from ~~upstream/main~~ avoids starting on a stale fork.

## 4. Make a small, tested change

- Match the project's style.
- Add or update tests.
- Update docs if behavior changed.
- Keep the PR focused on one problem.
- Run the exact commands in CONTRIBUTING.

## 5. Commit and push

@@bash
git add -p
git commit -m "fix: return no results for an empty search"
git push -u origin HEAD
@@

Open the PR against the original repository's default branch, not your fork's
main unless the maintainers ask for that.

## 6. Write a PR a maintainer can merge

@@text
## What

An empty search returns every repository.

## Why

The query builder treats an empty string as "no filter".

## How

Return an empty result before building the query, and add a regression test.

## Testing

- npm test
- manual check on /search with an empty input

Closes #42
@@

Link the issue. Include screenshots for UI changes. Mention breaking changes and
migration steps.

## 7. Respond to review

Maintainers are often volunteers. Be patient, be specific, and keep the branch
up to date if asked. Do not force-push during an active review unless the
maintainers prefer it.

## 8. Sync your fork

@@bash
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push origin main
@@

Or use ~~gh repo sync YOUR_USER/PROJECT~~.

## Practice

Find a repository with a ~~good first issue~~, read its CONTRIBUTING guide, and
open a PR that changes no more than one behavior. The first merged PR is mostly
about communication, not clever code.`),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Add the original repository as a remote named upstream.",
          template: "git remote add ___ git@github.com:OWNER/PROJECT.git",
          blanks: [{ options: ["upstream", "origin", "source"], answer: "upstream" }],
          explanation:
            "Convention: `origin` is your fork, `upstream` is the original repository. Fetch from upstream to stay current.",
        },
        {
          type: "quiz",
          prompt: "Which file usually explains how to run tests and submit changes?",
          answers: ["CONTRIBUTING.md", "contributing.md", "README.md"],
          placeholder: "filename",
          hint: "It is specifically about contributing, not just using the project.",
          explanation:
            "`CONTRIBUTING.md` contains project-specific setup, test, commit, and review conventions. Read it before opening a PR.",
        },
      ],
    },
    {
      id: "github-capstone",
      title: "Capstone: ship a reviewed feature",
      minutes: 12,
      md: md(String.raw`# One feature, end to end

The capstone is deliberately small. The point is the workflow, not the feature.

## The feature

Add a “search repositories” input to a small app. An empty query returns no
results and shows an empty state.

## Step 1 — Create the issue

Include:

- what happens today
- what should happen
- a reproduction
- acceptance criteria

## Step 2 — Branch

@@bash
git switch main
git pull --ff-only
git switch -c feat/repo-search
@@

## Step 3 — Commit in slices

@@bash
git add src/search.ts
git commit -m "feat: add repository search filter"

git add src/search.test.ts
git commit -m "test: cover empty repository search"
@@

Each commit should build and pass tests on its own where practical.

## Step 4 — Push and open a draft PR

@@bash
git push -u origin HEAD
gh pr create --draft --fill --base main
@@

Fill in what/why/how/testing. Link the issue with ~~Closes #<number>~~.

## Step 5 — Add CI

@@yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
@@

Wait for the check. Fix failures before marking the PR ready.

## Step 6 — Review

Ask a peer to review. Give them a map:

@@text
Please focus on:
1. Empty-query behavior in src/search.ts
2. Whether the test would catch a regression
3. Any accessibility issue in the empty state
@@

Address comments with new commits unless the maintainers ask for a rebase.

## Step 7 — Merge

@@bash
gh pr ready
gh pr merge --squash --delete-branch
git switch main
git pull --ff-only
@@

Confirm:

- the issue closed
- the CI check is green on main
- the branch is gone
- the feature works from a clean checkout

## Step 8 — Release

@@bash
git tag -a v1.1.0 -m "Repository search"
git push origin v1.1.0
gh release create v1.1.0 --generate-notes
@@

## Step 9 — Publish (optional)

If the project has a static site, add the Pages workflow from the previous
lesson and deploy on ~~main~~.

## Final checklist

- [ ] Issue has acceptance criteria.
- [ ] Branch is focused.
- [ ] Commits are reviewable.
- [ ] Tests cover the new behavior.
- [ ] CI is green.
- [ ] PR explains what, why, how, and testing.
- [ ] Review comments are resolved.
- [ ] Merge deletes the branch.
- [ ] Release notes are human-readable.
- [ ] Rollback is possible.

## What to practice next

- Add a second contributor and review each other's PRs.
- Break a check on purpose and fix it.
- Add Dependabot and merge a patch update.
- Contribute one small fix to a real open-source project.

You do not need permission to practice. Make a scratch repository, open a PR
against your own main branch, and run the whole loop until it is boring.`),
      exercises: [
        {
          type: "quiz",
          prompt: "What should a PR description include besides the diff?",
          answers: [
            "what, why, how, and testing",
            "what and why",
            "testing steps",
            "a summary and test plan",
          ],
          placeholder: "describe the essentials",
          hint: "A reviewer should not have to reverse-engineer your intent.",
          explanation:
            "A useful PR explains what changed, why, how it was implemented, and how it was tested, plus any risks or screenshots.",
        },
        {
          type: "fill-blank",
          prompt: "Create a draft pull request using the commit message.",
          template: "gh pr create ___ --fill",
          blanks: [{ options: ["--draft", "--wip", "--no-merge"], answer: "--draft" }],
          explanation:
            "`--draft` opens a pull request that cannot be merged yet. Mark it ready with `gh pr ready` when checks and description are complete.",
        },
      ],
    },
  ],
};
