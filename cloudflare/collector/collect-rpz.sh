#!/bin/bash
# =============================================================
# DNS Monitor - Coletor de Lista RPZ (ANATEL)
# Cron: 0 */6 * * * /opt/dns-monitor/collect-rpz.sh
# Roda a cada 6 horas para verificar atualizações na zona RPZ
# =============================================================

# CONFIGURAÇÃO
API_URL="https://dns-monitor-api.seudominio.workers.dev"
API_KEY="SUA_API_KEY_AQUI"
RPZ_ZONE_FILE="/etc/bind/zones/db.rpz.zone"

# Verificar se o arquivo da zona RPZ existe
if [ ! -f "$RPZ_ZONE_FILE" ]; then
    echo "$(date): RPZ zone file not found: $RPZ_ZONE_FILE" >> /opt/dns-monitor/collector.log
    exit 1
fi

# Obter serial da zona
ZONE_SERIAL=$(grep -oP '\d{10}' "$RPZ_ZONE_FILE" | head -1 || echo "0")

# Obter tamanho do arquivo
LIST_SIZE=$(wc -c < "$RPZ_ZONE_FILE")

# Contar domínios (linhas com CNAME .)
DOMAIN_COUNT=$(grep -c "CNAME \." "$RPZ_ZONE_FILE" 2>/dev/null || echo 0)

# Extrair domínios e categorias
# Formato esperado: dominio.com CNAME .  ; categoria: Apostas
DOMAINS=$(python3 -c "
import json, re, sys

domains = []
with open('$RPZ_ZONE_FILE', 'r') as f:
    for line in f:
        line = line.strip()
        if 'CNAME' not in line or line.startswith(';') or line.startswith('\$'):
            continue
        parts = line.split()
        if len(parts) >= 3:
            domain = parts[0].rstrip('.')
            category = 'Outros'
            comment = line.split(';')
            if len(comment) > 1:
                cat_match = re.search(r'categoria:\s*(\S+)', comment[1], re.IGNORECASE)
                if cat_match:
                    category = cat_match.group(1)
            domains.append({'domain': domain, 'category': category})

# Limitar a 1000 por request
print(json.dumps(domains[:1000]))
" 2>/dev/null || echo "[]")

# Montar JSON
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

# Enviar
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API_URL/ingest/rpz-list" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$JSON" \
    --max-time 30)

echo "$(date): RPZ list sent - $DOMAIN_COUNT domains, serial $ZONE_SERIAL (HTTP $HTTP_CODE)" >> /opt/dns-monitor/collector.log
