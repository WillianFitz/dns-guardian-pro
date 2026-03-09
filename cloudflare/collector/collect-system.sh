#!/bin/bash
# =============================================================
# DNS Monitor - Coletor de Métricas do Sistema
# Instalar no servidor DNS: /opt/dns-monitor/collect-system.sh
# Cron: * * * * * /opt/dns-monitor/collect-system.sh
# =============================================================

# CONFIGURAÇÃO
# (esses valores são sobrescritos pelo install.sh no servidor DNS)
API_URL="https://dns-monitor-api.seudominio.workers.dev"
API_KEY="SUA_API_KEY_AQUI"

# Coletar CPU
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 2>/dev/null || echo 0)

# Coletar Memória
MEMORY=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100)}' 2>/dev/null || echo 0)

# Coletar Disco
DISK=$(df / | tail -1 | awk '{print $5}' | tr -d '%' 2>/dev/null || echo 0)

# Coletar Uptime
UPTIME_SEC=$(cat /proc/uptime | awk '{print int($1)}')
DAYS=$((UPTIME_SEC / 86400))
HOURS=$(((UPTIME_SEC % 86400) / 3600))
MINUTES=$(((UPTIME_SEC % 3600) / 60))
UPTIME="${DAYS}d ${HOURS}h ${MINUTES}m"

# Coletar tráfego de rede (interface principal) – opcional, se algo falhar envia 0
DOWNLOAD=0
UPLOAD=0
IFACE=$(ip route | grep default | awk '{print $5}' | head -1 2>/dev/null)
if [ -n "$IFACE" ] && [ -r "/sys/class/net/$IFACE/statistics/rx_bytes" ]; then
    RX1=$(cat /sys/class/net/$IFACE/statistics/rx_bytes 2>/dev/null || echo 0)
    TX1=$(cat /sys/class/net/$IFACE/statistics/tx_bytes 2>/dev/null || echo 0)
    sleep 1
    RX2=$(cat /sys/class/net/$IFACE/statistics/rx_bytes 2>/dev/null || echo 0)
    TX2=$(cat /sys/class/net/$IFACE/statistics/tx_bytes 2>/dev/null || echo 0)
    DOWNLOAD=$(echo "scale=4; ($RX2 - $RX1) * 8 / 1000000" | bc 2>/dev/null || echo 0)
    UPLOAD=$(echo "scale=4; ($TX2 - $TX1) * 8 / 1000000" | bc 2>/dev/null || echo 0)
fi

# Garantir formato numérico aceitável pelo printf (0.1234 ao invés de .1234)
fix_float() {
  local v="$1"
  # trocar vírgula por ponto (locale pt-BR)
  v=$(echo "$v" | tr ',' '.')
  if [ -z "$v" ]; then
    echo "0"
  elif echo "$v" | grep -qE '^\.'; then
    echo "0$v"
  else
    echo "$v"
  fi
}

CPU=$(fix_float "$CPU")
MEMORY=$(fix_float "$MEMORY")
DISK=$(fix_float "$DISK")
DOWNLOAD=$(fix_float "$DOWNLOAD")
UPLOAD=$(fix_float "$UPLOAD")

# Coletar processos (top 10 por memória) para exibir no painel
PROCESSES_RAW=$(ps aux --sort=-%mem 2>/dev/null | head -11 | tail -10 | awk '{printf "{\"pid\":%s,\"name\":\"%s\",\"cpu_percent\":%s,\"memory_percent\":%s},", $2, $11, $3, $4}')
if [ -n "$PROCESSES_RAW" ]; then
  PROCESSES="[${PROCESSES_RAW%,}]"
else
  PROCESSES="[]"
fi

# Montar JSON simples e sempre válido
JSON=$(cat <<EOF
{
  "cpu": $CPU,
  "memory": $MEMORY,
  "disk": $DISK,
  "uptime": "$UPTIME",
  "download_mbps": $DOWNLOAD,
  "upload_mbps": $UPLOAD,
  "processes": $PROCESSES
}
EOF
)

# Enviar
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API_URL/ingest/system" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$JSON" \
    --max-time 10)

echo "$(date): System metrics sent (HTTP $HTTP_CODE)" >> /opt/dns-monitor/collector.log
