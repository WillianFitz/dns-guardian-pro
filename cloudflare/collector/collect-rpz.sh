#!/bin/bash
# =============================================================
# DNS Monitor - Coletor da Lista de Bloqueio (Unbound anablock.conf)
# Cron: 0 */6 * * * /opt/dns-monitor/collect-rpz.sh
# =============================================================

# CONFIGURAÇÃO
API_URL="https://dns-monitor-api.seudominio.workers.dev"
API_KEY="SUA_API_KEY_AQUI"
ANABLOCK_FILE="/etc/unbound/anablock.conf"

if [ ! -f "$ANABLOCK_FILE" ]; then
    echo "$(date): anablock.conf not found: $ANABLOCK_FILE" >> /opt/dns-monitor/collector.log
    exit 1
fi

# Tamanho do arquivo
LIST_SIZE=$(wc -c < "$ANABLOCK_FILE")

# Contar domínios únicos
DOMAIN_COUNT=$(grep -c 'local-zone:' "$ANABLOCK_FILE" 2>/dev/null || echo 0)

# Gerar serial baseado na data de modificação
ZONE_SERIAL=$(stat -c %Y "$ANABLOCK_FILE" 2>/dev/null || date +%s)

# Extrair domínios com categorias
DOMAINS=$(python3 -c "
import json, re

domains = []
categories = {
    'Apostas': ['bet', 'game', 'casino', 'poker', 'slot', 'jackpot', 'spin', 'luck', 'win', 'play', 'gambl', 'bingo', 'roleta', 'aposta', 'vip'],
    'Streaming/Pirataria': ['torrent', 'pirat', 'stream', 'flix', 'movie', 'serie', 'animes', 'mega', 'download'],
    'Malware/Tracking': ['malware', 'track', 'adware', 'phish', 'spam', 'virus', 'trojan'],
}

def categorize(domain):
    d = domain.lower()
    for cat, keywords in categories.items():
        for kw in keywords:
            if kw in d:
                return cat
    return 'Outros'

with open('$ANABLOCK_FILE', 'r') as f:
    for line in f:
        m = re.match(r'local-zone:\s*\"([^\"]+)\"', line.strip())
        if m:
            domain = m.group(1)
            domains.append({'domain': domain, 'category': categorize(domain)})

# Limitar a 1000 domínios enviados (para não estourar tamanho de request),
# mas enviar o total real em total_domains para o painel mostrar a contagem correta.
print(json.dumps(domains[:1000]))
" 2>/dev/null || echo "[]")

JSON=$(cat <<EOF
{
  "zone_status": "active",
  "zone_serial": "$ZONE_SERIAL",
  "list_size_bytes": $LIST_SIZE,
  "total_domains": $DOMAIN_COUNT,
  "domains": $DOMAINS
}
EOF
)

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API_URL/ingest/rpz-list" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$JSON" \
    --max-time 30)

echo "$(date): RPZ list sent - $DOMAIN_COUNT domains (HTTP $HTTP_CODE)" >> /opt/dns-monitor/collector.log
