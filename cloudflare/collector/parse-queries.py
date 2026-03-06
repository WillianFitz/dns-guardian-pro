#!/usr/bin/env python3
"""
DNS Monitor - Parser de Query Logs do BIND9
Uso: python3 parse-queries.py /var/log/named/queries.log <byte_offset>

Formato de entrada (BIND query log):
06-Mar-2026 10:30:45.123 queries: info: client @0x... 100.64.1.134#12345 (www.google.com): query: www.google.com IN A +E(0)K (170.245.94.203)

RPZ blocked (aparece como NXDOMAIN com rpz):
06-Mar-2026 10:30:45.123 rpz: info: client @0x... 100.64.1.134#12345 (bet365.com): rpz QNAME Local-Data rewrite bet365.com/A/IN via bet365.com.rpz.zone
"""

import sys
import json
import re
from datetime import datetime

def parse_bind_query_log(log_file, byte_offset=0):
    queries = []

    # Regex para query log padrão do BIND
    query_pattern = re.compile(
        r'(\d{2}-\w{3}-\d{4} \d{2}:\d{2}:\d{2}\.\d+)\s+'
        r'queries:\s+info:\s+client\s+(?:@\S+\s+)?'
        r'(\d+\.\d+\.\d+\.\d+)#\d+\s+'
        r'\(([^)]+)\):\s+query:\s+\S+\s+IN\s+(\w+)'
    )

    # Regex para RPZ block log
    rpz_pattern = re.compile(
        r'(\d{2}-\w{3}-\d{4} \d{2}:\d{2}:\d{2}\.\d+)\s+'
        r'rpz:\s+info:\s+client\s+(?:@\S+\s+)?'
        r'(\d+\.\d+\.\d+\.\d+)#\d+\s+'
        r'\(([^)]+)\):\s+rpz\s+QNAME\s+\S+\s+rewrite\s+(\S+)'
    )

    # Mapeamento de categorias RPZ (personalizar conforme necessário)
    rpz_categories = {
        'bet': 'Apostas',
        'game': 'Apostas',
        'casino': 'Apostas',
        'poker': 'Apostas',
        'slot': 'Apostas',
        'torrent': 'Streaming/Pirataria',
        'pirat': 'Streaming/Pirataria',
        'stream': 'Streaming/Pirataria',
        'flix': 'Streaming/Pirataria',
        'malware': 'Malware/Tracking',
        'track': 'Malware/Tracking',
        'adware': 'Malware/Tracking',
        'phish': 'Malware/Tracking',
    }

    def categorize_domain(domain):
        domain_lower = domain.lower()
        for keyword, category in rpz_categories.items():
            if keyword in domain_lower:
                return category
        return 'Outros'

    def parse_bind_date(date_str):
        try:
            # 06-Mar-2026 10:30:45.123
            dt = datetime.strptime(date_str.split('.')[0], '%d-%b-%Y %H:%M:%S')
            return dt.strftime('%Y-%m-%dT%H:%M:%S')
        except:
            return datetime.now().strftime('%Y-%m-%dT%H:%M:%S')

    try:
        with open(log_file, 'r') as f:
            f.seek(int(byte_offset))
            for line in f:
                line = line.strip()
                if not line:
                    continue

                # Tentar match de RPZ block primeiro
                rpz_match = rpz_pattern.search(line)
                if rpz_match:
                    timestamp, client_ip, domain, rewrite_domain = rpz_match.groups()
                    queries.append({
                        'domain': domain,
                        'query_type': 'A',
                        'client_ip': client_ip,
                        'status': 'denied',
                        'rpz_blocked': True,
                        'category': categorize_domain(domain),
                        'timestamp': parse_bind_date(timestamp),
                        'response_time_ms': 0
                    })
                    continue

                # Tentar match de query normal
                query_match = query_pattern.search(line)
                if query_match:
                    timestamp, client_ip, domain, query_type = query_match.groups()
                    queries.append({
                        'domain': domain,
                        'query_type': query_type,
                        'client_ip': client_ip,
                        'status': 'accepted',
                        'rpz_blocked': False,
                        'timestamp': parse_bind_date(timestamp),
                        'response_time_ms': 0
                    })
    except Exception as e:
        print(json.dumps({'queries': [], 'error': str(e)}))
        sys.exit(1)

    return queries

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Uso: python3 parse-queries.py <log_file> [byte_offset]')
        sys.exit(1)

    log_file = sys.argv[1]
    byte_offset = sys.argv[2] if len(sys.argv) > 2 else 0

    queries = parse_bind_query_log(log_file, byte_offset)
    print(json.dumps({'queries': queries}))
