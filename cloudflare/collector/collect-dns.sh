#!/bin/bash
# =============================================================
# DNS Monitor - Coletor de Queries DNS (Unbound)
# Instalar no servidor DNS: /opt/dns-monitor/collect-dns.sh
# Cron: * * * * * /opt/dns-monitor/collect-dns.sh
# =============================================================

# CONFIGURAÇÃO - ALTERE ESTES VALORES
API_URL="https://dns-monitor-api.seudominio.workers.dev"
API_KEY="SUA_API_KEY_AQUI"

# Caminho do log do Unbound
UNBOUND_LOG="/var/log/unbound/unbound.log"
LAST_POS_FILE="/opt/dns-monitor/.last_pos_dns"
TEMP_FILE="/tmp/dns-queries-batch.json"
# Arquivo de bloqueios da ANATEL (para identificar domínios bloqueados)
ANABLOCK_FILE="/etc/unbound/anablock.conf"

mkdir -p /opt/dns-monitor

CURRENT_SIZE=$(wc -c < "$UNBOUND_LOG" 2>/dev/null || echo 0)

# Obter posição anterior
if [ -f "$LAST_POS_FILE" ]; then
    LAST_POS=$(cat "$LAST_POS_FILE")
else
    # Primeira execução: começar do fim do arquivo (não reprocessar histórico)
    LAST_POS=$CURRENT_SIZE
fi

# Se o arquivo foi rotacionado
if [ "$CURRENT_SIZE" -lt "$LAST_POS" ]; then
    # Arquivo novo: começar do começo
    LAST_POS=0
fi

# Se não há novas linhas, sair
if [ "$CURRENT_SIZE" -eq "$LAST_POS" ]; then
    exit 0
fi

# Parsear com Python
python3 /opt/dns-monitor/parse-unbound.py "$UNBOUND_LOG" "$LAST_POS" "$ANABLOCK_FILE" > "$TEMP_FILE"

# Verificar se há dados
if [ ! -s "$TEMP_FILE" ] || [ "$(cat $TEMP_FILE)" = '{"queries":[]}' ]; then
    echo "$CURRENT_SIZE" > "$LAST_POS_FILE"
    exit 0
fi

# Enviar para a API
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API_URL/ingest/dns" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d @"$TEMP_FILE" \
    --max-time 10)

if [ "$HTTP_CODE" = "200" ]; then
    echo "$CURRENT_SIZE" > "$LAST_POS_FILE"
    echo "$(date): Enviado com sucesso (HTTP $HTTP_CODE)" >> /opt/dns-monitor/collector.log
else
    echo "$(date): Erro ao enviar (HTTP $HTTP_CODE)" >> /opt/dns-monitor/collector.log
fi

rm -f "$TEMP_FILE"
