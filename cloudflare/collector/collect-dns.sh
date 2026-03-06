#!/bin/bash
# =============================================================
# DNS Monitor - Coletor de Queries DNS (BIND9)
# Instalar no servidor DNS: /opt/dns-monitor/collect-dns.sh
# Cron: * * * * * /opt/dns-monitor/collect-dns.sh
# =============================================================

# CONFIGURAÇÃO - ALTERE ESTES VALORES
API_URL="https://dns-monitor-api.seudominio.workers.dev"
API_KEY="SUA_API_KEY_AQUI"  # Gerada ao cadastrar a empresa no admin

# Caminhos dos logs do BIND
QUERY_LOG="/var/log/named/queries.log"
LAST_POS_FILE="/opt/dns-monitor/.last_pos_dns"
TEMP_FILE="/tmp/dns-queries-batch.json"

# Criar diretório se não existir
mkdir -p /opt/dns-monitor

# Obter posição anterior
if [ -f "$LAST_POS_FILE" ]; then
    LAST_POS=$(cat "$LAST_POS_FILE")
else
    LAST_POS=0
fi

# Obter tamanho atual do arquivo
CURRENT_SIZE=$(wc -c < "$QUERY_LOG" 2>/dev/null || echo 0)

# Se o arquivo foi rotacionado (menor que posição anterior)
if [ "$CURRENT_SIZE" -lt "$LAST_POS" ]; then
    LAST_POS=0
fi

# Se não há novas linhas, sair
if [ "$CURRENT_SIZE" -eq "$LAST_POS" ]; then
    exit 0
fi

# Ler novas linhas e parsear
# Formato BIND query log:
# 06-Mar-2026 10:30:45.123 queries: info: client @0x... 100.64.1.134#12345 (www.google.com): query: www.google.com IN A +E(0)K (170.245.94.203)

python3 /opt/dns-monitor/parse-queries.py "$QUERY_LOG" "$LAST_POS" > "$TEMP_FILE"

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
