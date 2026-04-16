#!/bin/bash
# Stop hook — vérifie qu'on ne s'arrête pas avec du travail inachevé.
cd "$(dirname "$0")/../.." || exit 0

# 1. Build passe ?
if ! npx tsc --noEmit >/dev/null 2>&1; then
  echo "⛔ tsc errors — CONTINUE"
  exit 2
fi

# 2. TODO / placeholders restants ?
LEAKS=$(grep -rn 'TODO\|placeholder\|Lorem\|témoignage inventé' src/ 2>/dev/null | head -5)
if [ -n "$LEAKS" ]; then
  echo "⛔ Placeholders détectés — CONTINUE"
  echo "$LEAKS"
  exit 2
fi

echo "✅ Clean stop"
exit 0
