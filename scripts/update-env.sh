#!/usr/bin/env bash
# Build the new settings file from your current one, on the server.
# Secrets never leave the server: nothing is printed except key NAMES.
#
#   cd /root/sologix/sologix_up_2026-06-13/sologix-main
#   bash scripts/update-env.sh              # preview: writes .env.docker.new + report
#   bash scripts/update-env.sh --apply      # backs up .env.docker and puts the new one in place
#
# Source values are taken from .env.docker, or (if that is missing) the newest
# .env.docker.bak* file. Pass another file as the first argument to use it:
#   bash scripts/update-env.sh /root/backup/.env.docker --apply
set -euo pipefail
cd "$(dirname "$0")/.."

APPLY=0; SRC=""
for a in "$@"; do
  case "$a" in
    --apply) APPLY=1 ;;
    *) SRC="$a" ;;
  esac
done
# --apply after a preview: install the (possibly hand-edited) preview as it is.
if [ "$APPLY" -eq 1 ] && [ -z "$SRC" ] && [ -f .env.docker.new ]; then
  [ -f .env.docker ] && cp -p .env.docker ".env.docker.bak.$(date +%F-%H%M%S)" && echo "Backed up the old file as .env.docker.bak.$(date +%F)…"
  mv .env.docker.new .env.docker && chmod 600 .env.docker
  echo "Installed your checked .env.docker.new as .env.docker. Apply it with:"
  echo "  docker compose up -d --force-recreate backend && docker compose logs --tail=30 backend"
  exit 0
fi
TEMPLATE=.env.docker.example
[ -f "$TEMPLATE" ] || { echo "Missing $TEMPLATE (run this from the site folder after copying the new code)"; exit 1; }
if [ -z "$SRC" ]; then
  if [ -f .env.docker ]; then SRC=.env.docker
  else SRC=$(ls -t .env.docker.bak* 2>/dev/null | head -1 || true); fi
fi
[ -n "$SRC" ] && [ -f "$SRC" ] || { echo "No existing settings file found (.env.docker or .env.docker.bak*)."; exit 1; }
echo "Reading your current values from: $SRC"

OUT=.env.docker.new
umask 077
awk -v SRC="$SRC" '
  function trim(s) { sub(/^[ \t]+/, "", s); sub(/[ \t\r]+$/, "", s); return s }
  BEGIN {
    while ((getline line < SRC) > 0) {
      sub(/\r$/, "", line)
      if (line ~ /^[ \t]*#/ || line !~ /=/) continue
      k = trim(substr(line, 1, index(line, "=") - 1)); v = substr(line, index(line, "=") + 1)
      sub(/\r$/, "", v)
      if (k ~ /^[A-Za-z_][A-Za-z0-9_]*$/) { old[k] = v; if (!(k in seenorder)) { order[++n] = k; seenorder[k] = 1 } }
    }
  }
  {
    sub(/\r$/, "")
    if ($0 ~ /^[A-Za-z_][A-Za-z0-9_]*=/) {
      k = substr($0, 1, index($0, "=") - 1)
      intemplate[k] = 1
      if (k in old) { print k "=" old[k]; next }
    }
    print
  }
  END {
    extra = 0
    for (i = 1; i <= n; i++) if (!(order[i] in intemplate)) {
      if (!extra) { print ""; print "# ---------------------------------------------------------------------"; print "#  Kept from your previous file (not used by the new template)"; print "# ---------------------------------------------------------------------"; extra = 1 }
      print order[i] "=" old[order[i]]
    }
  }
' "$TEMPLATE" > "$OUT"

get() { grep -E "^$1=" "$OUT" | tail -1 | cut -d= -f2- | tr -d '\r'; }
setv() { local k="$1" v="$2"; local esc; esc=$(printf '%s' "$v" | sed 's/[&|]/\\&/g'); sed -i "s|^$k=.*|$k=$esc|" "$OUT"; }
placeholder() { [[ -z "$1" || "$1" =~ ^(your[_-]|change[_-]?me|CHANGE_|xxx|rzp_(live|test)_X) || "$1" == sologix_* ]]; }

echo
# JWT secret: generate one if missing / placeholder / too short
J=$(get JWT_SECRET)
if placeholder "$J" || [ ${#J} -lt 32 ]; then
  setv JWT_SECRET "$(openssl rand -hex 48)"
  echo "  GENERATED  JWT_SECRET (new random value; everyone will log in again once)"
fi

report() { # key, description
  local v; v=$(get "$1")
  if placeholder "$v"; then printf "  MISSING    %-24s %s\n" "$1" "$2"; else printf "  ok         %s\n" "$1"; fi
}
echo "Required:"
P=$(get ADMIN_PASSWORD)
if [ ${#P} -lt 12 ] || [[ "$P" =~ ^([Aa]dmin|[Cc]hange|[Yy]our|[Pp]assword) ]]; then
  printf "  MISSING    %-24s %s\n" ADMIN_PASSWORD "admin login password, 12+ characters (a weak one is ignored)"
else echo "  ok         ADMIN_PASSWORD"; fi
report ADMIN_EMAIL "admin login email"
echo "Email (booking confirmations, alerts, password resets):"
report SMTP_USER "mailbox address, e.g. info@sologixenergy.in"
report SMTP_PASS "mailbox password / Gmail App Password"
echo "Optional (features stay off until filled):"
report WHATSAPP_TOKEN "Meta WhatsApp Cloud API token (admin WhatsApp inbox)"
report WHATSAPP_PHONE_ID "Meta WhatsApp phone number ID"
report WHATSAPP_APP_SECRET "Meta app secret (incoming WhatsApp messages)"
report RAZORPAY_KEY_ID "online payments (currently off)"
report RAZORPAY_KEY_SECRET "online payments (currently off)"
report CLOUDINARY_API_KEY "cloud image storage (optional)"
report HUBSPOT_TOKEN "HubSpot CRM sync (optional)"
report YOUTUBE_API_KEY "list ALL YouTube uploads instead of the latest 15 (optional)"

echo
if [ "$APPLY" -eq 1 ]; then
  if [ -f .env.docker ]; then cp -p .env.docker ".env.docker.bak.$(date +%F-%H%M%S)"; echo "Backed up the old file as .env.docker.bak.$(date +%F)…"; fi
  mv "$OUT" .env.docker
  chmod 600 .env.docker
  echo "New .env.docker is in place. Apply it with:"
  echo "  docker compose up -d --force-recreate backend && docker compose logs --tail=30 backend"
else
  echo "Preview written to $OUT (your current .env.docker is unchanged)."
  echo "Check it (nano $OUT), fill in anything MISSING, then run:  bash scripts/update-env.sh --apply"
fi
