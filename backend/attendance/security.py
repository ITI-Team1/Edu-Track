import hashlib
import secrets
from datetime import timedelta
import hmac
from django.conf import settings
from django.utils import timezone
from ipaddress import ip_address, ip_network

# A (still partial) consolidated list of Egypt IPv4 CIDR allocations. For production you should
# periodically refresh from a trusted geo-IP database or RIR allocation data.
# Keeping them as CIDR strings allows faster membership test than many start-end tuples.
EGYPT_CIDRS = [
    # Telecom Egypt / TE Data blocks
    '41.32.0.0/11', '41.45.0.0/16', '41.46.0.0/15', '41.68.0.0/14', '41.128.0.0/11',
    '62.135.0.0/16', '62.140.64.0/18', '82.129.128.0/17', '82.201.128.0/17',
    '102.32.0.0/12', '102.64.0.0/15', '102.128.0.0/12',
    '105.32.0.0/12', '105.80.0.0/12',
    '145.243.0.0/16',
    '154.176.0.0/12', '154.192.0.0/11',
    '156.160.0.0/11', '156.192.0.0/11',
    '163.121.0.0/16', '169.255.0.0/16',
    '196.128.0.0/11', '196.201.0.0/16', '196.205.0.0/16', '196.219.0.0/16',
    '197.32.0.0/11', '197.120.0.0/13', '197.160.0.0/11', '197.196.0.0/14',
    '197.204.0.0/14', '197.208.0.0/12',
    '213.158.160.0/19', '213.181.224.0/19', '217.20.240.0/20', '217.55.0.0/18'
]

_EGYPT_NETWORKS = [ip_network(c) for c in EGYPT_CIDRS]

def generate_qr_token() -> str:
    return secrets.token_urlsafe(32)

def sign_join_payload(attendance_id: int, nonce: str, expires_at) -> str:
    """Return a compact HMAC-based signature for a join link.
    Format: nonce|ts|sig  (Base64 url-safe without padding)
    """
    ts = int(expires_at.timestamp())
    msg = f"{attendance_id}:{nonce}:{ts}".encode()
    key = settings.SECRET_KEY.encode()
    sig = hashlib.sha256(key + msg).hexdigest()[:32]
    return f"{nonce}.{ts}.{sig}"

def verify_join_signature(attendance_id: int, token: str):
    try:
        nonce, ts, sig = token.split('.')
        ts_i = int(ts)
    except ValueError:
        return False
    if ts_i < int(timezone.now().timestamp()):
        return False
    expected = sign_join_payload(attendance_id, nonce, timezone.datetime.fromtimestamp(ts_i, tz=timezone.utc)).split('.')[-1]
    return hmac.compare_digest(sig, expected)

def is_egypt_ip(ip: str) -> bool:
    """Check whether an IP belongs to Egyptian allocations.
    NOTE: This is IPv4 focused; extend for IPv6 if needed.
    """
    try:
        ip_obj = ip_address(ip)
    except ValueError:
        return False
    if ip_obj.version != 4:
        return False
    return any(ip_obj in net for net in _EGYPT_NETWORKS)

def token_expiry(seconds: int = 10):
    return timezone.now() + timedelta(seconds=seconds)

def hash_fingerprint(raw: str) -> str:
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def validate_geo(lat: float | None, lon: float | None, center_lat: float | None, center_lon: float | None, max_distance_m: int = 150) -> bool:
    """Very rough distance check using equirectangular approximation (campus-scale)."""
    if None in (lat, lon, center_lat, center_lon):
        return True  # If we don't have reference, allow; can tighten later
    from math import cos, radians, sqrt
    x = radians(lon - center_lon) * cos(radians((lat + center_lat) / 2))
    y = radians(lat - center_lat)
    distance_m = 6371000 * sqrt(x*x + y*y)
    return distance_m <= max_distance_m