#!/bin/bash
# =============================================================
# DNS Monitor - Instalador para Unbound
# Uso: sudo bash install.sh
# =============================================================

echo "========================================"
echo " DNS Monitor - Instalador (Unbound)"
echo "========================================"
echo ""

if [ "$EUID" -ne 0 ]; then
    echo "❌ Execute como root: sudo bash install.sh"
    exit 1
fi

read -p "URL da API (ex: https://dns-monitor-api.seudominio.workers.dev): " API_URL
read -p "API Key (gerada no painel admin): " API_KEY
read -p "Caminho do log do Unbound (padrão: /var/log/unbound/unbound.log): " UNBOUND_LOG
UNBOUND_LOG=${UNBOUND_LOG:-/var/log/unbound/unbound.log}
read -p "Caminho do anablock.conf (padrão: /etc/unbound/anablock.conf): " ANABLOCK
ANABLOCK=${ANABLOCK:-/etc/unbound/anablock.conf}

echo ""
echo "📦 Instalando dependências..."
apt-get update -qq
apt-get install -y -qq python3 curl bc

echo "📁 Criando diretório /opt/dns-monitor..."
mkdir -p /opt/dns-monitor

echo "📋 Instalando scripts..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/collect-dns.sh" /opt/dns-monitor/
cp "$SCRIPT_DIR/collect-system.sh" /opt/dns-monitor/
cp "$SCRIPT_DIR/collect-rpz.sh" /opt/dns-monitor/
cp "$SCRIPT_DIR/parse-unbound.py" /opt/dns-monitor/

# Configurar
sed -i "s|API_URL=.*|API_URL=\"$API_URL\"|" /opt/dns-monitor/collect-dns.sh
sed -i "s|API_KEY=.*|API_KEY=\"$API_KEY\"|" /opt/dns-monitor/collect-dns.sh
sed -i "s|UNBOUND_LOG=.*|UNBOUND_LOG=\"$UNBOUND_LOG\"|" /opt/dns-monitor/collect-dns.sh
sed -i "s|ANABLOCK_FILE=.*|ANABLOCK_FILE=\"$ANABLOCK\"|" /opt/dns-monitor/collect-dns.sh

sed -i "s|API_URL=.*|API_URL=\"$API_URL\"|" /opt/dns-monitor/collect-system.sh
sed -i "s|API_KEY=.*|API_KEY=\"$API_KEY\"|" /opt/dns-monitor/collect-system.sh

sed -i "s|API_URL=.*|API_URL=\"$API_URL\"|" /opt/dns-monitor/collect-rpz.sh
sed -i "s|API_KEY=.*|API_KEY=\"$API_KEY\"|" /opt/dns-monitor/collect-rpz.sh
sed -i "s|ANABLOCK_FILE=.*|ANABLOCK_FILE=\"$ANABLOCK\"|" /opt/dns-monitor/collect-rpz.sh

chmod +x /opt/dns-monitor/*.sh

echo "⏰ Configurando crontab..."
(crontab -l 2>/dev/null | grep -v 'dns-monitor'; \
 echo "# DNS Monitor"; \
 echo "* * * * * /opt/dns-monitor/collect-dns.sh"; \
 echo "* * * * * /opt/dns-monitor/collect-system.sh"; \
 echo "0 */6 * * * /opt/dns-monitor/collect-rpz.sh") | crontab -

echo ""
echo "🔍 Verificando configuração do Unbound..."

if [ -f "$UNBOUND_LOG" ]; then
    echo "✅ Log encontrado: $UNBOUND_LOG"
else
    echo "⚠️  Log NÃO encontrado: $UNBOUND_LOG"
    echo ""
    echo "Adicione ao /etc/unbound/unbound.conf:"
    echo ""
    echo "  server:"
    echo "    verbosity: 1"
    echo "    log-queries: yes"
    echo "    logfile: \"$UNBOUND_LOG\""
    echo "    use-syslog: no"
    echo ""
    echo "Depois reinicie: systemctl restart unbound"
fi

if [ -f "$ANABLOCK" ]; then
    TOTAL=$(grep -c 'local-zone:' "$ANABLOCK" 2>/dev/null || echo 0)
    echo "✅ anablock.conf encontrado: $ANABLOCK ($TOTAL domínios)"
else
    echo "⚠️  anablock.conf NÃO encontrado: $ANABLOCK"
fi

echo ""
echo "========================================"
echo " ✅ Instalação concluída!"
echo "========================================"
echo ""
echo "Coletores configurados:"
echo "  📊 Queries DNS: a cada 1 minuto"
echo "  💻 Métricas sistema: a cada 1 minuto"
echo "  🛡️  Lista bloqueio: a cada 6 horas"
echo ""
echo "Logs: /opt/dns-monitor/collector.log"
echo ""
echo "Testar manualmente:"
echo "  /opt/dns-monitor/collect-dns.sh"
echo "  /opt/dns-monitor/collect-system.sh"
echo "  /opt/dns-monitor/collect-rpz.sh"
echo ""
echo "⚠️  IMPORTANTE: Habilite o log de queries no Unbound:"
echo "  server:"
echo "    verbosity: 1"
echo "    log-queries: yes"
echo "    logfile: \"$UNBOUND_LOG\""
