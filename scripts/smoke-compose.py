"""Check the running Compose stack using only the Python standard library."""

import json
import os
from html.parser import HTMLParser
from urllib.parse import urljoin
from urllib.request import urlopen


class Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.assets: set[str] = set()
        self.text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        asset = attributes.get("src") if tag == "script" else attributes.get("href")
        if asset and "/assets/" in asset:
            self.assets.add(asset)

    def handle_data(self, data: str) -> None:
        self.text.append(data)


def main() -> None:
    frontend = f"http://127.0.0.1:{os.environ.get('FRONTEND_PORT', '3000')}/"
    backend = f"http://127.0.0.1:{os.environ.get('BACKEND_PORT', '8000')}/api/v1/health"
    with urlopen(backend, timeout=10) as response:
        health = json.load(response)
    assert health == {"status": "ok", "service": "pe-backend"}, health

    with urlopen(frontend, timeout=10) as response:
        html = response.read().decode()
    page = Page()
    page.feed(html)
    assert "pe-backend" in "".join(page.text), "SSR did not render the API response"
    assert page.assets, "No client assets in the rendered document"
    for asset in sorted(page.assets):
        with urlopen(urljoin(frontend, asset), timeout=10) as response:
            assert response.status == 200, asset
            assert response.read(), f"Empty asset: {asset}"
    print(f"API, SSR and {len(page.assets)} static assets passed")


if __name__ == "__main__":
    main()
