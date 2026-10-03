import json
from pathlib import Path

from app.main import app
from fastapi.openapi.utils import get_openapi


def export_openapi() -> None:
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )

    out_dir = Path(__file__).resolve().parent.parent.parent / "docs" / "api"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "openapi.json"

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2)

    print(f"Exported OpenAPI spec successfully to {out_file}")


if __name__ == "__main__":
    export_openapi()
