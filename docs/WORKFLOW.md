# 📋 Team Workflow & Development Process

This document defines the strict workflow **all agents** must follow for working on the project.

## 🎯 Golden Rules

1. **Every task must exist as a GitHub Issue first** — never start work without an issue
2. **Always pull from `dev` branch** — never work directly on `dev`, `qa`, `uat`, or `prod`
3. **Create a feature branch per task** — naming: `feature/#<issue-id>-short-description`
4. **Open a Pull Request when done** — target: `dev` branch
5. **PM (Omar) must review and approve** — only Omar can merge to `dev`
6. **No force pushes, no direct pushes** — all work goes through PRs

---

## 📍 Branch Strategy

### Primary Branches (Protected)

| Branch | Purpose | Deploy | PR Reviewers |
|--------|---------|--------|--------------|
| `master` | **Production** | Automated → prod server | 2x approval (Omar + 1 tech lead) |
| `prod` | **Staging for production** | Manual trigger → prod UAT | 1x approval (Omar) |
| `uat` | **User Acceptance Testing** | Auto → uat environment | 1x approval (Omar) |
| `qa` | **QA Environment** | Auto → qa environment | 1x approval (Omar) |
| `dev` | **Main development** | Auto → dev environment | 1x approval (Omar) |

### Feature Branches (Temporary)

Created **from `dev`**, named: `feature/#<issue-id>-description`

Examples:
```
feature/#15-auth-guard-fix
feature/#23-properties-list-ui
feature/#18-mobile-dashboard-refactor
```

---

## 🔄 Step-by-Step Workflow

### 1. Before You Start

```bash
# Get the latest dev
git checkout dev
git pull origin dev

# Check the issue exists on GitHub
gh issue view <ISSUE_ID>  # Must exist!
```

### 2. Create Your Feature Branch

```bash
# Branch name MUST include issue ID
git checkout -b feature/#<ISSUE_ID>-short-description

# Example:
# git checkout -b feature/#42-add-property-filters
```

### 3. Do the Work

- Write code
- Test locally
- Commit with clear messages

```bash
git add .
git commit -m "feat(#42): Add property filters to list page

- Add filter dropdown component
- Implement price range slider
- Update API integration
- Add tests"
```

### 4. Keep Branch Updated (if dev changes)

```bash
git fetch origin
git rebase origin/dev

# If conflicts: resolve, then
git add .
git rebase --continue

# NEVER merge dev into your branch
```

### 5. Push & Open PR

```bash
git push origin feature/#<ISSUE_ID>-description

# GitHub will suggest opening a PR — do it!
# Or manually:
gh pr create --base dev --title "feat(#42): Add property filters" --body "Closes #42"
```

### 6. Wait for PM Review

**Omar (PM) will:**
- Review your code
- Request changes if needed
- Approve and merge when ready

**Your job:** Respond to review comments, make fixes, push updates to the same branch.

### 7. After Merge

```bash
# Clean up
git checkout dev
git pull origin dev
git branch -d feature/#<ISSUE_ID>-description
```

---

## ✅ Checklist Before Opening PR

- [ ] Issue exists on GitHub
- [ ] Branch created from latest `dev`
- [ ] Branch name matches: `feature/#<ID>-description`
- [ ] Commits have clear, descriptive messages
- [ ] Code passes local tests
- [ ] No console errors/warnings
- [ ] Code is self-documented (comments where needed)
- [ ] Commit message references issue: "Closes #<ID>"

---

## 🚫 What NOT to Do

❌ **Direct push to `dev`, `qa`, `uat`, or `prod`**  
❌ **Work without creating an issue first**  
❌ **Merge your own PR** (only Omar can do this)  
❌ **Force push** (`git push --force`) to any shared branch  
❌ **Commit secrets, API keys, or hardcoded passwords**  
❌ **Branch directly from `prod`** (always from `dev`)  

---

## 🔗 Branch Hierarchy

```
master (Production)
   ↑
   ← merged by Omar only
   ←
prod (Pre-production)
   ↑
   ← merged by Omar only
   ←
uat (UAT Environment)
   ↑
   ← merged by Omar only
   ←
qa (QA Environment)
   ↑
   ← merged by Omar only
   ←
dev (Development — Main Branch)
   ↑
   ← merged by Omar only
   ←
feature/#123-task (Your Work)
```

---

## 🤖 For Agents (Automated Workflow)

When you (the agent) start a task:

```bash
# 1. Check the issue exists
ISSUE_ID=<assigned-to-you>
gh issue view $ISSUE_ID || echo "ERROR: Issue #$ISSUE_ID not found!"

# 2. Pull dev
git checkout dev && git pull origin dev

# 3. Create feature branch
git checkout -b feature/#${ISSUE_ID}-your-task-name

# 4. Do the work (git add, commit)

# 5. Push and create PR
git push origin feature/#${ISSUE_ID}-your-task-name
gh pr create --base dev \
  --title "feat(#${ISSUE_ID}): Your description" \
  --body "Closes #${ISSUE_ID}\n\n## Changes\n- ...\n- ..."

# 6. Wait for Omar's approval (don't merge yourself!)
gh pr status
```

---

## 📞 Questions?

- **"Can I work on something not in GitHub?"** → No. Create an issue first or ask Omar.
- **"Can I push to `dev` directly?"** → No. Always use PR.
- **"Can I merge my own PR?"** → No. Only Omar merges.
- **"What if I need to update my branch?"** → `git push --force-with-lease` (ask Omar first).
- **"How do I sync with other people's changes?"** → `git rebase origin/dev` regularly.

---

**Last Updated:** 2026-03-27  
**Owner:** Omar Hassan (PM)
