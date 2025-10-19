# CycleBees Services - Deletion Candidates

**Last Updated**: 2025-10-19
**Status**: Initial Analysis Complete
**Total Candidates**: 3 files/directories

---

## 🗑️ Deletion Candidates Table

| Path | Type | Reason | Replacement | Risks | Verification Needed | Owner | Status |
|------|------|--------|-------------|-------|---------------------|-------|--------|
| `app/o/[slug]/page.tsx.bak_dup_prop` | File | Backup file with duplicate props error. Contains reference to non-existent `AppBottomNav` component (should be imported from a mobile component). AI-generated artifact left over from development. | Current `app/o/[slug]/page.tsx` is the correct version | Low - Backup file not imported anywhere. Safe to remove after verification. | ✅ Verify current `page.tsx` works correctly in production | Dev Team | **Proposed** |
| `.claude/settings.local.json` | File | Claude Code editor-specific settings. Already deleted per git status (`D .claude/settings.local.json`). | N/A - Editor-specific, not project code | None - Already deleted | ✅ Already removed from git | Dev Team | **Removed** |
| `.next/` | Directory | Next.js build output. Should be in `.gitignore` and not tracked. Contains compiled JavaScript, not source code. | Regenerated on every build with `npm run build` or `npm run dev` | **Low** - Should be regenerated. Verify `.gitignore` contains `.next/` (it does per current .gitignore) | ✅ Verify build works after clearing: `rm -rf .next && npm run dev` | DevOps | **Keep** (in .gitignore) |

---

## 📋 Deletion Workflow

### **Phase 1: Marking** ✅ COMPLETE
Files have been identified and documented in this file.

### **Phase 2: Review** 🔄 PENDING
- [ ] Team review of all candidates
- [ ] Approval from code owners
- [ ] Verification tests pass

### **Phase 3: Archive** 📦 PENDING (Recommended before deletion)
Before deletion, candidates will be moved to `_archive/` directory:
```bash
# Example:
git mv app/o/[slug]/page.tsx.bak_dup_prop _archive/page.tsx.bak_dup_prop
git commit -m "chore: archive deprecated backup file"
```

### **Phase 4: Deletion** 🗑️ BLOCKED
**⚠️ DELETIONS BLOCKED UNTIL:**
- [ ] Tests pass (Phase 5 of PROJECT_TRACKER.md)
- [ ] Owner approval obtained
- [ ] Dry-run executed successfully

Execute with:
```bash
bash scripts/remove-deletion-candidates.sh --dry-run   # Preview
bash scripts/remove-deletion-candidates.sh --execute   # Actually delete
```

---

## 🔍 Detailed Candidate Analysis

### **1. `app/o/[slug]/page.tsx.bak_dup_prop`**

**Marker Comment** (to be added if we keep it temporarily):
```typescript
// @deletion-candidate: reason=Backup file with duplicate props error; replacement=app/o/[slug]/page.tsx
```

**Analysis**:
- **File Size**: 1077 lines (large)
- **Last Modified**: Unknown (need `git log` to check)
- **Content**: React component for customer order page
- **Issue**: Contains this error-prone code:
  ```typescript
  <StickyActionBar
    primaryLabel={isConfirming ? 'Confirming…' : `Confirm • ${formatCurrency(totals.total)}`}
    // ...
    primaryLabel={isConfirming ? 'Confirming...' : `Confirm ${formatCurrency(totals.total)}`}  // ❌ Duplicate prop!
  />
  ```
- **References**: Uses `AppBottomNav` component which doesn't exist in the current codebase (checked `/components/mobile/` - no such file)
- **Git History**: Check with `git log --all --full-history -- "app/o/[slug]/page.tsx.bak_dup_prop"`

**Recommendation**: **DELETE AFTER VERIFICATION**
1. Verify current `app/o/[slug]/page.tsx` works correctly
2. Check git history to confirm this is truly a backup
3. Move to `_archive/` first, then delete after 1-2 weeks

---

### **2. `.claude/settings.local.json`**

**Status**: ✅ **ALREADY DELETED**

**Evidence**:
```bash
$ git status
D .claude/settings.local.json
```

**Git Action**: Commit this deletion:
```bash
git add .claude/settings.local.json
git commit -m "chore: remove Claude Code editor settings"
```

**Note**: The `.claude/` directory may still exist with this file. Clean up:
```bash
rm -rf .claude/
```

---

### **3. `.next/` (Build Output Directory)**

**Status**: ⚠️ **SHOULD BE IN .GITIGNORE** (already is)

**Current .gitignore**:
```gitignore
/.next/
```

**Verification**:
```bash
$ git ls-files | grep ".next/"
# Should return nothing (directory is properly ignored)
```

**If tracked by git** (check first):
```bash
git ls-files .next/
```

**If tracked, remove from git** (but keep locally):
```bash
git rm -r --cached .next/
git commit -m "chore: untrack Next.js build directory"
```

**Recommendation**: **KEEP IN .GITIGNORE** (do not delete from filesystem, as it's needed for dev server caching)

---

## 🔍 Additional Files to Review (Not Yet Marked)

These files were identified but need further investigation before marking:

### **Potentially Redundant**

1. **`types/html2pdf.d.ts`**
   - **Purpose**: Type definitions for html2pdf.js library
   - **Check**: Does `@types/html2pdf` exist on npm? If yes, this is redundant.
   - **Action**: Run `npm search @types/html2pdf` - **No official types found**, so this is **necessary**. Keep.

2. **`lib/auth.ts` vs `lib/auth-edge.ts`**
   - **Not a deletion candidate**, but note potential code duplication
   - **Both needed**: One for Node.js runtime (API routes), one for Edge runtime (middleware)
   - **Action**: Consider refactoring shared logic into `lib/auth-shared.ts`

### **Documentation Overlap**

1. **`BUILD_PLAN.md`** (moved to `docs/BUILD_PLAN.md`)
   - Keep as historical record of original requirements
   - Useful for understanding project evolution

2. **`database/COPY_DATA_TO_TEST.md`** (moved to `docs/database/COPY_DATA_TO_TEST.md`)
   - Keep as database setup documentation

---

## 🛡️ Safety Guardrails

### **Before Deleting ANY File**:

1. **Search for imports**:
   ```bash
   grep -r "page.tsx.bak_dup_prop" --include="*.ts" --include="*.tsx" .
   # Should return 0 results
   ```

2. **Check git history**:
   ```bash
   git log --all --full-history -- "path/to/file"
   # Understand why it exists
   ```

3. **Verify tests pass** (when tests exist):
   ```bash
   npm test
   ```

4. **Verify build succeeds**:
   ```bash
   npm run build
   ```

5. **Create archive first**:
   ```bash
   mkdir -p _archive/$(dirname file)
   git mv file _archive/file
   ```

6. **Wait period**: Keep in `_archive/` for 2 weeks minimum before permanent deletion

---

## 📊 Deletion Progress

**Total Candidates**: 3
- **Removed**: 1 (`.claude/settings.local.json`)
- **Proposed**: 1 (`page.tsx.bak_dup_prop`)
- **Keep**: 1 (`.next/` in .gitignore)

**Status**: 33% reviewed, 0% deleted (excluding already-removed files)

---

## 🚨 Emergency Rollback

If a deletion breaks something:

1. **Check `_archive/` directory**:
   ```bash
   ls -la _archive/
   ```

2. **Restore from archive**:
   ```bash
   git mv _archive/path/to/file path/to/file
   git commit -m "revert: restore accidentally deleted file"
   ```

3. **If not in archive, check git history**:
   ```bash
   git log --all --full-history -- "path/to/file"
   git checkout <commit-hash> -- path/to/file
   ```

---

**Approval Required From**:
- [ ] Project Lead
- [ ] Senior Developer
- [ ] QA Team

**Next Review Date**: After Phase 2 (Restructure) completion

---

## 📝 Notes

- **Conservative Approach**: When in doubt, archive first, delete later
- **Git History Preserved**: All deletions should use `git rm` to preserve history
- **Documentation Required**: Every deletion must have a reason documented
- **Rollback Plan**: Always have a way to restore deleted files
