"""Create local configuration and persistent signing keys without printing secrets."""

import secrets
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    signing_key = secrets.token_urlsafe(48)
    for name, variable in [(".env", "JWT_SECRET"), ("backend/.env", "PE_JWT_SECRET")]:
        destination = root / name
        template = root / f"{name}.example"
        content = (
            destination.read_text(encoding="utf-8")
            if destination.exists()
            else template.read_text(encoding="utf-8")
        )
        lines = content.splitlines()
        configured = next(
            (line for line in lines if line.startswith(f"{variable}=")), None
        )
        if configured is None:
            lines.append(f"{variable}={signing_key}")
        elif not configured.partition("=")[2].strip():
            lines[lines.index(configured)] = f"{variable}={signing_key}"
        result = "\n".join(lines) + "\n"
        if not destination.exists() or content != result:
            destination.write_text(result, encoding="utf-8")
            destination.chmod(0o600)
        print(f"Ready: {name}")


if __name__ == "__main__":
    main()
