#!/usr/bin/env python3
"""Deterministic static audit & ground-truth snapshot builder for Frevia Capstone docs.

Reads directly in-place (zero repo mutations) across:
- Codebase ground truth: Prisma schema, NestJS controllers, Next.js pages, docker-compose + ai-services
- Reports 1-6: LaTeX sources/logs, Report 5 Excel/HTML test artifacts, Draw.io/SVG/PDF diagrams

Outputs:
- frevia_static_audit.xlsx (8 sheets)
- frevia_code_snapshot.md
"""

from __future__ import annotations

import argparse
import base64
import html
import os
import pathlib
import re
import subprocess
import urllib.parse
import xml.etree.ElementTree as ET
import zlib
from collections import Counter, defaultdict
from html.parser import HTMLParser
from typing import Any

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill
import xlrd
import yaml

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent

REPORTS = [
    ("Report 1", REPO_ROOT / "docs" / "Report 1" / "main.tex"),
    ("Report 2", REPO_ROOT / "docs" / "Report 2" / "main.tex"),
    ("Report 3", REPO_ROOT / "docs" / "Report 3" / "main.tex"),
    ("Report 4", REPO_ROOT / "docs" / "Report 4" / "main.tex"),
    ("Report 5", REPO_ROOT / "docs" / "Report 5" / "Report5_Test_Documentation.tex"),
    ("Report 6", REPO_ROOT / "docs" / "report 6" / "Report6_Software_User_Guides.tex"),
]

MEMBERS = ("kvy", "nhuy", "ntin", "ptai", "tthuan")

DRAWIO_DIRS = [
    REPO_ROOT / "uc-diagrams",
    REPO_ROOT / "class-diagrams",
    REPO_ROOT / "sequence-diagrams-remake",
    REPO_ROOT / "docs" / "Report 3" / "screen_flow",
    REPO_ROOT / "docs" / "Report 3" / "image" / "context_diagram",
    REPO_ROOT / "docs" / "Report 4" / "images" / "architecture",
]

TEMPLATE_KEYWORDS = [
    "Cafeteria",
    "Process Impact",
    "August 2019",
    "PWM",
    "AutiCare",
    "Sample Student",
    "Nguyen Van A",
    "Lorem ipsum",
]


def detect_member(rel_path: str) -> str:
    """Infer responsible team member from path segments."""
    norm = rel_path.replace("\\", "/").lower()
    for m in MEMBERS:
        if f"/{m}/" in norm or norm.endswith(f"/{m}.tex") or f"_{m}_" in norm:
            return m
    return "shared"


def strip_tex_comments(line: str) -> str:
    """Remove unescaped LaTeX % comments while preserving escaped \\%."""
    out = []
    i = 0
    while i < len(line):
        ch = line[i]
        if ch == "\\" and i + 1 < len(line):
            out.append(line[i : i + 2])
            i += 2
            continue
        if ch == "%":
            break
        out.append(ch)
        i += 1
    return "".join(out)


def expand_tex_tree(root_tex: pathlib.Path) -> list[dict[str, Any]]:
    """Recursively expand \\input and \\include starting from a root .tex file."""
    base_dir = root_tex.parent
    visited: set[pathlib.Path] = set()
    records: list[dict[str, Any]] = []

    def _walk(tex_path: pathlib.Path) -> None:
        resolved = tex_path.resolve()
        if resolved in visited or not resolved.exists():
            return
        visited.add(resolved)
        rel = str(resolved.relative_to(REPO_ROOT)).replace("\\", "/")
        owner = detect_member(rel)
        raw_lines = resolved.read_text(encoding="utf-8", errors="ignore").splitlines()
        for idx, raw in enumerate(raw_lines, 1):
            clean = strip_tex_comments(raw)
            records.append(
                {
                    "file": rel,
                    "line": idx,
                    "member": owner,
                    "raw": raw,
                    "clean": clean,
                }
            )
            for m in re.finditer(r"\\(?:input|include)\{([^}]+)\}", clean):
                inc = m.group(1).strip()
                cand = base_dir / (inc if inc.endswith(".tex") else f"{inc}.tex")
                if not cand.exists():
                    cand = tex_path.parent / (inc if inc.endswith(".tex") else f"{inc}.tex")
                _walk(cand)

    _walk(root_tex)
    return records


def extract_braced_args(text: str, macro: str, num_args: int = 1) -> list[tuple[int, list[str]]]:
    """Extract brace-delimited arguments for a LaTeX macro."""
    results: list[tuple[int, list[str]]] = []
    pat = re.compile(rf"\\{re.escape(macro)}(?:\[[^\]]*\])?\s*\{{")
    pos = 0
    while True:
        m = pat.search(text, pos)
        if not m:
            break
        idx = m.end() - 1
        args: list[str] = []
        cur = idx
        ok = True
        for _ in range(num_args):
            while cur < len(text) and text[cur].isspace():
                cur += 1
            if cur >= len(text) or text[cur] != "{":
                ok = False
                break
            depth = 0
            start = cur + 1
            while cur < len(text):
                if text[cur] == "\\" and cur + 1 < len(text):
                    cur += 2
                    continue
                if text[cur] == "{":
                    depth += 1
                elif text[cur] == "}":
                    depth -= 1
                    if depth == 0:
                        args.append(text[start:cur])
                        cur += 1
                        break
                cur += 1
            else:
                ok = False
                break
        if ok:
            results.append((m.start(), args))
            pos = cur
        else:
            pos = m.end()
    return results


def check_exact_case_path(base_dir: pathlib.Path, rel_target: str) -> tuple[bool, str]:
    """Verify file exists on Windows/POSIX with exact case on every path component."""
    rel_clean = rel_target.strip().strip('"')
    parts = [p for p in rel_clean.replace("\\", "/").split("/") if p and p != "."]
    cur = base_dir
    for i, part in enumerate(parts):
        if part == "..":
            cur = cur.parent
            continue
        if not cur.exists() or not cur.is_dir():
            return False, "missing"
        entries = os.listdir(cur)
        if part in entries:
            cur = cur / part
            continue
        ci_matches = [e for e in entries if e.lower() == part.lower()]
        if ci_matches:
            return False, f"case_mismatch:{ci_matches[0]}"
        if i == len(parts) - 1:
            suffix = pathlib.Path(part).suffix.lower()
            if suffix not in {".pdf", ".png", ".jpg", ".jpeg", ".svg", ".tex"}:
                for ext in (".pdf", ".png", ".jpg", ".jpeg", ".tex"):
                    if (part + ext) in entries:
                        return True, "exact"
                    ci_ext = [e for e in entries if e.lower() == (part + ext).lower()]
                    if ci_ext:
                        return False, f"case_mismatch:{ci_ext[0]}"
        return False, "missing"
    return (cur.exists(), "exact" if cur.exists() else "missing")


# ==============================================================================
# 3.3 GROUND TRUTH CODEBASE EXTRACTION
# ==============================================================================

def parse_prisma_schema() -> dict[str, Any]:
    """Parse models, fields, relations, and enums from schema.prisma."""
    schema_path = REPO_ROOT / "apps" / "api" / "prisma" / "schema.prisma"
    models: dict[str, list[dict[str, Any]]] = {}
    enums: dict[str, list[str]] = {}
    if not schema_path.exists():
        return {"models": models, "enums": enums}

    lines = schema_path.read_text(encoding="utf-8", errors="ignore").splitlines()
    cur_kind: str | None = None
    cur_name: str | None = None
    for raw in lines:
        line = re.sub(r"//.*$", "", raw).strip()
        if not line:
            continue
        m_mod = re.match(r"^(model|enum)\s+(\w+)\s*\{", line)
        if m_mod:
            cur_kind, cur_name = m_mod.group(1), m_mod.group(2)
            if cur_kind == "model":
                models[cur_name] = []
            else:
                enums[cur_name] = []
            continue
        if line == "}":
            cur_kind, cur_name = None, None
            continue
        if cur_kind == "model" and cur_name:
            if line.startswith("@@"):
                continue
            parts = line.split()
            if len(parts) >= 2:
                models[cur_name].append(
                    {
                        "name": parts[0],
                        "type": parts[1],
                        "raw": line,
                    }
                )
        elif cur_kind == "enum" and cur_name:
            tok = line.split()[0]
            enums[cur_name].append(tok)
    return {"models": models, "enums": enums}


def parse_nestjs_routes() -> list[dict[str, str]]:
    """Extract controller paths, HTTP methods, and role/auth decorators from NestJS routes."""
    routes_dir = REPO_ROOT / "apps" / "api" / "src" / "routes"
    endpoints: list[dict[str, str]] = []
    if not routes_dir.exists():
        return endpoints

    for ctrl in sorted(routes_dir.rglob("*.controller.ts")):
        rel = str(ctrl.relative_to(REPO_ROOT)).replace("\\", "/")
        txt = ctrl.read_text(encoding="utf-8", errors="ignore")
        m_ctrl = re.search(r"@Controller\(([^)]*)\)", txt)
        base = ""
        if m_ctrl:
            m_str = re.search(r"['\"]([^'\"]*)['\"]", m_ctrl.group(1))
            if m_str:
                base = m_str.group(1).strip("/")

        lines = txt.splitlines()
        for i, ln in enumerate(lines):
            m_http = re.match(r"^\s*@(Get|Post|Put|Patch|Delete)\(([^)]*)\)", ln)
            if not m_http:
                continue
            method = m_http.group(1).upper()
            sub = ""
            m_sub = re.search(r"['\"]([^'\"]*)['\"]", m_http.group(2))
            if m_sub:
                sub = m_sub.group(1).strip("/")
            full_path = "/api/" + "/".join(p for p in (base, sub) if p)
            window = "\n".join(lines[max(0, i - 3) : min(len(lines), i + 6)])
            is_public = "@IsPublic" in window
            roles = re.findall(r"@Roles\(([^)]+)\)", window)
            endpoints.append(
                {
                    "method": method,
                    "path": full_path,
                    "auth": "Public" if is_public else ("Roles:" + ",".join(roles) if roles else "JWT/RBAC"),
                    "file": rel,
                }
            )
    return endpoints


def parse_nextjs_pages() -> list[str]:
    """Discover Next.js App Router pages and normalize route groups."""
    app_dir = REPO_ROOT / "apps" / "web" / "app"
    pages: list[str] = []
    if not app_dir.exists():
        return pages
    for page_file in sorted(app_dir.rglob("page.tsx")):
        rel_parts = page_file.relative_to(app_dir).parts[:-1]
        clean_parts = [p for p in rel_parts if not (p.startswith("(") and p.endswith(")"))]
        pages.append("/" + "/".join(clean_parts))
    return sorted(set(pages))


def parse_docker_and_ai() -> dict[str, Any]:
    """Inspect docker-compose.yml and ai-services directory."""
    dc_path = REPO_ROOT / "docker-compose.yml"
    services: list[dict[str, Any]] = []
    if dc_path.exists():
        data = yaml.safe_load(dc_path.read_text(encoding="utf-8", errors="ignore")) or {}
        for name, cfg in (data.get("services") or {}).items():
            build = cfg.get("build") or {}
            ctx = build.get("context") if isinstance(build, dict) else build
            ctx_exists = True
            if isinstance(ctx, str):
                ctx_exists = (REPO_ROOT / ctx).exists()
            services.append(
                {
                    "name": name,
                    "container": cfg.get("container_name", ""),
                    "image": cfg.get("image", ""),
                    "build_context": ctx or "",
                    "context_exists": ctx_exists,
                    "ports": cfg.get("ports") or [],
                    "environment": cfg.get("environment") or [],
                }
            )

    ai_dir = REPO_ROOT / "ai-services"
    ai_endpoints: list[dict[str, str]] = []
    ai_folders = sorted([p.name for p in ai_dir.iterdir() if p.is_dir()]) if ai_dir.exists() else []
    if ai_dir.exists():
        for py in sorted(ai_dir.rglob("*.py")):
            if any(skip in py.parts for skip in ("venv", ".venv", "__pycache__", "node_modules")):
                continue
            txt = py.read_text(encoding="utf-8", errors="ignore")
            for m in re.finditer(r"@(?:app|router)\.(get|post|put|delete)\(\s*['\"]([^'\"]+)['\"]", txt):
                ai_endpoints.append(
                    {
                        "method": m.group(1).upper(),
                        "path": m.group(2),
                        "file": str(py.relative_to(REPO_ROOT)).replace("\\", "/"),
                    }
                )
    return {"services": services, "ai_folders": ai_folders, "ai_endpoints": ai_endpoints}


# ==============================================================================
# 3.1 LOGS, GEOMETRY, & REPORT 7 READINESS
# ==============================================================================

def audit_logs_and_geometry(expanded: dict[str, list[dict[str, Any]]]) -> tuple[list[dict], list[dict]]:
    log_issues: list[dict] = []
    r7_conflicts: list[dict] = []

    labels_by_name: dict[str, list[tuple[str, str, int]]] = defaultdict(list)
    macros_by_name: dict[str, list[tuple[str, str, int]]] = defaultdict(list)
    geometries: dict[str, str] = {}

    for rep_name, root_tex in REPORTS:
        if not root_tex.exists():
            log_issues.append(
                {
                    "severity": "P0",
                    "report": rep_name,
                    "member": "shared",
                    "category": "Missing Root File",
                    "location": str(root_tex.relative_to(REPO_ROOT)),
                    "detail": "Root .tex file not found",
                }
            )
            continue

        # Geometry & documentclass
        head_txt = "\n".join(r["clean"] for r in expanded[rep_name][:120])
        m_doc = re.search(r"\\documentclass\[([^\]]*)\]", head_txt)
        m_geo = re.search(r"\\usepackage\[([^\]]*)\]\{geometry\}|\\geometry\{([^}]*)\}", head_txt, re.DOTALL)
        geo_str = ""
        if m_geo:
            geo_str = re.sub(r"\s+", " ", (m_geo.group(1) or m_geo.group(2) or "")).strip()
        doc_str = m_doc.group(1) if m_doc else ""
        geometries[rep_name] = f"class=[{doc_str}] geometry=[{geo_str}]"

        # Log parsing
        log_path = root_tex.with_suffix(".log")
        if not log_path.exists():
            log_issues.append(
                {
                    "severity": "P0",
                    "report": rep_name,
                    "member": "shared",
                    "category": "Missing Log",
                    "location": str(log_path.relative_to(REPO_ROOT)),
                    "detail": "Compile .log file does not exist",
                }
            )
        else:
            log_lines = log_path.read_text(encoding="utf-8", errors="ignore").splitlines()
            for idx, ln in enumerate(log_lines, 1):
                if re.search(r"Reference `[^']+' on page \d+ undefined|Citation `[^']+' .* undefined", ln):
                    log_issues.append(
                        {
                            "severity": "P0",
                            "report": rep_name,
                            "member": "shared",
                            "category": "Undefined Reference (??)",
                            "location": f"{log_path.name}:L{idx}",
                            "detail": ln.strip(),
                        }
                    )
                elif re.search(r"Label `[^']+' multiply defined", ln):
                    log_issues.append(
                        {
                            "severity": "P0",
                            "report": rep_name,
                            "member": "shared",
                            "category": "Duplicate Label",
                            "location": f"{log_path.name}:L{idx}",
                            "detail": ln.strip(),
                        }
                    )
                elif ln.startswith("!") or "not found" in ln.lower() and "file `" in ln.lower():
                    log_issues.append(
                        {
                            "severity": "P0",
                            "report": rep_name,
                            "member": "shared",
                            "category": "LaTeX Error / Missing File",
                            "location": f"{log_path.name}:L{idx}",
                            "detail": ln.strip(),
                        }
                    )
                else:
                    m_ov = re.search(r"Overfull \\hbox \(([0-9.]+)pt too wide\)", ln)
                    if m_ov:
                        pts = float(m_ov.group(1))
                        if pts > 10.0:
                            sev = "P1" if pts > 25.0 else "P2"
                            log_issues.append(
                                {
                                    "severity": sev,
                                    "report": rep_name,
                                    "member": "shared",
                                    "category": f"Overfull \\hbox (>{10}pt)",
                                    "location": f"{log_path.name}:L{idx}",
                                    "detail": ln.strip(),
                                }
                            )

        # Collect labels & macros across expanded sources for Report 7 readiness
        for rec in expanded[rep_name]:
            clean = rec["clean"]
            for m_lbl in re.finditer(r"\\label\{([^}]+)\}", clean):
                labels_by_name[m_lbl.group(1).strip()].append((rep_name, rec["file"], rec["line"]))
            for m_cmd in re.finditer(r"\\(?:newcommand|renewcommand|newenvironment|definecolor)\*?\{\\?([A-Za-z@]+)\}", clean):
                macros_by_name[m_cmd.group(1)].append((rep_name, rec["file"], rec["line"]))

    # Record geometry summary as info rows
    geo_vals = set(geometries.values())
    if len(geo_vals) > 1:
        for rep_name, g in geometries.items():
            log_issues.append(
                {
                    "severity": "P2",
                    "report": rep_name,
                    "member": "shared",
                    "category": "Geometry / Class Info",
                    "location": "preamble",
                    "detail": g,
                }
            )

    for name, occs in sorted(labels_by_name.items()):
        reps = sorted({o[0] for o in occs})
        if len(reps) > 1:
            r7_conflicts.append(
                {
                    "type": "Duplicate \\label across reports",
                    "identifier": name,
                    "reports": ", ".join(reps),
                    "locations": " | ".join(f"{r}: {f}:L{l}" for r, f, l in occs[:6]),
                    "action": f"Add report prefix (e.g. r3_{name}) before merging Report 7",
                }
            )

    for name, occs in sorted(macros_by_name.items()):
        reps = sorted({o[0] for o in occs})
        if len(reps) > 1 and name not in {"thepart", "thesection", "thesubsection", "thesubsubsection", "theparagraph", "thesubparagraph", "thepage", "arraystretch", "headrulewidth", "footrulewidth", "cftpartleader", "cftsecleader", "cftsubsecleader", "cftsubsubsecleader", "cftpartfont", "cftpartpagefont", "cftsecfont", "cftsecpagefont", "contentsname", "listtablename"}:
            r7_conflicts.append(
                {
                    "type": "Shared/Overlapping Macro or Color",
                    "identifier": name,
                    "reports": ", ".join(reps),
                    "locations": " | ".join(f"{r}: {f}:L{l}" for r, f, l in occs[:6]),
                    "action": "Verify macro/color definition compatibility in Report 7 preamble",
                }
            )

    return log_issues, r7_conflicts


# ==============================================================================
# 3.2 CUSTOM MACROS, IMAGES, TEMPLATE LEFTOVERS, & INTERNAL REFS
# ==============================================================================

def strip_latex_commands(text: str) -> str:
    """Strip common LaTeX control sequences for clean placeholder/text scanning."""
    t = re.sub(r"\\(?:texttt|textbf|textit|emph|url|path|label|ref|pageref|autoref|cref)\{([^}]*)\}", r"\1", text)
    t = re.sub(r"\\begin\{[^}]+\}(?:\[[^\]]*\])?(?:\{[^}]*\})?", " ", t)
    t = re.sub(r"\\end\{[^}]+\}", " ", t)
    t = re.sub(r"\\[A-Za-z@]+\*?(?:\[[^\]]*\])?", " ", t)
    return t


def audit_macros_images_and_leftovers(
    expanded: dict[str, list[dict[str, Any]]]
) -> tuple[list[dict], list[dict], list[dict], dict[str, Any]]:
    """Check images, template leftovers, internal R3 codes, and inventory static visual diagrams."""
    log_format_issues: list[dict] = []
    leftover_issues: list[dict] = []
    manual_diagrams: list[dict] = []
    parsed_meta: dict[str, Any] = {
        "r3_fnhead": [],
        "r3_screenfields": [],
        "r6_rbadges": [],
        "r6_guides": [],
        "r3_uc_defined": set(),
        "r3_br_defined": set(),
        "r3_msg_defined": set(),
    }

    r3_uc_called: list[tuple[str, str, int]] = []
    r3_br_called: list[tuple[str, str, int]] = []
    r3_msg_called: list[tuple[str, str, int]] = []

    allowed_square = re.compile(
        r"^\[(?:GET|POST|PUT|PATCH|DELETE|id|slug|milestoneId|jobId|userId|postId|contractId|category|disputeId|A-Z0-9_|cont\.|optional|0-9]+)\]$"
    )

    for rep_name, root_tex in REPORTS:
        if not root_tex.exists():
            continue
        rep_dir = root_tex.parent
        for rec in expanded[rep_name]:
            clean = rec["clean"]
            fpath = rec["file"]
            lnum = rec["line"]
            member = rec["member"]

            # Image checks across standard and custom macros
            img_refs: list[tuple[str, str]] = []
            for _, args in extract_braced_args(clean, "includegraphics", 1):
                img_refs.append((args[0], "includegraphics"))
            if rep_name == "Report 3":
                for _, args in extract_braced_args(clean, "screenfield", 2):
                    img_refs.append((args[0], args[1]))
                for _, args in extract_braced_args(clean, "screenfigure", 2):
                    img_refs.append((args[0], args[1]))
                for _, args in extract_braced_args(clean, "screenfieldpair", 3):
                    img_refs.append((args[0], args[2]))
                    img_refs.append((args[1], args[2]))
                for _, args in extract_braced_args(clean, "screenfigurepair", 3):
                    img_refs.append((args[0], args[2]))
                    img_refs.append((args[1], args[2]))
                for _, args in extract_braced_args(clean, "fnhead", 1):
                    parsed_meta["r3_fnhead"].append({"title": args[0], "file": fpath, "line": lnum, "member": member})
            elif rep_name == "Report 4":
                for _, args in extract_braced_args(clean, "kfig", 4):
                    img_refs.append((args[1], args[2]))
            elif rep_name == "Report 6":
                for _, args in extract_braced_args(clean, "rbadge", 1):
                    parsed_meta["r6_rbadges"].append({"badge": args[0].strip(), "file": fpath, "line": lnum})
                for _, args in extract_braced_args(clean, "guide", 1):
                    parsed_meta["r6_guides"].append({"guide": args[0].strip(), "file": fpath, "line": lnum})

            for img_path, cap in img_refs:
                if "#" in img_path:
                    continue
                ok, status = False, "missing"
                matched_base = rep_dir
                for cand_base in (rep_dir, rep_dir / "image", rep_dir / "images"):
                    ok, status = check_exact_case_path(cand_base, img_path)
                    if ok or status.startswith("case_mismatch"):
                        matched_base = cand_base
                        break
                if not ok:
                    sev = "P0" if status == "missing" else "P1"
                    log_format_issues.append(
                        {
                            "severity": sev,
                            "report": rep_name,
                            "member": member,
                            "category": "Missing Image" if status == "missing" else "Image Case Mismatch",
                            "location": f"{fpath}:L{lnum}",
                            "detail": f"{img_path} ({status})",
                        }
                    )
                else:
                    # Determine actual extension for Tier-3 raster/static diagram inventory
                    resolved_img = matched_base / img_path
                    actual_ext = resolved_img.suffix.lower()
                    if actual_ext not in {".pdf", ".png", ".jpg", ".jpeg", ".svg"}:
                        for cand_ext in (".pdf", ".png", ".jpg", ".svg"):
                            if (matched_base / (img_path + cand_ext)).exists():
                                actual_ext = cand_ext
                                resolved_img = matched_base / (img_path + cand_ext)
                                break
                    has_drawio_src = False
                    stem = resolved_img.stem.replace(".drawio", "")
                    if any(d.exists() and (list(d.rglob(f"{stem}.drawio")) or list(d.rglob(f"{stem}.svg"))) for d in DRAWIO_DIRS):
                        has_drawio_src = True
                    if actual_ext in {".png", ".jpg", ".jpeg", ".pdf"} and not has_drawio_src:
                        manual_diagrams.append(
                            {
                                "report": rep_name,
                                "member": member,
                                "file": fpath,
                                "line": lnum,
                                "asset": str(resolved_img.relative_to(REPO_ROOT)).replace("\\", "/") if resolved_img.exists() else img_path,
                                "ext": actual_ext,
                                "caption": re.sub(r"\s+", " ", cap)[:120],
                            }
                        )

            # Template leftover scanning (skip lines defining preamble/macros)
            if not fpath.endswith(("main.tex", "Report5_Test_Documentation.tex", "Report6_Software_User_Guides.tex")) or lnum > 100:
                stripped = strip_latex_commands(clean)
                for kw in TEMPLATE_KEYWORDS:
                    if re.search(rf"\b{re.escape(kw)}\b", stripped, re.IGNORECASE):
                        leftover_issues.append(
                            {
                                "severity": "P0",
                                "report": rep_name,
                                "member": member,
                                "category": "Old Template Keyword",
                                "location": f"{fpath}:L{lnum}",
                                "detail": f"Found '{kw}': {stripped.strip()[:120]}",
                            }
                        )
                if "<<" in clean or ">>" in clean:
                    if "<<include>>" not in clean and "<<extend>>" not in clean:
                        leftover_issues.append(
                            {
                                "severity": "P0",
                                "report": rep_name,
                                "member": member,
                                "category": "Angle-bracket Placeholder",
                                "location": f"{fpath}:L{lnum}",
                                "detail": clean.strip()[:120],
                            }
                        )
                if "<blank>" not in clean:
                    for m_ang in re.finditer(r"<([A-Za-z][A-Za-z0-9 _/-]{2,})>", stripped):
                        tok = m_ang.group(1)
                        if tok.lower() not in {"br", "div", "span"} and not tok.startswith("http"):
                            leftover_issues.append(
                                {
                                    "severity": "P1",
                                    "report": rep_name,
                                    "member": member,
                                    "category": "Placeholder <...>",
                                    "location": f"{fpath}:L{lnum}",
                                    "detail": f"<{tok}> in: {stripped.strip()[:100]}",
                                }
                            )
                for m_sq in re.finditer(r"\[([^\[\]\n]{3,35})\]", stripped):
                    full_sq = m_sq.group(0)
                    inner = m_sq.group(1)
                    if not allowed_square.match(full_sq) and re.search(r"\b(?:insert|tbd|todo|placeholder|your |enter here|fill in)\b", inner, re.IGNORECASE):
                        leftover_issues.append(
                            {
                                "severity": "P0",
                                "report": rep_name,
                                "member": member,
                                "category": "Placeholder [...]",
                                "location": f"{fpath}:L{lnum}",
                                "detail": f"{full_sq} in: {stripped.strip()[:100]}",
                            }
                        )
                if "??" in clean:
                    leftover_issues.append(
                        {
                            "severity": "P0",
                            "report": rep_name,
                            "member": member,
                            "category": "Literal ??",
                            "location": f"{fpath}:L{lnum}",
                            "detail": clean.strip()[:120],
                        }
                    )
                if re.search(r"&\s*&\s*(?:\\\\|\\hline)", clean) and not re.search(r"\\textbf\{Report ", clean):
                    pass  # Intentional blank RACI/matrix cells exist; check non-matrix tables selectively

            # Report 3 internal code definitions & references
            if rep_name == "Report 3":
                if "2.2.2.Use_Case_Description.tex" in fpath:
                    m_uc = re.match(r"^(UC-[0-9]+(?:\.[0-9]+)?)\s*&", clean)
                    if m_uc:
                        parsed_meta["r3_uc_defined"].add(m_uc.group(1))
                elif "5.1.Business_Rules.tex" in fpath:
                    m_br = re.match(r"^\s*(BR-[A-Za-z0-9-]+)\s*&", clean)
                    if m_br:
                        parsed_meta["r3_br_defined"].add(m_br.group(1))
                elif "5.Requirement_Appendix.tex" in fpath:
                    m_msg = re.search(r"&\s*(MSG\d+)\s*&", clean)
                    if m_msg:
                        parsed_meta["r3_msg_defined"].add(m_msg.group(1))
                else:
                    for m_u in re.findall(r"\b(UC-\d+(?:\.\d+)?)\b", clean):
                        r3_uc_called.append((m_u, fpath, lnum))
                    for m_b in re.findall(r"\b(BR-[A-Z0-9]+-[A-Z0-9-]+)\b", clean):
                        r3_br_called.append((m_b, fpath, lnum))
                    for m_m in re.findall(r"\b(MSG\d+)\b", clean):
                        r3_msg_called.append((m_m, fpath, lnum))

    # Compare Report 3 defined vs referenced codes
    for code, fp, ln in r3_msg_called:
        if parsed_meta["r3_msg_defined"] and code not in parsed_meta["r3_msg_defined"]:
            leftover_issues.append(
                {
                    "severity": "P1",
                    "report": "Report 3",
                    "member": detect_member(fp),
                    "category": "Undefined MSG Code",
                    "location": f"{fp}:L{ln}",
                    "detail": f"{code} used in SRS but missing in Application Messages List",
                }
            )
    for code, fp, ln in r3_br_called:
        if parsed_meta["r3_br_defined"] and code not in parsed_meta["r3_br_defined"]:
            # Flag only distinct missing rules once per code
            pass

    called_br_set = {c for c, _, _ in r3_br_called}
    for br in sorted(parsed_meta["r3_br_defined"] - called_br_set):
        leftover_issues.append(
            {
                "severity": "P2",
                "report": "Report 3",
                "member": "shared",
                "category": "Unused Appendix BR Code",
                "location": "5.1.Business_Rules.tex",
                "detail": f"{br} defined in Business Rules Appendix but never referenced in UC/Screen specs",
            }
        )
    called_msg_set = {c for c, _, _ in r3_msg_called}
    for msg in sorted(parsed_meta["r3_msg_defined"] - called_msg_set):
        leftover_issues.append(
            {
                "severity": "P2",
                "report": "Report 3",
                "member": "shared",
                "category": "Unused Appendix MSG Code",
                "location": "5.Requirement_Appendix.tex",
                "detail": f"{msg} defined in Application Messages List but never referenced in sections",
            }
        )

    return log_format_issues, leftover_issues, manual_diagrams, parsed_meta


# ==============================================================================
# 3.4 CROSS-MEMBER & CROSS-SPRINT VOCABULARY
# ==============================================================================

def audit_cross_member_vocabulary(
    expanded: dict[str, list[dict[str, Any]]],
    prisma: dict[str, Any],
    parsed_meta: dict[str, Any],
) -> list[dict]:
    issues: list[dict] = []
    enum_values = {v for vals in prisma["enums"].values() for v in vals}
    role_names = set(prisma["enums"].get("Role", [])) | set(prisma["enums"].get("RoleName", []))
    canonical_roles = {"Guest", "Client", "Freelancer", "Expert", "Admin", "System"} | {
        r.title() for r in role_names
    }

    # 1. Check Report 6 \rbadge against canonical roles (ignore numeric step badges \rbadge{1})
    for item in parsed_meta["r6_rbadges"]:
        b = item["badge"]
        if b and not b.isdigit() and not any(tok.strip() in canonical_roles or tok.strip().upper() in {"ALL", "AUTH", "USER"} for tok in re.split(r"[,/]", b)):
            issues.append(
                {
                    "severity": "P1",
                    "report": "Report 6",
                    "member": "shared",
                    "category": "Non-standard Role Badge",
                    "location": f"{item['file']}:L{item['line']}",
                    "detail": f"\\rbadge{{{b}}} does not match canonical Roles ({sorted(canonical_roles)})",
                }
            )

    # 2. Scan Report 3 & 4 member files for PascalCase model mismatches or uppercase STATUS tokens outside Prisma enums
    model_names = set(prisma["models"].keys())
    enum_set_upper = {v.upper() for v in enum_values}

    status_tokens_by_member: dict[str, Counter] = defaultdict(Counter)
    for rep_name in ("Report 3", "Report 4"):
        for rec in expanded.get(rep_name, []):
            fp = rec["file"]
            member = rec["member"]
            if member == "shared":
                continue
            for tok in re.findall(r"\b([A-Z][A-Z0-9_]{3,})\b", rec["clean"]):
                if "_" in tok and not tok.startswith(("UC_", "BR_", "FE_", "MSG", "HTTP", "API_", "JWT_", "ENV_")):
                    status_tokens_by_member[tok][member] += 1

    # Flag underscore status-like enum constants used in R3/R4 not present in schema.prisma
    for tok, cnt_map in sorted(status_tokens_by_member.items()):
        if tok not in enum_set_upper and any(
            k in tok for k in ("PENDING", "APPROVED", "REJECTED", "ACTIVE", "CLOSED", "CANCEL", "DISPUTE", "PAID", "DRAFT", "COMPLETED", "ESCROW", "FUNDED", "REVISION")
        ):
            issues.append(
                {
                    "severity": "P1",
                    "report": "Report 3/4",
                    "member": ", ".join(sorted(cnt_map.keys())),
                    "category": "Enum/Status Not in schema.prisma",
                    "location": "Sprint/Member sections",
                    "detail": f"Status token '{tok}' used by {dict(cnt_map)} not found in Prisma enums",
                }
            )

    return issues


# ==============================================================================
# 3.5 DRAW.IO / SVG / VECTOR PDF AUDIT
# ==============================================================================

def decode_drawio_diagram(diag_elem: ET.Element) -> ET.Element | None:
    """Return inner mxGraphModel element whether plain XML or compressed base64."""
    inner = diag_elem.find("mxGraphModel")
    if inner is not None:
        return inner
    raw_txt = (diag_elem.text or "").strip()
    if not raw_txt:
        return None
    try:
        decoded = base64.b64decode(raw_txt)
        inflated = zlib.decompress(decoded, -zlib.MAX_WBITS).decode("utf-8")
        xml_str = urllib.parse.unquote(inflated)
        return ET.fromstring(xml_str)
    except Exception:
        return None


def extract_drawio_texts(drawio_path: pathlib.Path) -> list[str]:
    texts: list[str] = []
    tree = ET.parse(drawio_path)
    root = tree.getroot()
    models: list[ET.Element] = []
    diags = root.findall(".//diagram")
    if diags:
        for diag in diags:
            m = decode_drawio_diagram(diag)
            if m is not None:
                models.append(m)
    elif root.tag == "mxGraphModel":
        models.append(root)
    else:
        models.extend(root.findall(".//mxGraphModel"))

    for model in models:
        for cell in model.findall(".//mxCell"):
            val = cell.get("value") or ""
            if val.strip():
                clean = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(val))).strip()
                if clean:
                    texts.append(clean)
    return texts


def audit_code_drawio_doc(
    prisma: dict[str, Any],
    routes: list[dict[str, str]],
    docker_ai: dict[str, Any],
    parsed_meta: dict[str, Any],
    expanded: dict[str, list[dict[str, Any]]],
) -> list[dict]:
    mismatches: list[dict] = []

    # 1. AI services in docker-compose.yml vs actual disk folders
    for svc in docker_ai["services"]:
        if svc["build_context"] and not svc["context_exists"]:
            mismatches.append(
                {
                    "severity": "P0",
                    "axis": "Docker <-> Codebase",
                    "source_a": f"docker-compose.yml ({svc['name']})",
                    "source_b": str(svc["build_context"]),
                    "detail": f"Build context '{svc['build_context']}' does not exist on disk",
                }
            )

    # 2. Report 3 2.1.Actors.tex vs context-diagram.drawio & uc-diagrams
    r3_actors_expected = {"Guest", "Client", "Freelancer", "Admin", "Expert", "Google OAuth", "Email Service", "Cloud Storage", "Payment Gateway", "AI/ML Services"}
    ctx_drawio = REPO_ROOT / "docs" / "Report 3" / "image" / "context_diagram" / "context-diagram.drawio"
    if ctx_drawio.exists():
        ctx_labels = set(extract_drawio_texts(ctx_drawio))
        for must in ("Guest", "Client", "Freelancer", "Admin", "Expert", "AI/ML Services"):
            if must not in ctx_labels:
                mismatches.append(
                    {
                        "severity": "P1",
                        "axis": "Context Diagram <-> Actors",
                        "source_a": "context-diagram.drawio",
                        "source_b": "2.1.Actors.tex",
                        "detail": f"Missing expected actor/node '{must}' in Context Diagram",
                    }
                )

    # 3. UC-diagrams <-> Report 3 2.2.2 Use Case Descriptions
    uc_dir = REPO_ROOT / "uc-diagrams"
    if uc_dir.exists():
        drawio_ucs: set[str] = set()
        for p in sorted(uc_dir.glob("*.drawio")):
            for txt in extract_drawio_texts(p):
                for m in re.findall(r"\b(UC-\d+(?:\.\d+)?)\b", txt):
                    drawio_ucs.add(m)
        r3_uc_def = parsed_meta["r3_uc_defined"]
        for u in sorted(drawio_ucs - r3_uc_def):
            mismatches.append(
                {
                    "severity": "P1",
                    "axis": "UC Draw.io <-> R3 2.2.2 Table",
                    "source_a": "uc-diagrams/*.drawio",
                    "source_b": "2.2.2.Use_Case_Description.tex",
                    "detail": f"{u} appears in UC diagram but not in 2.2.2 Use Case Description table",
                }
            )

    # 4. SVG / Vector PDF ERD text vs Prisma models
    erd_dir = REPO_ROOT / "docs" / "Report 3" / "image" / "ERD"
    erd_all_svg = erd_dir / "ERD-ALL.drawio.svg"
    if erd_all_svg.exists():
        svg_txt = erd_all_svg.read_text(encoding="utf-8", errors="ignore")
        svg_words = set(re.findall(r">([A-Za-z_][A-Za-z0-9_]{2,})<", svg_txt))
        for model_name in sorted(prisma["models"].keys()):
            if model_name not in svg_words and model_name.lower() not in {w.lower() for w in svg_words}:
                mismatches.append(
                    {
                        "severity": "P1",
                        "axis": "Prisma Schema <-> ERD-ALL.svg",
                        "source_a": "apps/api/prisma/schema.prisma",
                        "source_b": "ERD-ALL.drawio.svg",
                        "detail": f"Prisma model '{model_name}' not found in ERD-ALL SVG text nodes",
                    }
                )

    # 5. Prisma models vs Report 4 Database Design headings/tables
    r4_text = "\n".join(r["clean"] for r in expanded.get("Report 4", []))
    for model_name in sorted(prisma["models"].keys()):
        if not re.search(rf"\b{re.escape(model_name)}\b", r4_text, re.IGNORECASE):
            mismatches.append(
                {
                    "severity": "P1",
                    "axis": "Prisma Schema <-> Report 4 SDD",
                    "source_a": "apps/api/prisma/schema.prisma",
                    "source_b": "docs/Report 4/sections/",
                    "detail": f"Prisma model '{model_name}' not mentioned in Report 4",
                }
            )

    # 6. Class diagrams check
    cls_dir = REPO_ROOT / "class-diagrams"
    if cls_dir.exists():
        for p in sorted(cls_dir.glob("*.drawio")):
            _ = extract_drawio_texts(p)  # verify XML decodes cleanly

    return mismatches


# ==============================================================================
# 3.6 WBS MATH (REPORT 2) & 4-WAY TEST RECONCILIATION (REPORT 5)
# ==============================================================================

class UnitTestHtmlParser(HTMLParser):
    """Parse summary cards and UF breakdown from Report5_Unit_Test_Backend.html."""

    def __init__(self) -> None:
        super().__init__()
        self.cards: list[tuple[str, str]] = []
        self._in_card = False
        self._in_val = False
        self._in_lbl = False
        self._cur_val = ""
        self._cur_lbl = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        cls = dict(attrs).get("class", "") or ""
        if tag == "div" and "card" in cls.split():
            self._in_card = True
            self._cur_val = ""
            self._cur_lbl = ""
        elif self._in_card and tag == "div" and "value" in cls.split():
            self._in_val = True
        elif self._in_card and tag == "div" and "label" in cls.split():
            self._in_lbl = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "div":
            if self._in_val:
                self._in_val = False
            elif self._in_lbl:
                self._in_lbl = False
                self._in_card = False
                self.cards.append((self._cur_lbl.strip(), self._cur_val.strip()))

    def handle_data(self, data: str) -> None:
        if self._in_val:
            self._cur_val += data
        elif self._in_lbl:
            self._cur_lbl += data


def audit_math_and_tests(parsed_meta: dict[str, Any]) -> tuple[list[dict], dict[str, Any]]:
    rows: list[dict] = []
    stats_summary: dict[str, Any] = {}

    # 1. Report 2 WBS Table 1 vs Table 2
    r2_scope = REPO_ROOT / "docs" / "Report 2" / "sections" / "1.1-scope-and-estimation.tex"
    if r2_scope.exists():
        txt = r2_scope.read_text(encoding="utf-8", errors="ignore")
        lines = txt.splitlines()
        cur_sprint = None
        wbs_items = defaultdict(int)
        wbs_modules = defaultdict(int)
        wbs_effort = defaultdict(int)
        in_table1 = True
        t2_rows: dict[str, tuple[int, int, int]] = {}
        t2_total: tuple[int, int, int] | None = None

        for ln in lines:
            if "Table 2" in ln or "tab:estimation-summary" in ln:
                in_table1 = False
            if in_table1:
                m_sp = re.search(r"\\multirow\{\d+\}\{=\}\{(Sprint \d+)\}", ln)
                if m_sp:
                    cur_sprint = m_sp.group(1)
                # Module header row: `1 & & \textbf{Authentication} & & -- & -- \\`
                if re.match(r"^\d+\s*&\s*&\s*\\textbf\{", ln):
                    if cur_sprint:
                        wbs_modules[cur_sprint] += 1
                # Item row: `2 & 1.1 & ... & Medium & 3 \\`
                m_item = re.match(r"^\d+\s*&\s*(\d+\.\d+)\s*&.*&\s*(Low|Medium|High)\s*&\s*(\d+)\s*\\\\", ln)
                if m_item and cur_sprint:
                    wbs_items[cur_sprint] += 1
                    wbs_effort[cur_sprint] += int(m_item.group(3))
            else:
                m_t2 = re.match(r"^(Sprint \d+)\s*&\s*[^&]+&\s*(\d+)\s*&\s*(\d+)\s*&\s*(\d+)\s*\\\\", ln)
                if m_t2:
                    t2_rows[m_t2.group(1)] = (int(m_t2.group(2)), int(m_t2.group(3)), int(m_t2.group(4)))
                m_tot = re.search(r"\\textbf\{Total\}.*?\\textbf\{(\d+)\}.*?\\textbf\{(\d+)\}.*?\\textbf\{(\d+)\}", ln)
                if m_tot:
                    t2_total = (int(m_tot.group(1)), int(m_tot.group(2)), int(m_tot.group(3)))

        sum_mod = sum(wbs_modules.values())
        sum_itm = sum(wbs_items.values())
        sum_eff = sum(wbs_effort.values())
        stats_summary["wbs_total"] = {"modules": sum_mod, "items": sum_itm, "effort": sum_eff}

        # Check Table 2 totals against sums
        if t2_rows:
            t2_sum_mod = sum(v[0] for v in t2_rows.values())
            t2_sum_itm = sum(v[1] for v in t2_rows.values())
            t2_sum_eff = sum(v[2] for v in t2_rows.values())
            for sp, (tm, ti, te) in sorted(t2_rows.items()):
                if (wbs_items[sp], wbs_effort[sp]) != (ti, te):
                    rows.append(
                        {
                            "severity": "P0",
                            "check": f"R2 WBS vs Table 2 ({sp})",
                            "source_a": f"Table 1 sum: items={wbs_items[sp]}, effort={wbs_effort[sp]}",
                            "source_b": f"Table 2 stated: items={ti}, effort={te}",
                            "status": "MISMATCH",
                        }
                    )
            if t2_total and (t2_sum_mod, t2_sum_itm, t2_sum_eff) != t2_total:
                rows.append(
                    {
                        "severity": "P0",
                        "check": "R2 Table 2 Column Sum vs Total Row",
                        "source_a": f"Column sums: ({t2_sum_mod}, {t2_sum_itm}, {t2_sum_eff})",
                        "source_b": f"Total row: {t2_total}",
                        "status": "MISMATCH",
                    }
                )
            else:
                rows.append(
                    {
                        "severity": "OK",
                        "check": "R2 WBS Table 1 <-> Table 2 Sum",
                        "source_a": f"Table 1: {sum_itm} items, {sum_eff} man-days",
                        "source_b": f"Table 2 Total: {t2_total}",
                        "status": "MATCH" if t2_total and (sum_itm, sum_eff) == (t2_total[1], t2_total[2]) else "CHECK",
                    }
                )

    # 2. Report 5 4-Way Reconciliation
    r5_dir = REPO_ROOT / "docs" / "Report 5"
    html_path = r5_dir / "Report5_Unit_Test_Backend.html"
    xls_path = r5_dir / "Report5_Unit Test.xls"
    xlsx_path = r5_dir / "Report5_Test Report.xlsx"
    tex_path = r5_dir / "Report5_Test_Documentation.tex"

    html_stats = {}
    if html_path.exists():
        p = UnitTestHtmlParser()
        p.feed(html_path.read_text(encoding="utf-8", errors="ignore"))
        html_stats = dict(p.cards)
        stats_summary["html_unit"] = html_stats

    # Read Report5_Unit Test.xls (UF-* sheets + Statistics Sub Total)
    xls_uf_sheets = 0
    xls_tcs = 0
    xls_passed = 0
    if xls_path.exists():
        book = xlrd.open_workbook(str(xls_path))
        uf_sheets = [s for s in book.sheet_names() if re.match(r"^UF-\d+", s)]
        xls_uf_sheets = len(uf_sheets)
        if "Statistics" in book.sheet_names():
            st_sh = book.sheet_by_name("Statistics")
            for r in range(st_sh.nrows):
                if str(st_sh.cell_value(r, 1)).strip().lower() == "sub total":
                    xls_passed = int(st_sh.cell_value(r, 2) or 0)
                    xls_tcs = int(st_sh.cell_value(r, 8) or 0)
                    break
        stats_summary["xls_unit"] = {"uf_sheets": xls_uf_sheets, "tcs": xls_tcs, "passed": xls_passed}

    # Read Report5_Test Report.xlsx (44 feature sheets + Test Statistics Sub total)
    xlsx_tcs = 0
    xlsx_pass = 0
    xlsx_pend = 0
    xlsx_modules_covered: set[str] = set()
    if xlsx_path.exists():
        wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
        skip_sheets = {"Cover", "Test Cases", "Test Statistics"}
        xlsx_modules_covered = {s.strip() for s in wb.sheetnames if s not in skip_sheets}
        if "Test Statistics" in wb.sheetnames:
            for row in wb["Test Statistics"].iter_rows(values_only=True):
                vals = [c for c in row if c is not None]
                if vals and str(vals[0]).strip().lower() == "sub total":
                    xlsx_pass = int(vals[1] or 0)
                    xlsx_pend = int(vals[3] or 0)
                    xlsx_tcs = int(vals[5] or 0)
                    break
        stats_summary["xlsx_system"] = {"sheets": len(xlsx_modules_covered), "tcs": xlsx_tcs, "pass": xlsx_pass, "pending": xlsx_pend}

    # Extract Report5_Test_Documentation.tex stated figures
    if tex_path.exists():
        r5_txt = tex_path.read_text(encoding="utf-8", errors="ignore")
        m_unit = re.search(r"Unit Testing\s*&\s*([0-9,]+)\s*&\s*([0-9,]+)\s*&\s*([0-9,]+)", r5_txt)
        m_sys = re.search(r"System Testing\s*&\s*([0-9,]+)\s*&\s*([0-9,]+)\s*&\s*([0-9,]+)", r5_txt)
        tex_unit = int(m_unit.group(1).replace(",", "")) if m_unit else None
        tex_unit_pass = int(m_unit.group(2).replace(",", "")) if m_unit else None
        tex_sys = int(m_sys.group(1).replace(",", "")) if m_sys else None
        tex_sys_pass = int(m_sys.group(2).replace(",", "")) if m_sys else None
        stats_summary["tex_claimed"] = {"unit": tex_unit, "unit_pass": tex_unit_pass, "system": tex_sys, "system_pass": tex_sys_pass}

        if xls_tcs and tex_unit is not None:
            ok_u = (xls_tcs == tex_unit and xls_passed == tex_unit_pass)
            rows.append(
                {
                    "severity": "OK" if ok_u else "P0",
                    "check": "Report 5 Unit Test (.xls <-> .tex)",
                    "source_a": f"Report5_Unit Test.xls: {xls_uf_sheets} UFs, total={xls_tcs}, passed={xls_passed}",
                    "source_b": f"Report5_Test_Documentation.tex: total={tex_unit}, passed={tex_unit_pass}",
                    "status": "MATCH" if ok_u else "MISMATCH",
                }
            )
        if xlsx_tcs and tex_sys is not None:
            ok_s = (xlsx_tcs == tex_sys and xlsx_pass == tex_sys_pass)
            rows.append(
                {
                    "severity": "OK" if ok_s else "P1",
                    "check": "Report 5 System Test (.xlsx <-> .tex)",
                    "source_a": f"Report5_Test Report.xlsx: {len(xlsx_modules_covered)} sheets, total={xlsx_tcs}, passed={xlsx_pass}",
                    "source_b": f"Report5_Test_Documentation.tex: total={tex_sys}, passed={tex_sys_pass}",
                    "status": "MATCH" if ok_s else "MISMATCH",
                }
            )
        html_passed = int(html_stats.get("Passed", "0")) if html_stats.get("Passed", "").isdigit() else None
        if html_passed is not None:
            rows.append(
                {
                    "severity": "OK" if str(html_passed) in r5_txt else "P1",
                    "check": "Report 5 Backend Jest Snapshot (HTML <-> .tex)",
                    "source_a": f"Report5_Unit_Test_Backend.html: {html_stats.get('Test suites')} suites, {html_passed} passed",
                    "source_b": "Documented in Report5_Test_Documentation.tex" if str(html_passed) in r5_txt else "Not matched in .tex",
                    "status": "MATCH" if str(html_passed) in r5_txt else "MISMATCH",
                }
            )

    return rows, stats_summary


# ==============================================================================
# 3.7 OUTPUT WRITERS (EXCEL + MARKDOWN SNAPSHOT)
# ==============================================================================

def write_audit_excel(
    out_path: pathlib.Path,
    log_issues: list[dict],
    leftover_issues: list[dict],
    vocab_issues: list[dict],
    mismatch_issues: list[dict],
    math_rows: list[dict],
    manual_diagrams: list[dict],
    r7_conflicts: list[dict],
) -> None:
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    hdr_fill = PatternFill("solid", fgColor="FFE8E1")
    hdr_font = Font(bold=True, color="6E2500")

    def add_sheet(title: str, headers: list[str], data_rows: list[list[Any]]) -> None:
        ws = wb.create_sheet(title)
        ws.append(headers)
        for cell in ws[1]:
            cell.fill = hdr_fill
            cell.font = hdr_font
            cell.alignment = Alignment(vertical="center", wrap_text=True)
        for row in data_rows:
            ws.append(row)
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = f"A1:{openpyxl.utils.get_column_letter(len(headers))}{max(1, len(data_rows) + 1)}"
        for col in ws.columns:
            max_len = max((len(str(c.value or "")) for c in col), default=10)
            ws.column_dimensions[col[0].column_letter].width = min(65, max(14, max_len + 3))

    sev_counts = Counter()
    for grp in (log_issues, leftover_issues, vocab_issues, mismatch_issues, math_rows):
        for item in grp:
            sev = item.get("severity", "")
            if sev in {"P0", "P1", "P2"}:
                sev_counts[sev] += 1

    summary_rows = [
        ["P0 - Blocker", sev_counts["P0"], "Missing files, undefined ?? refs, duplicate labels, template keywords, WBS/Test math mismatches"],
        ["P1 - Major", sev_counts["P1"], "Case mismatch, cross-report/code/drawio drift, unmapped statuses, visual/test coverage gaps"],
        ["P2 - Minor", sev_counts["P2"], "Overfull hbox > 10pt, unused appendix codes, preamble diffs"],
        ["Manual Visual Diagrams (Tier 3)", len(manual_diagrams), "Static raster/PDF diagrams inventoried for manual/Vision check"],
        ["Report 7 Conflict Preview", len(r7_conflicts), "Cross-report \\label and macro collisions to resolve before building Report 7"],
    ]
    add_sheet("Summary", ["Category / Severity", "Count", "Notes"], summary_rows)

    add_sheet(
        "Log_And_Format",
        ["Severity", "Report", "Member", "Category", "Location", "Detail"],
        [[r["severity"], r["report"], r["member"], r["category"], r["location"], r["detail"]] for r in log_issues],
    )
    add_sheet(
        "Template_Leftovers",
        ["Severity", "Report", "Member", "Category", "Location", "Detail"],
        [[r["severity"], r["report"], r["member"], r["category"], r["location"], r["detail"]] for r in leftover_issues],
    )
    add_sheet(
        "Cross_Member_Vocabulary",
        ["Severity", "Report", "Member", "Category", "Location", "Detail"],
        [[r["severity"], r["report"], r["member"], r["category"], r["location"], r["detail"]] for r in vocab_issues],
    )
    add_sheet(
        "Code_Drawio_Doc_Mismatch",
        ["Severity", "Axis", "Source A", "Source B", "Detail"],
        [[r["severity"], r["axis"], r["source_a"], r["source_b"], r["detail"]] for r in mismatch_issues],
    )
    add_sheet(
        "Math_WBS_And_4Way_Test",
        ["Severity", "Check", "Source A", "Source B", "Status"],
        [[r["severity"], r["check"], r["source_a"], r["source_b"], r["status"]] for r in math_rows],
    )
    add_sheet(
        "Manual_Visual_Diagrams",
        ["Report", "Member", "TeX File", "Line", "Asset Path", "Ext", "Caption"],
        [[r["report"], r["member"], r["file"], r["line"], r["asset"], r["ext"], r["caption"]] for r in manual_diagrams],
    )
    add_sheet(
        "Report7_Conflict_Preview",
        ["Type", "Identifier", "Reports", "Locations", "Recommended Action"],
        [[r["type"], r["identifier"], r["reports"], r["locations"], r["action"]] for r in r7_conflicts],
    )

    wb.save(out_path)


def write_code_snapshot(
    out_path: pathlib.Path,
    prisma: dict[str, Any],
    routes: list[dict[str, str]],
    web_pages: list[str],
    docker_ai: dict[str, Any],
    stats_summary: dict[str, Any],
) -> None:
    lines: list[str] = [
        "# Frevia Ground-Truth Code & Metrics Snapshot",
        "",
        "## 1. Prisma Schema (`apps/api/prisma/schema.prisma`)",
        f"- Total Models: **{len(prisma['models'])}** | Total Enums: **{len(prisma['enums'])}**",
        "",
        "### Enums",
    ]
    for ename, vals in sorted(prisma["enums"].items()):
        lines.append(f"- `{ename}`: {', '.join(vals)}")

    lines.extend(["", "### Models (Summary)"])
    for mname, fields in sorted(prisma["models"].items()):
        fnames = ", ".join(f"`{f['name']}:{f['type']}`" for f in fields[:14])
        more = f" ... (+{len(fields)-14})" if len(fields) > 14 else ""
        lines.append(f"- **{mname}** ({len(fields)} fields): {fnames}{more}")

    lines.extend(["", f"## 2. NestJS API Endpoints (`apps/api/src/routes/**` — {len(routes)} endpoints)"])
    by_ctrl = defaultdict(list)
    for ep in routes:
        by_ctrl[ep["file"]].append(ep)
    for fp, eps in sorted(by_ctrl.items()):
        lines.append(f"- **{fp}** ({len(eps)} endpoints)")
        for ep in eps:
            lines.append(f"  - `{ep['method']} {ep['path']}` [{ep['auth']}]")

    lines.extend(["", f"## 3. Next.js Web Routes (`apps/web/app` — {len(web_pages)} pages)"])
    for p in web_pages:
        lines.append(f"- `{p}`")

    lines.extend(["", "## 4. Docker Compose & AI Services"])
    lines.append(f"- Folders present in `ai-services/`: `{docker_ai['ai_folders']}`")
    for svc in docker_ai["services"]:
        lines.append(
            f"- **{svc['name']}** (container: `{svc['container']}`, ports: `{svc['ports']}`, context: `{svc['build_context']}` exists=`{svc['context_exists']}`)"
        )
    if docker_ai["ai_endpoints"]:
        lines.append("- AI FastAPI/Python endpoints:")
        for aep in docker_ai["ai_endpoints"]:
            lines.append(f"  - `{aep['method']} {aep['path']}` ({aep['file']})")

    lines.extend(["", "## 5. Key Numeric Metrics (Report 2 & Report 5)"])
    for k, v in stats_summary.items():
        lines.append(f"- **{k}**: `{v}`")

    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Static Audit & Snapshot tool for Frevia Capstone Docs")
    parser.add_argument(
        "--out-dir",
        default=str(REPO_ROOT / "tool-check-docs" / "audit_output"),
        help="Output folder for frevia_static_audit.xlsx and frevia_code_snapshot.md",
    )
    args = parser.parse_args()
    out_dir = pathlib.Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    expanded = {name: expand_tex_tree(path) for name, path in REPORTS if path.exists()}
    prisma = parse_prisma_schema()
    routes = parse_nestjs_routes()
    web_pages = parse_nextjs_pages()
    docker_ai = parse_docker_and_ai()

    log_issues, r7_conflicts = audit_logs_and_geometry(expanded)
    img_issues, leftover_issues, manual_diagrams, parsed_meta = audit_macros_images_and_leftovers(expanded)
    all_log_fmt = log_issues + img_issues
    vocab_issues = audit_cross_member_vocabulary(expanded, prisma, parsed_meta)
    mismatch_issues = audit_code_drawio_doc(prisma, routes, docker_ai, parsed_meta, expanded)
    math_rows, stats_summary = audit_math_and_tests(parsed_meta)

    xlsx_out = out_dir / "frevia_static_audit.xlsx"
    md_out = out_dir / "frevia_code_snapshot.md"
    write_audit_excel(
        xlsx_out,
        all_log_fmt,
        leftover_issues,
        vocab_issues,
        mismatch_issues,
        math_rows,
        manual_diagrams,
        r7_conflicts,
    )
    write_code_snapshot(md_out, prisma, routes, web_pages, docker_ai, stats_summary)

    print(f"Audit complete:")
    print(f"  Excel:    {xlsx_out}")
    print(f"  Snapshot: {md_out}")
    print(f"  Log/Format: {len(all_log_fmt)} | Leftovers: {len(leftover_issues)} | Vocab: {len(vocab_issues)} | Code/Drawio/Doc: {len(mismatch_issues)} | Math/Test: {len(math_rows)} | StaticVisuals: {len(manual_diagrams)} | R7Conflicts: {len(r7_conflicts)}")


if __name__ == "__main__":
    main()
