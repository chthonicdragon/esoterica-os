import argparse
import os
import subprocess
import sys
from pathlib import Path


def run(cmd: list[str], cwd: Path) -> None:
    p = subprocess.run(cmd, cwd=str(cwd), shell=False)
    if p.returncode != 0:
        raise SystemExit(p.returncode)


def main() -> None:
    repo = Path(__file__).resolve().parent

    parser = argparse.ArgumentParser(description="Update preset library and web import bundle")
    parser.add_argument(
        "--input",
        default=r"C:\Users\Даниил\Downloads\v\presets_expanded_full.json.txt",
        help="Path to presets.json / presets.jsonc / presets.txt (JSON with optional comments)",
    )
    parser.add_argument(
        "--out-dir",
        default=str(repo / "presets_out"),
        help="Output directory for expanded preset bundle",
    )
    parser.add_argument(
        "--public-library",
        default=str(repo / "public" / "presets" / "knowledge_web_library.json"),
        help="Public preset library file used by the UI",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    out_dir = Path(args.out_dir)
    public_library = Path(args.public_library)

    if not input_path.exists():
        raise SystemExit(f"Input not found: {input_path}")

    out_dir.mkdir(parents=True, exist_ok=True)
    public_library.parent.mkdir(parents=True, exist_ok=True)

    node = "node"

    run([node, "scripts/expand_presets_bundle.mjs", str(input_path), str(out_dir)], repo)
    run(
        [
            node,
            "scripts/presets_to_knowledge_web_import.mjs",
            str(out_dir / "import-ready.json"),
            str(out_dir / "knowledge_web_import.json"),
        ],
        repo,
    )
    run(
        [
            node,
            "scripts/build_preset_library.mjs",
            str(out_dir / "knowledge_web_import.json"),
            str(public_library),
        ],
        repo,
    )

    print("OK")
    print(f"- bundle: {out_dir}")
    print(f"- web import: {out_dir / 'knowledge_web_import.json'}")
    print(f"- ui library: {public_library}")


if __name__ == "__main__":
    main()

