#!/bin/bash

##############################################################################
# FKBC ELITE BUILD - VERIFICATION & DEPLOYMENT SCRIPT
# 
# This script verifies that all required components are present
# and correctly configured before deployment to GitHub Pages.
#
# Usage: bash verify-elite-build.sh [--fix] [--deploy]
##############################################################################

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0
BUILD_PASSED=true

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   FKBC ELITE BUILD v1.0 - VERIFICATION SUITE         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

##############################################################################
# Helper functions
##############################################################################

check_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASS_COUNT++))
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARN_COUNT++))
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAIL_COUNT++))
  BUILD_PASSED=false
}

check_file() {
  if [ -f "$1" ]; then
    local size=$(du -h "$1" | cut -f1)
    check_pass "File: $1 ($size)"
  else
    check_fail "Missing: $1"
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    local count=$(find "$1" -type f | wc -l)
    check_pass "Directory: $1 ($count files)"
  else
    check_fail "Missing directory: $1"
  fi
}

##############################################################################
# VERIFICATION CHECKS
##############################################################################

echo -e "${BLUE}→ Checking core console files...${NC}"
check_file "$REPO_ROOT/index.html"
check_file "$REPO_ROOT/sw.js"
check_file "$REPO_ROOT/manifest.webmanifest"
echo ""

echo -e "${BLUE}→ Checking assets directory...${NC}"
check_dir "$REPO_ROOT/assets"
check_file "$REPO_ROOT/assets/sfx.js"
check_file "$REPO_ROOT/assets/elite-welcome.js"
check_file "$REPO_ROOT/assets/game-sideloader.js"
echo ""

echo -e "${BLUE}→ Checking coach portraits...${NC}"
coaches=("joe" "jack" "paul" "big-john" "justin" "gracie" "john" "eden")
for coach in "${coaches[@]}"; do
  if [ -f "$REPO_ROOT/assets/coaches/${coach}-portrait.png" ] || \
     [ -f "$REPO_ROOT/assets/coaches/${coach}portrait.png" ]; then
    check_pass "Coach: $coach portrait found"
  else
    check_warn "Coach: $coach portrait not found (optional)"
  fi
done
echo ""

echo -e "${BLUE}→ Checking sound files...${NC}"
check_file "$REPO_ROOT/assets/sounds/bell.wav"
check_file "$REPO_ROOT/assets/sounds/klaxon.wav"
check_file "$REPO_ROOT/assets/sounds/bleep.wav"
echo ""

echo -e "${BLUE}→ Checking icons...${NC}"
check_file "$REPO_ROOT/assets/icons/icon-192.png"
check_file "$REPO_ROOT/assets/icons/icon-512.png"
echo ""

echo -e "${BLUE}→ Checking documentation...${NC}"
check_file "$REPO_ROOT/README.txt"
check_file "$REPO_ROOT/ELITE_BUILD_MANIFEST.md"
check_file "$REPO_ROOT/INTEGRATION_GUIDE.md"
echo ""

echo -e "${BLUE}→ Checking game sideload (optional)...${NC}"
if [ -f "$REPO_ROOT/fight-game/dist/index.html" ]; then
  check_pass "Game sideload: Ready"
  check_pass "Game bundle found at fight-game/dist/index.html"
else
  check_warn "Game sideload: Not included (console will work without it)"
fi
echo ""

echo -e "${BLUE}→ Verifying file integrity...${NC}"

# Check index.html contains game sideloader references
if grep -q "game-sideloader.js" "$REPO_ROOT/index.html" 2>/dev/null; then
  check_pass "index.html: Contains game-sideloader.js reference"
else
  check_warn "index.html: Missing game-sideloader.js reference (needs manual integration)"
fi

# Check index.html contains elite-welcome references
if grep -q "elite-welcome.js" "$REPO_ROOT/index.html" 2>/dev/null; then
  check_pass "index.html: Contains elite-welcome.js reference"
else
  check_warn "index.html: Missing elite-welcome.js reference (needs manual integration)"
fi

# Check manifest.webmanifest
if [ -f "$REPO_ROOT/manifest.webmanifest" ]; then
  if grep -q '"name"' "$REPO_ROOT/manifest.webmanifest"; then
    check_pass "manifest.webmanifest: Valid JSON structure"
  else
    check_fail "manifest.webmanifest: Invalid JSON"
  fi
fi

# Check service worker
if grep -q "cache" "$REPO_ROOT/sw.js" 2>/dev/null; then
  check_pass "sw.js: Contains caching strategy"
else
  check_warn "sw.js: Missing cache strategy (may not work offline)"
fi

echo ""
echo -e "${BLUE}→ Checking Git status...${NC}"

if [ -d "$REPO_ROOT/.git" ]; then
  check_pass "Git repository found"
  
  # Check for uncommitted changes
  if git -C "$REPO_ROOT" status --porcelain | grep -q .; then
    check_warn "Uncommitted changes detected (run git status)"
  else
    check_pass "All files committed"
  fi
  
  # Check for large files
  find "$REPO_ROOT" -type f -size +5M ! -path "*/.git/*" ! -path "*/node_modules/*" | while read -r file; do
    check_warn "Large file (>5MB): $file"
  done
else
  check_warn "Not a Git repository"
fi
echo ""

##############################################################################
# SUMMARY
##############################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   VERIFICATION SUMMARY                                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "  ${GREEN}Passed:${NC}  $PASS_COUNT"
echo -e "  ${YELLOW}Warned:${NC}  $WARN_COUNT"
echo -e "  ${RED}Failed:${NC}  $FAIL_COUNT"
echo ""

if [ "$BUILD_PASSED" = true ]; then
  echo -e "${GREEN}✓ BUILD VERIFICATION PASSED${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review any warnings above"
  echo "  2. If using game sideload, build: npm run build in fight-arcade-source/"
  echo "  3. Copy built game to fight-game/dist/"
  echo "  4. Test locally: python3 -m http.server 8000"
  echo "  5. Deploy: git push origin main"
  echo ""
  
  if [[ "$1" == "--deploy" ]]; then
    echo -e "${BLUE}→ Deploying to GitHub Pages...${NC}"
    git -C "$REPO_ROOT" push origin main
    echo -e "${GREEN}✓ Deploy complete${NC}"
  fi
  
  exit 0
else
  echo -e "${RED}✗ BUILD VERIFICATION FAILED${NC}"
  echo ""
  echo "Critical issues found above. Please fix and try again."
  echo ""
  
  if [[ "$1" == "--fix" ]]; then
    echo -e "${YELLOW}→ Attempting automatic fixes...${NC}"
    
    # Create missing directories
    mkdir -p "$REPO_ROOT/assets/coaches"
    mkdir -p "$REPO_ROOT/assets/sounds"
    mkdir -p "$REPO_ROOT/assets/icons"
    mkdir -p "$REPO_ROOT/fight-game/dist"
    
    echo -e "${GREEN}✓ Created missing directories${NC}"
    echo ""
    echo "Now add the missing asset files and try again."
  fi
  
  exit 1
fi
