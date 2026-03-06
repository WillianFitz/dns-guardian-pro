#!/bin/bash
# =============================================================
# DNS Monitor - Coletor de Métricas do Sistema
# Instalar no servidor DNS: /opt/dns-monitor/collect-system.sh
# Cron: * * * * * /opt/dns-monitor/collect-system.sh
# =============================================================

# CONFIGURAÇÃO
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

# Coletar tráfego de rede (interface principal)
IFACE=$(ip route | grep default | awk '{print $5}' | head -1)
if [ -n "$IFACE" ]; then
    RX1=$(cat /sys/class/net/$IFACE/statistics/rx_bytes)
    TX1=$(cat /sys/class/net/$IFACE/statistics/tx_bytes)
    sleep 1
    RX2=$(cat /sys/class/net/$IFACE/statistics/rx_bytes)
    TX2=$(cat /sys/class/net/$IFACE/statistics/tx_bytes)
    DOWNLOAD=$(echo "scale=4; ($RX2 - $RX1) * 8 / 1000000" | bc)
    UPLOAD=$(echo "scale=4; ($TX2 - $TX1) * 8 / 1000000" | bc)
else
    DOWNLOAD=0
    UPLOAD=0
fi

# Coletar processos (top 10 por memória)
PROCESSES=$(ps aux --sort=-%mem | head -11 | tail -10 | awk '{printf "{\"pid\":%s,\"name\":\"%s\",\"cpu_percent\":%s,\"memory_percent\":%s},", $2, $11, $3, $4}')
PROCESSES="[${PROCESSES%,}]"

# Coletar stats do Fail2Ban
JAILS_ACTIVE=$(fail2ban-client status 2>/dev/null | grep "Number of jail" | awk '{print $NF}' || echo 0)
IPS_BANNED=$(fail2ban-client status 2>/dev/null | grep -c "Currently banned" || echo 0)
NFT_RULES=$(nft list ruleset 2>/dev/null | grep -c "rule" || echo 0)

# Montar JSON
JSON=$(cat <<EOF
{
  "cpu": $CPU,
  "memory": $MEMORY,
  "disk": $DISK,
  "uptime": "$UPTIME",
  "download_mbps": $DOWNLOAD,
  "upload_mbps": $UPLOAD,
  "processes": $PROCESSES,
  "firewall": {
    "jails_active": $JAILS_ACTIVE,
    "ips_banned": $IPS_BANNED,
    "nft_rules": $NFT_RULES,
    "uptime": "$UPTIME"
  }
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
