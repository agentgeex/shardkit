#!/usr/bin/env python3
"""
图标撞图检测（批量 logo / 头像 / 图标查重）
======================================================

用途：一批图标生成后，检查「混排在同一屏里是否分得清」。
不是查「全库唯一」，而是查「同一屏内是否撞车」。

判据（三条，任一命中 = bad）
--------------------------
  1. md5 相同                          → 直接照抄
  2. 形状撞车   灰度 MAE < 12           → 几乎同一个形
  3. 同形近色   MAE < 20 且 色距 < 60   → 换个颜色想蒙过去

  MAE   = 两张 64×64 灰度图的平均绝对误差（0 = 完全相同）
  色距  = 主色 RGB 欧氏距离（0 = 同色，最大约 441）

用法
----
  # 一个目录 / 一组文件 = 「同一屏」，全交叉比对
  python3 detect_collision.py ./icons

  # 多个屏分开算（各自全交叉，屏之间不比）
  python3 detect_collision.py --scope "列表页=./a.png,./b.png" --scope "详情页=./c.png,./d.png"

  # 调阈值 / 机器可读
  python3 detect_collision.py ./icons --mae-hard 10 --json

退出码
------
  0 = 无 bad（warn 允许）   1 = 存在 bad   2 = 用法错误 / 无可读图片

依赖：numpy, Pillow
"""

from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import os
import sys
from collections import Counter, defaultdict

try:
    import numpy as np
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit("缺少依赖：pip install numpy pillow")

EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
# 超大图先缩，避免 4K 素材吃内存（不改判据：判据本就在缩略图上算）
IMG_MAX = 1024


# ───────────────────────────── 采集 ─────────────────────────────
def collect(paths: list[str]) -> list[str]:
    """把文件 / 目录展开为图片路径列表（去重、排序，保证输出稳定）。"""
    out: list[str] = []
    for p in paths:
        if os.path.isdir(p):
            for root, _dirs, names in os.walk(p):
                for n in names:
                    if os.path.splitext(n)[1].lower() in EXTS:
                        out.append(os.path.join(root, n))
        elif os.path.isfile(p):
            if os.path.splitext(p)[1].lower() in EXTS:
                out.append(p)
            else:
                print(f"[skip] 不是图片：{p}", file=sys.stderr)
        else:
            print(f"[skip] 路径不存在：{p}", file=sys.stderr)
    return sorted(set(out))


# ───────────────────────────── 指纹 ─────────────────────────────
def signature(path: str, thumb: int, ink: int) -> dict:
    """返回 {md5, gray, color}：gray=灰度缩略图，color=主色(非白像素众数簇均值)。"""
    with open(path, "rb") as f:
        md5 = hashlib.md5(f.read()).hexdigest()

    im = Image.open(path)
    # 透明底必须先合成到白底：否则 convert("RGB") 会把透明像素当黑色，
    # 「非白即墨」判断全乱（图标资源绝大多数是透明底，这一步不能省）
    if im.mode in ("RGBA", "LA") or "transparency" in im.info:
        im = im.convert("RGBA")
        canvas = Image.new("RGBA", im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(canvas, im)
    im = im.convert("RGB")
    if max(im.size) > IMG_MAX:
        im.thumbnail((IMG_MAX, IMG_MAX), Image.LANCZOS)

    gray = np.asarray(
        im.convert("L").resize((thumb, thumb), Image.LANCZOS), dtype=np.float32
    )

    rgb = np.asarray(im, dtype=np.int16)
    mask = rgb.min(axis=2) < ink          # 「非白即墨」：接近纯白的算背景
    if mask.sum() == 0:                   # 全白图（空图/纯底板）
        return {"md5": md5, "gray": gray, "color": (255, 255, 255)}

    pix = rgb[mask]
    q = (pix // 32) * 32                  # 粗量化后按簇计票
    uq, cnt = np.unique(q, axis=0, return_counts=True)
    mode_q = uq[cnt.argmax()]
    near = np.abs(q - mode_q).sum(axis=1) <= 32
    color = tuple(int(v) for v in pix[near].mean(axis=0))   # 主色取该簇真实均值
    return {"md5": md5, "gray": gray, "color": color}


# ───────────────────────────── 判定 ─────────────────────────────
def compare(a: dict, b: dict, th_hard: float, th_soft: float, th_color: float):
    """返回 (verdict, reason, mae, cdist)；verdict ∈ ok / warn / bad。"""
    if a["md5"] == b["md5"]:
        return "bad", "完全相同（md5 一致）", 0.0, 0.0

    mae = float(np.abs(a["gray"] - b["gray"]).mean())
    cdist = float(np.sqrt(sum((x - y) ** 2 for x, y in zip(a["color"], b["color"]))))

    if mae < th_hard:
        return "bad", f"形状撞车 MAE={mae:.2f}", mae, cdist
    if mae < th_soft and cdist < th_color:
        return "bad", f"同形近色 MAE={mae:.2f} 色距={cdist:.0f}", mae, cdist
    if mae < th_soft:
        return "warn", f"形状像但色差大 MAE={mae:.2f} 色距={cdist:.0f}", mae, cdist
    return "ok", "", mae, cdist


# ───────────────────────────── 主流程 ─────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser(
        description="图标撞图检测：同一屏内两两比对灰度形状 + 主色",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='示例：python3 detect_collision.py ./icons --scope "列表页=./a.png,./b.png"',
    )
    ap.add_argument("paths", nargs="*", help="图片或目录（视为同一屏）")
    ap.add_argument(
        "--scope",
        action="append",
        default=[],
        metavar="名称=路径1,路径2",
        help="按屏分组，可重复；给了 --scope 时位置参数被忽略",
    )
    ap.add_argument("--mae-hard", type=float, default=12.0, help="形状撞车阈值（默认 12）")
    ap.add_argument("--mae-soft", type=float, default=20.0, help="形状相似阈值（默认 20）")
    ap.add_argument("--color", type=float, default=60.0, help="主色距离阈值（默认 60）")
    ap.add_argument("--thumb", type=int, default=64, help="比对缩略边长（默认 64）")
    ap.add_argument("--ink", type=int, default=235, help="墨色判定：RGB 最小值 < 此值（默认 235）")
    ap.add_argument("--top", type=int, default=10, help="『先改哪张』榜单条数（默认 10）")
    ap.add_argument("--json", action="store_true", help="输出 JSON（供 CI 消费）")
    args = ap.parse_args()

    # 组装比对范围
    scopes: dict[str, list[str]] = {}
    if args.scope:
        for spec in args.scope:
            if "=" not in spec:
                print(f"[错误] --scope 需要 名称=路径,... 形式：{spec}", file=sys.stderr)
                return 2
            name, raw = spec.split("=", 1)
            scopes[name.strip()] = collect([p.strip() for p in raw.split(",") if p.strip()])
    else:
        if not args.paths:
            ap.print_help()
            return 2
        scopes["default"] = collect(args.paths)

    total_files = sum(len(v) for v in scopes.values())
    if total_files == 0:
        print("没有可读图片（检查路径与扩展名）", file=sys.stderr)
        return 2

    # 一次读入，避免跨屏重复计算
    sigs: dict[str, dict] = {}
    for files in scopes.values():
        for f in files:
            if f in sigs:
                continue
            try:
                sigs[f] = signature(f, args.thumb, args.ink)
            except Exception as exc:                       # 损坏 / 不可解码
                print(f"[skip] 读取失败 {f}: {exc}", file=sys.stderr)

    pairs: list[dict] = []
    involve: Counter = Counter()          # 卷入 bad 的次数（用于「先改哪张」）
    warn_involve: Counter = Counter()

    for scope_name, files in scopes.items():
        usable = [f for f in files if f in sigs]
        for a, b in itertools.combinations(usable, 2):
            verdict, reason, mae, cdist = compare(
                sigs[a], sigs[b], args.mae_hard, args.mae_soft, args.color
            )
            if verdict == "ok":
                continue
            pairs.append(
                {
                    "scope": scope_name,
                    "a": a,
                    "b": b,
                    "verdict": verdict,
                    "reason": reason,
                    "mae": round(mae, 2),
                    "color_dist": round(cdist, 1),
                }
            )
            if verdict == "bad":
                involve[a] += 1
                involve[b] += 1
            else:
                warn_involve[a] += 1
                warn_involve[b] += 1

    bad = [p for p in pairs if p["verdict"] == "bad"]
    warn = [p for p in pairs if p["verdict"] == "warn"]
    worst = sorted(bad, key=lambda p: (p["mae"], p["color_dist"]))

    if args.json:
        print(
            json.dumps(
                {
                    "thresholds": {
                        "mae_hard": args.mae_hard,
                        "mae_soft": args.mae_soft,
                        "color": args.color,
                    },
                    "scopes": {k: len(v) for k, v in scopes.items()},
                    "bad": len(bad),
                    "warn": len(warn),
                    "pairs": pairs,
                    "hotspots": [
                        {"file": f, "bad_hits": c, "warn_hits": warn_involve[f]}
                        for f, c in involve.most_common(args.top)
                    ],
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0 if not bad else 1

    # ── 人类可读输出 ──
    print(f"检测 {total_files} 张图片，{len(scopes)} 个作用域：")
    for name, files in scopes.items():
        print(f"  · {name}：{len(files)} 张")
    print()

    if not pairs:
        print("✅ 无撞车：所有两两组合均通过（MAE ≥ %.0f 或色差足够）" % args.mae_soft)
        print("\nALL PASS")
        return 0

    print(f"{'判定':<5} {'MAE':>7} {'色距':>6}  说明 · 两张图")
    print("-" * 96)
    for p in worst:
        print(
            f"{p['verdict'].upper():<5} {p['mae']:>7.2f} {p['color_dist']:>6.0f}  "
            f"{p['reason']} · {os.path.basename(p['a'])} × {os.path.basename(p['b'])}"
        )
    for p in warn:
        print(
            f"{p['verdict'].upper():<5} {p['mae']:>7.2f} {p['color_dist']:>6.0f}  "
            f"{p['reason']} · {os.path.basename(p['a'])} × {os.path.basename(p['b'])}"
        )

    if involve:
        print(f"\n★ 优先改这几张（卷入 bad 次数降序，改一张能消掉多条）：")
        for f, c in involve.most_common(args.top):
            print(f"  {c:>2} 次  {f}")

    print(f"\n结果：bad={len(bad)}  warn={len(warn)}")
    print("ALL PASS" if not bad else "SOME FAIL")
    return 0 if not bad else 1


if __name__ == "__main__":
    sys.exit(main())
