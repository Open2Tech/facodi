import ipaddress
import socket
from collections import namedtuple
from urllib.parse import urlsplit, urlunsplit
from urllib.parse import urljoin


class UnsafeUrl(ValueError):
    """Raised when an outbound URL can reach a non-public network target."""


class ResponseTooLarge(ValueError):
    """Raised before an external response can exhaust worker memory."""


class TooManyRedirects(ValueError):
    """Raised when a connector exceeds the bounded redirect policy."""


FetchedResponse = namedtuple(
    "FetchedResponse",
    ("url", "status_code", "headers", "content_type", "body"),
)


REDIRECT_STATUSES = frozenset({301, 302, 303, 307, 308})


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


def fetch_url(
    url,
    *,
    session,
    resolver=socket.getaddrinfo,
    timeout=20,
    max_bytes=10 * 1024 * 1024,
    max_redirects=5,
):
    """Fetch one bounded public HTTPS resource, validating every redirect hop."""
    current_url = validate_outbound_url(url, resolver=resolver)

    for redirect_count in range(max_redirects + 1):
        response = session.get(
            current_url,
            allow_redirects=False,
            stream=True,
            timeout=timeout,
        )
        try:
            response_url = validate_outbound_url(
                response.url or current_url,
                resolver=resolver,
            )
            if response.status_code in REDIRECT_STATUSES:
                location = response.headers.get("Location")
                if not location:
                    raise UnsafeUrl("The redirect response has no target")
                if redirect_count >= max_redirects:
                    raise TooManyRedirects("The source exceeded the redirect limit")
                current_url = validate_outbound_url(
                    urljoin(response_url, location),
                    resolver=resolver,
                )
                continue

            content_length = response.headers.get("Content-Length")
            if content_length:
                try:
                    declared_length = int(content_length)
                except (TypeError, ValueError):
                    declared_length = None
                if declared_length is not None and declared_length > max_bytes:
                    raise ResponseTooLarge("The source response exceeds the size limit")

            chunks = []
            received = 0
            for chunk in response.iter_content(chunk_size=min(64 * 1024, max_bytes + 1)):
                if not chunk:
                    continue
                received += len(chunk)
                if received > max_bytes:
                    raise ResponseTooLarge("The source response exceeds the size limit")
                chunks.append(chunk)

            return FetchedResponse(
                url=response_url,
                status_code=response.status_code,
                headers=dict(response.headers),
                content_type=response.headers.get("Content-Type", ""),
                body=b"".join(chunks),
            )
        finally:
            response.close()

    raise TooManyRedirects("The source exceeded the redirect limit")
