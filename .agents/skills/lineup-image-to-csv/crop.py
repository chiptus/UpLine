#!/usr/bin/env python3
"""Crop region(s) out of a poster image, optionally compositing them
side by side, for close reading at zoom.

Usage:
  crop.py --image IMG --box L,T,R,B [--box L,T,R,B ...] --out OUT [--scale N]

Multiple --box args are cropped independently, then pasted left to right
into one output image (e.g. pairing a ruler crop with a stage-column crop
so times and boxes read together). --scale resizes the result by an
integer factor with nearest-neighbor sampling, which keeps gridlines and
borders sharp instead of blurring them.
"""
import argparse

from PIL import Image


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument(
        "--box", action="append", required=True, help="left,top,right,bottom (pixels)"
    )
    parser.add_argument("--out", required=True)
    parser.add_argument("--scale", type=int, default=1)
    args = parser.parse_args()

    src = Image.open(args.image)
    crops = [src.crop(tuple(int(v) for v in box.split(","))) for box in args.box]

    width = sum(c.width for c in crops)
    height = max(c.height for c in crops)
    composite = Image.new(crops[0].mode, (width, height))
    x = 0
    for c in crops:
        composite.paste(c, (x, 0))
        x += c.width

    if args.scale > 1:
        composite = composite.resize(
            (composite.width * args.scale, composite.height * args.scale),
            Image.NEAREST,
        )

    composite.save(args.out)
    print(f"{args.out}: {composite.width}x{composite.height}")


if __name__ == "__main__":
    main()
