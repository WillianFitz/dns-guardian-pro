#!/usr/bin/env python3
"""
DNS Monitor - Parser de Logs do Unbound
Uso: python3 parse-unbound.py /var/log/unbound/unbound.log <byte_offset> [anablock.conf]

Formato de entrada (Unbound log com verbosity 1+):
[timestamp] unbound[pid:tid] info: 100.64.1.134 www.google.com. A IN
[timestamp] unbound[pid:tid] info: reply from <cache> 100.64.1.134 www.google.com. A IN NOERROR 0.000000 0

Com log-queries: yes no unbound.conf:
[1709737845] unbound[1234:0] info: 100.64.1.134 www.google.com. A IN
"""

import sys
import json
import re
from datetime import datetime, timezone

def load_blocked_domains(anablock_file):
    """Carrega domínios bloqueados do anablock.conf do Unbound"""
    blocked = set()
    try:
        with open(anablock_file, 'r') as f:
            for line in f:
                line = line.strip()
                # local-zone: "domain.com" redirect
                match = re.match(r'local-zone:\s*"([^"]+)"', line)
                if match:
                    blocked.add(match.group(1).lower().rstrip('.'))
    except FileNotFoundError:
        pass
    return blocked

def categorize_domain(domain):
    """Categoriza o domínio baseado em keywords"""
    domain_lower = domain.lower()
    categories = {
        'Apostas': ['bet', 'game', 'casino', 'poker', 'slot', 'jackpot', 'spin', 'luck', 'win', 'play', 'gambl', 'bingo', 'roleta', 'aposta'],
        'Streaming/Pirataria': ['torrent', 'pirat', 'stream', 'flix', 'movie', 'serie', 'animes', 'mega', 'download'],
        'Malware/Tracking': ['malware', 'track', 'adware', 'phish', 'spam', 'virus', 'trojan'],
    }
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in domain_lower:
                return category
    return 'Outros'

def parse_unbound_log(log_file, byte_offset=0, anablock_file=None):
    """
    Lê o log do Unbound a partir de um offset em bytes e retorna
    apenas informações AGREGADAS:
      - total de queries aceitas / negadas
      - contagem por tipo de consulta
      - contagem por domínio
      - contagem por cliente (IP)
      - lista de eventos bloqueados (RPZ)
    """
    total_accepted = 0
    total_denied = 0
    blocked_events = []
    blocked_domains = set()
    by_type = {}
    by_domain = {}
    by_client = {}

    if anablock_file:
        blocked_domains = load_blocked_domains(anablock_file)

    # Regex para query log do Unbound
    # Formato: [timestamp] unbound[pid:tid] info: IP domain. TYPE CLASS
    query_pattern = re.compile(
        r'\[(\d+)\]\s+unbound\[\d+:\d+\]\s+info:\s+'
        r'(\d+\.\d+\.\d+\.\d+)\s+'
        r'(\S+)\.\s+'
        r'(\w+)\s+'
        r'IN'
    )

    # Formato alternativo com data legível
    # Mar  6 10:30:45 unbound[1234:0] info: 100.64.1.134 www.google.com. A IN
    query_pattern_alt = re.compile(
        r'(\w+\s+\d+\s+\d+:\d+:\d+)\s+\S*\s*unbound\[\d+:\d+\]\s+info:\s+'
        r'(\d+\.\d+\.\d+\.\d+)\s+'
        r'(\S+)\.\s+'
        r'(\w+)\s+'
        r'IN'
    )

    # Reply pattern (para capturar response time)
    reply_pattern = re.compile(
        r'reply from.*?(\d+\.\d+\.\d+\.\d+)\s+'
        r'(\S+)\.\s+'
        r'(\w+)\s+IN\s+\w+\s+'
        r'([\d.]+)'
    )

    try:
        with open(log_file, 'r') as f:
            f.seek(int(byte_offset))
            for line in f:
                line = line.strip()
                if not line or 'info:' not in line:
                    continue

                # Ignorar linhas de reply (evitar duplicata)
                if 'reply from' in line:
                    continue

                # Tentar formato com timestamp Unix
                match = query_pattern.search(line)
                if match:
                    timestamp_unix, client_ip, domain, query_type = match.groups()
                    domain_clean = domain.rstrip('.').lower()
                    is_blocked = domain_clean in blocked_domains

                    try:
                        # timestamp_unix no log Unbound é UTC; gravamos em UTC para
                        # bater com datetime('now') do D1/Cloudflare
                        timestamp = datetime.utcfromtimestamp(int(timestamp_unix)).strftime('%Y-%m-%dT%H:%M:%S')
                    except:
                        timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S')

                    # Contagens gerais
                    if is_blocked:
                        total_denied += 1
                    else:
                        total_accepted += 1

                    # Contagens por tipo, domínio e cliente
                    by_type[query_type] = by_type.get(query_type, 0) + 1
                    by_domain[domain_clean] = by_domain.get(domain_clean, 0) + 1
                    by_client[client_ip] = by_client.get(client_ip, 0) + 1

                    if is_blocked:
                        blocked_events.append({
                            'domain': domain_clean,
                            'query_type': query_type,
                            'client_ip': client_ip,
                            'category': categorize_domain(domain_clean),
                            'timestamp': timestamp,
                        })
                    else:
                        total_accepted += 1
                    continue

                # Tentar formato com data legível
                match_alt = query_pattern_alt.search(line)
                if match_alt:
                    timestamp_str, client_ip, domain, query_type = match_alt.groups()
                    domain_clean = domain.rstrip('.').lower()
                    is_blocked = domain_clean in blocked_domains

                    try:
                        current_year = datetime.now().year
                        timestamp = datetime.strptime(f"{current_year} {timestamp_str}", '%Y %b %d %H:%M:%S').strftime('%Y-%m-%dT%H:%M:%S')
                    except:
                        timestamp = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')

                    # Contagens gerais
                    if is_blocked:
                        total_denied += 1
                    else:
                        total_accepted += 1

                    # Contagens por tipo, domínio e cliente
                    by_type[query_type] = by_type.get(query_type, 0) + 1
                    by_domain[domain_clean] = by_domain.get(domain_clean, 0) + 1
                    by_client[client_ip] = by_client.get(client_ip, 0) + 1

                    if is_blocked:
                        blocked_events.append({
                            'domain': domain_clean,
                            'query_type': query_type,
                            'client_ip': client_ip,
                            'category': categorize_domain(domain_clean),
                            'timestamp': timestamp,
                        })
                    else:
                        total_accepted += 1

    except Exception as e:
        print(json.dumps({
            'summary': {'accepted': 0, 'denied': 0},
            'by_type': {},
            'by_domain': {},
            'by_client': {},
            'blocked': [],
            'error': str(e),
        }))
        sys.exit(1)

    return {
        'summary': {
            'accepted': total_accepted,
            'denied': total_denied,
        },
        'by_type': by_type,
        'by_domain': by_domain,
        'by_client': by_client,
        'blocked': blocked_events,
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Uso: python3 parse-unbound.py <log_file> [byte_offset] [anablock.conf]')
        sys.exit(1)

    log_file = sys.argv[1]
    byte_offset = sys.argv[2] if len(sys.argv) > 2 else 0
    anablock_file = sys.argv[3] if len(sys.argv) > 3 else None

    result = parse_unbound_log(log_file, byte_offset, anablock_file)
    print(json.dumps(result))
