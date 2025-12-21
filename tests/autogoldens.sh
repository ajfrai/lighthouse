#!/bin/bash
# Auto-Golden Trees
# After verifying dialogue works correctly, run this to lock it in as golden reference

cd "$(dirname "$0")"

echo "╔═══════════════════════════════════════════════════════╗"
echo "║           AUTO-GOLDEN TREE LOCK-IN SCRIPT             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "This script updates golden reference trees after you've"
echo "verified that dialogue is working correctly."
echo ""

# Check if there are uncommitted changes in src/
if git diff --quiet HEAD -- ../src/data.js ../src/game.js ../src/dialogueSystem.js ../src/questSystem.js 2>/dev/null; then
    echo "⚠️  No dialogue code changes detected in src/"
    echo ""
    read -p "Update golden trees anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
else
    echo "✓ Dialogue code changes detected"
    echo ""
    git diff --stat HEAD -- ../src/data.js ../src/game.js ../src/dialogueSystem.js ../src/questSystem.js
    echo ""
fi

# Run current tests to see what's different
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CURRENT TEST STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ./run-golden-tests.sh > /tmp/golden-test-output.txt 2>&1; then
    echo "✅ All golden trees already match current code"
    echo ""
    cat /tmp/golden-test-output.txt | grep "Total Tests:"
    cat /tmp/golden-test-output.txt | grep "Passed:"
    echo ""
    read -p "Update golden trees anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled - nothing to do."
        exit 0
    fi
else
    echo "❌ Golden trees don't match current code"
    echo ""

    # Show which files failed
    cat /tmp/golden-test-output.txt | grep "  ❌"
    echo ""

    # Show failure summary
    cat /tmp/golden-test-output.txt | grep -A 3 "TEST RESULTS"
    echo ""

    read -p "Have you VERIFIED the new dialogue works correctly? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "❌ Cancelled - DO NOT update golden trees for broken dialogue!"
        echo "   Fix the bugs first, then run this script."
        exit 1
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "REGENERATING GOLDEN TREES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

./generate-golden-trees.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CHANGES TO GOLDEN TREES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if git diff --quiet HEAD -- golden-trees/; then
    echo "No changes to golden trees."
else
    echo "Modified golden trees:"
    git diff --stat HEAD -- golden-trees/
    echo ""
    echo "Detailed changes:"
    git diff HEAD -- golden-trees/ | head -100

    if [ $(git diff HEAD -- golden-trees/ | wc -l) -gt 100 ]; then
        echo ""
        echo "(... output truncated, see full diff with: git diff golden-trees/)"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

./run-golden-tests.sh > /tmp/golden-verify.txt 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Golden trees validated - tests now pass!"
    echo ""
    cat /tmp/golden-verify.txt | tail -10
else
    echo "❌ ERROR: Tests still failing after regeneration!"
    echo ""
    cat /tmp/golden-verify.txt | tail -20
    echo ""
    echo "This shouldn't happen. Check for errors in:"
    echo "  - generate-golden-trees.sh"
    echo "  - run-golden-tests.sh"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "NEXT STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Golden trees have been updated and validated!"
echo ""
echo "To commit these changes:"
echo ""
echo "  git add golden-trees/ src/"
echo "  git commit -m \"Update golden trees: <describe dialogue changes>\""
echo "  git push"
echo ""
echo "Example commit messages:"
echo "  - Update golden trees: improve Callum completion dialogue"
echo "  - Update golden trees: add creature encounter narrative"
echo "  - Update golden trees: increase quest difficulty"
echo ""
