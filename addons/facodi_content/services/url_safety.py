import ipaddress
import socket
from urllib.parse import urlsplit, urlunsplit


class UnsafeUrl(ValueError):
    """Raised when an outbound URL can reach a non-public network target."""


def validate_outbound_url(url, *, resolver=socket.getaddrinfo):
    parsed = urlsplit(str(url or "").strip())
    if parsed.scheme.lower() != "https":
        raise UnsafeUrl("Only HTTPS source URLs are allowed")
    if not parsed.hostname:
        raise UnsafeUrl("The source URL has no hostname")
    if parsed.username is not None or parsed.password is not None:
        raise UnsafeUrl("Credentials are not allowed in source URLs")

    hostname = parsed.hostname.rstrip(".").lower()
    if hostname == "localhost" or hostname.endswith(".localhost"):
        raise UnsafeUrl("Localhost is not an allowed source")

    try:
        literal = ipaddress.ip_address(hostname)
    except ValueError:
        literal = None
    if literal is not None:
        addresses = [literal]
    else:
        try:
            answers = resolver(
                hostname,
                parsed.port or 443,
                type=socket.SOCK_STREAM,
            )
        except (OSError, socket.gaierror) as error:
            raise UnsafeUrl("The source hostname cannot be resolved") from error
        addresses = []
        for answer in answers:
            try:
                addresses.append(ipaddress.ip_address(answer[4][0]))
            except (IndexError, TypeError, ValueError) as error:
                raise UnsafeUrl("The source hostname returned an invalid address") from error

    if not addresses or any(not address.is_global for address in addresses):
        raise UnsafeUrl("The source hostname resolves to a non-public address")

    host_for_url = hostname
    if ":" in hostname:
        host_for_url = f"[{hostname}]"
    if parsed.port and parsed.port != 443:
        host_for_url = f"{host_for_url}:{parsed.port}"
    return urlunsplit(("https", host_for_url, parsed.path or "", parsed.query, ""))


def redact_url(url):
    parsed = urlsplit(str(url or "").strip())
    hostname = (parsed.hostname or "").lower()
    host_for_url = hostname
    if ":" in hostname:
        host_for_url = f"[{hostname}]"
    try:
        port = parsed.port
    except ValueError:
        port = None
    if port:
        host_for_url = f"{host_for_url}:{port}"
    return urlunsplit((parsed.scheme.lower(), host_for_url, parsed.path, "", ""))
