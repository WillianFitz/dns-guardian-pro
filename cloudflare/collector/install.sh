#!/bin/bash
# =============================================================
# DNS Monitor - Script de Instalação no Servidor DNS
# Uso: sudo bash install.sh
# =============================================================

echo "========================================"
echo " DNS Monitor - Instalador do Coletor"
echo "========================================"
echo ""

# Verificar root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Execute como root: sudo bash install.sh"
    exit 1
fi

# Pedir configurações
read -p "URL da API (ex: https://dns-monitor-api.seudominio.workers.dev): " API_URL
read -p "API Key (gerada no painel admin): " API_KEY
read -p "Caminho do query log do BIND (padrão: /var/log/named/queries.log): " QUERY_LOG
QUERY_LOG=${QUERY_LOG:-/var/log/named/queries.log}
read -p "Caminho da zona RPZ (padrão: /etc/bind/zones/db.rpz.zone): " RPZ_ZONE
RPZ_ZONE=${RPZ_ZONE:-/etc/bind/zones/db.rpz.zone}

echo ""
echo "📦 Instalando dependências..."
apt-get update -qq
apt-get install -y -qq python3 curl bc

echo "📁 Criando diretório /opt/dns-monitor..."
mkdir -p /opt/dns-monitor

# Copiar scripts
echo "📋 Instalando scripts..."
cp collect-dns.sh /opt/dns-monitor/
cp collect-system.sh /opt/dns-monitor/
cp collect-rpz.sh /opt/dns-monitor/
cp parse-queries.py /opt/dns-monitor/

# Configurar API URL e KEY nos scripts
sed -i "s|API_URL=.*|API_URL=\"$API_URL\"|" /opt/dns-monitor/collect-dns.sh
sed -i "s|API_KEY=.*|API_KEY=\"$API_KEY\"|" /opt/dns-monitor/collect-dns.sh
sed -i "s|QUERY_LOG=.*|QUERY_LOG=\"$QUERY_LOG\"|" /opt/dns-monitor/collect-dns.sh

sed -i "s|API_URL=.*|API_URL=\"$API_URL\"|" /opt/dns-monitor/collect-system.sh
sed -i "s|API_KEY=.*|API_KEY=\"$API_KEY\"|" /opt/dns-monitor/collect-system.sh

sed -i "s|API_URL=.*|API_URL=\"$API_URL\"|" /opt/dns-monitor/collect-rpz.sh
sed -i "s|API_KEY=.*|API_KEY=\"$API_KEY\"|" /opt/dns-monitor/collect-rpz.sh
sed -i "s|RPZ_ZONE_FILE=.*|RPZ_ZONE_FILE=\"$RPZ_ZONE\"|" /opt/dns-monitor/collect-rpz.sh

chmod +x /opt/dns-monitor/*.sh

# Configurar cron
echo "⏰ Configurando crontab..."
(crontab -l 2>/dev/null; echo "# DNS Monitor - Coleta de queries DNS a cada minuto") | crontab -
(crontab -l 2>/dev/null; echo "* * * * * /opt/dns-monitor/collect-dns.sh") | crontab -
(crontab -l 2>/dev/null; echo "# DNS Monitor - Métricas do sistema a cada minuto") | crontab -
(crontab -l 2>/dev/null; echo "* * * * * /opt/dns-monitor/collect-system.sh") | crontab -
(crontab -l 2>/dev/null; echo "# DNS Monitor - Atualização lista RPZ a cada 6 horas") | crontab -
(crontab -l 2>/dev/null; echo "0 */6 * * * /opt/dns-monitor/collect-rpz.sh") | crontab -

# Verificar se o BIND está logando queries
echo ""
echo "🔍 Verificando configuração do BIND..."
if [ -f "$QUERY_LOG" ]; then
    echo "✅ Query log encontrado: $QUERY_LOG"
else
    echo "⚠️  Query log NÃO encontrado em: $QUERY_LOG"
    echo ""
    echo "Adicione ao seu named.conf.options:"
    echo ""
    echo '  logging {'
    echo '    channel query_log {'
    echo "      file \"$QUERY_LOG\" versions 5 size 100m;"
    echo '      severity info;'
    echo '      print-time yes;'
    echo '      print-category yes;'
    echo '    };'
    echo '    category queries { query_log; };'
    echo '  };'
    echo ""
    echo "Depois reinicie: systemctl restart named"
fi

if [ -f "$RPZ_ZONE" ]; then
    echo "✅ Zona RPZ encontrada: $RPZ_ZONE"
else
    echo "⚠️  Zona RPZ NÃO encontrada em: $RPZ_ZONE"
fi

echo ""
echo "========================================"
echo " ✅ Instalação concluída!"
echo "========================================"
echo ""
echo "Os coletores foram configurados:"
echo "  📊 Queries DNS: a cada 1 minuto"
echo "  💻 Métricas sistema: a cada 1 minuto"  
echo "  🛡️  Lista RPZ: a cada 6 horas"
echo ""
echo "Logs em: /opt/dns-monitor/collector.log"
echo ""
echo "Para testar manualmente:"
echo "  /opt/dns-monitor/collect-dns.sh"
echo "  /opt/dns-monitor/collect-system.sh"
echo "  /opt/dns-monitor/collect-rpz.sh"
