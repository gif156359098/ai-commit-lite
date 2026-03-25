from __future__ import annotations

import math
import struct
import time
import zlib
from pathlib import Path


UNITS_PER_EM = 300
ADVANCE_WIDTH = 300
GLYPH_CODEPOINT = 0xE001
FONT_FAMILY = 'AI Commit Lite Icons'
POSTSCRIPT_NAME = 'AICommitLiteIcons-Regular'
VIEWBOX_SIZE = 16.0

# Derived from resources/*/generate-commit.svg.
SOURCE_CONTOURS = [
    [
        (8.0, 1.5),
        (9.3, 5.1),
        (12.9, 6.4),
        (9.3, 7.7),
        (8.0, 11.3),
        (6.7, 7.7),
        (3.1, 6.4),
        (6.7, 5.1),
    ],
    [
        (11.8, 9.6),
        (12.45, 11.35),
        (14.2, 12.0),
        (12.45, 12.65),
        (11.8, 14.4),
        (11.15, 12.65),
        (9.4, 12.0),
        (11.15, 11.35),
    ],
]


def pad4(data: bytes) -> bytes:
    return data + (b'\0' * ((4 - (len(data) % 4)) % 4))


def to_longdatetime(timestamp: float) -> int:
    return int(timestamp) + 2082844800


def calc_checksum(data: bytes) -> int:
    padded = pad4(data)
    total = 0
    for index in range(0, len(padded), 4):
        total = (total + struct.unpack('>I', padded[index:index + 4])[0]) & 0xFFFFFFFF
    return total


def build_simple_glyph(contours: list[list[tuple[int, int]]]) -> bytes:
    points = [point for contour in contours for point in contour]
    x_values = [point[0] for point in points]
    y_values = [point[1] for point in points]
    x_min = min(x_values)
    y_min = min(y_values)
    x_max = max(x_values)
    y_max = max(y_values)

    end_points = []
    point_count = 0
    for contour in contours:
        point_count += len(contour)
        end_points.append(point_count - 1)

    glyph = bytearray()
    glyph.extend(
        struct.pack(
            '>hhhhh',
            len(contours),
            x_min,
            y_min,
            x_max,
            y_max,
        )
    )
    glyph.extend(struct.pack(f'>{len(end_points)}H', *end_points))
    glyph.extend(struct.pack('>H', 0))

    flags = bytearray()
    x_bytes = bytearray()
    y_bytes = bytearray()
    previous_x = 0
    previous_y = 0

    for x, y in points:
        flags.append(0x01)
        x_bytes.extend(struct.pack('>h', x - previous_x))
        y_bytes.extend(struct.pack('>h', y - previous_y))
        previous_x = x
        previous_y = y

    glyph.extend(flags)
    glyph.extend(x_bytes)
    glyph.extend(y_bytes)

    if len(glyph) % 2 != 0:
        glyph.append(0)

    return bytes(glyph)


def transform_contours() -> list[list[tuple[int, int]]]:
    scale = UNITS_PER_EM / VIEWBOX_SIZE
    transformed = []
    for contour in SOURCE_CONTOURS:
        transformed_contour = []
        for x_value, y_value in contour:
            x = round(x_value * scale)
            y = round((VIEWBOX_SIZE - y_value) * scale)
            transformed_contour.append((x, y))
        transformed.append(transformed_contour)
    return transformed


def build_glyf_and_loca() -> tuple[bytes, bytes, dict[str, int]]:
    glyphs = [
        struct.pack('>hhhhh', 0, 0, 0, 0, 0),
        build_simple_glyph(transform_contours()),
    ]

    offsets = []
    glyf = bytearray()
    for glyph in glyphs:
        offsets.append(len(glyf))
        glyf.extend(glyph)
        if len(glyf) % 2 != 0:
            glyf.append(0)
    offsets.append(len(glyf))

    loca = bytearray()
    for offset in offsets:
        loca.extend(struct.pack('>I', offset))

    transformed_points = [point for contour in transform_contours() for point in contour]
    x_values = [point[0] for point in transformed_points]
    y_values = [point[1] for point in transformed_points]

    metrics = {
        'glyph_count': len(glyphs),
        'x_min': min(x_values),
        'y_min': min(y_values),
        'x_max': max(x_values),
        'y_max': max(y_values),
        'point_count': len(transformed_points),
        'contour_count': len(SOURCE_CONTOURS),
    }

    return bytes(glyf), bytes(loca), metrics


def build_head(metrics: dict[str, int], created_at: int) -> bytes:
    return struct.pack(
        '>IIIIHHqqhhhhHHhhh',
        0x00010000,
        0x00010000,
        0,
        0x5F0F3CF5,
        0x000B,
        UNITS_PER_EM,
        created_at,
        created_at,
        metrics['x_min'],
        metrics['y_min'],
        metrics['x_max'],
        metrics['y_max'],
        0,
        8,
        2,
        1,
        0,
    )


def build_hhea(metrics: dict[str, int]) -> bytes:
    ascender = UNITS_PER_EM
    descender = 0
    min_left_side_bearing = 0
    min_right_side_bearing = ADVANCE_WIDTH - metrics['x_max']
    x_max_extent = metrics['x_max']
    return struct.pack(
        '>IhhhHhhhhhhhhhhhH',
        0x00010000,
        ascender,
        descender,
        0,
        ADVANCE_WIDTH,
        min_left_side_bearing,
        min_right_side_bearing,
        x_max_extent,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        metrics['glyph_count'],
    )


def build_maxp(metrics: dict[str, int]) -> bytes:
    return struct.pack(
        '>IHHHHHHHHHHHHHH',
        0x00010000,
        metrics['glyph_count'],
        metrics['point_count'],
        metrics['contour_count'],
        0,
        0,
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
    )


def build_hmtx() -> bytes:
    return struct.pack('>HHHH', ADVANCE_WIDTH, 0, ADVANCE_WIDTH, 0)


def build_cmap() -> bytes:
    seg_count = 2
    seg_count_x2 = seg_count * 2
    search_range = 2 * (1 << int(math.log2(seg_count)))
    entry_selector = int(math.log2(seg_count))
    range_shift = seg_count_x2 - search_range
    format4 = struct.pack(
        '>HHHHHHHH',
        4,
        32,
        0,
        seg_count_x2,
        search_range,
        entry_selector,
        range_shift,
        GLYPH_CODEPOINT,
    )
    format4 += struct.pack('>H', 0xFFFF)
    format4 += struct.pack('>H', 0)
    format4 += struct.pack('>H', GLYPH_CODEPOINT)
    format4 += struct.pack('>H', 0xFFFF)
    format4 += struct.pack('>h', (1 - GLYPH_CODEPOINT) & 0xFFFF)
    format4 += struct.pack('>h', 1)
    format4 += struct.pack('>H', 0)
    format4 += struct.pack('>H', 0)

    cmap = bytearray()
    cmap.extend(struct.pack('>HH', 0, 1))
    cmap.extend(struct.pack('>HHI', 3, 1, 12))
    cmap.extend(format4)
    return bytes(cmap)


def build_name() -> bytes:
    records = [
        (1, FONT_FAMILY),
        (2, 'Regular'),
        (4, f'{FONT_FAMILY} Regular'),
        (6, POSTSCRIPT_NAME),
    ]
    strings = bytearray()
    name_records = bytearray()

    for name_id, text in records:
        encoded = text.encode('utf-16-be')
        name_records.extend(
            struct.pack(
                '>HHHHHH',
                3,
                1,
                0x0409,
                name_id,
                len(encoded),
                len(strings),
            )
        )
        strings.extend(encoded)

    header = struct.pack('>HHH', 0, len(records), 6 + len(name_records))
    return header + bytes(name_records) + bytes(strings)


def build_post() -> bytes:
    return struct.pack(
        '>IIhhIIIII',
        0x00030000,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
    )


def build_os2() -> bytes:
    return struct.pack(
        '>HhHHHhhhhhhhhhhh10sLLLL4sHHHhhhHH',
        0,
        ADVANCE_WIDTH,
        400,
        5,
        0,
        0,
        UNITS_PER_EM,
        0,
        0,
        0,
        UNITS_PER_EM,
        0,
        0,
        0,
        ADVANCE_WIDTH,
        0,
        b'\0' * 10,
        0,
        0,
        0,
        0,
        b'ACP ',
        0x0040,
        GLYPH_CODEPOINT,
        GLYPH_CODEPOINT,
        UNITS_PER_EM,
        0,
        0,
        UNITS_PER_EM,
        0,
    )


def build_tables() -> dict[bytes, bytes]:
    created_at = to_longdatetime(time.time())
    glyf, loca, metrics = build_glyf_and_loca()
    return {
        b'OS/2': build_os2(),
        b'cmap': build_cmap(),
        b'glyf': glyf,
        b'head': build_head(metrics, created_at),
        b'hhea': build_hhea(metrics),
        b'hmtx': build_hmtx(),
        b'loca': loca,
        b'maxp': build_maxp(metrics),
        b'name': build_name(),
        b'post': build_post(),
    }


def build_sfnt(tables: dict[bytes, bytes]) -> tuple[bytes, dict[bytes, tuple[int, int, int]]]:
    tags = sorted(tables)
    num_tables = len(tags)
    max_power = 1 << int(math.log2(num_tables))
    search_range = max_power * 16
    entry_selector = int(math.log2(max_power))
    range_shift = num_tables * 16 - search_range

    offset = 12 + (16 * num_tables)
    records = {}
    directory = bytearray()
    payload = bytearray()

    for tag in tags:
        raw = tables[tag]
        checksum = calc_checksum(raw)
        records[tag] = (offset, len(raw), checksum)
        directory.extend(struct.pack('>4sIII', tag, checksum, offset, len(raw)))
        padded = pad4(raw)
        payload.extend(padded)
        offset += len(padded)

    sfnt = bytearray()
    sfnt.extend(struct.pack('>IHHHH', 0x00010000, num_tables, search_range, entry_selector, range_shift))
    sfnt.extend(directory)
    sfnt.extend(payload)

    head_offset = records[b'head'][0]
    struct.pack_into('>I', sfnt, head_offset + 8, 0)
    whole_checksum = calc_checksum(bytes(sfnt))
    checksum_adjustment = (0xB1B0AFBA - whole_checksum) & 0xFFFFFFFF
    struct.pack_into('>I', sfnt, head_offset + 8, checksum_adjustment)

    return bytes(sfnt), records


def build_woff(sfnt: bytes, records: dict[bytes, tuple[int, int, int]], tables: dict[bytes, bytes]) -> bytes:
    tags = sorted(tables)
    num_tables = len(tags)
    offset = 44 + (20 * num_tables)
    directory = bytearray()
    payload = bytearray()

    for tag in tags:
        raw = tables[tag]
        compressed = zlib.compress(raw)
        if len(compressed) < len(raw):
            body = compressed
        else:
            body = raw
        padded = pad4(body)
        directory.extend(
            struct.pack(
                '>4sIIII',
                tag,
                offset,
                len(body),
                len(raw),
                records[tag][2],
            )
        )
        payload.extend(padded)
        offset += len(padded)

    header = struct.pack(
        '>4sI I H H I H H I I I I I',
        b'wOFF',
        0x00010000,
        44 + len(directory) + len(payload),
        num_tables,
        0,
        len(sfnt),
        1,
        0,
        0,
        0,
        0,
        0,
        0,
    )
    return header + bytes(directory) + bytes(payload)


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    output_dir = root / 'resources' / 'icons'
    output_dir.mkdir(parents=True, exist_ok=True)

    tables = build_tables()
    sfnt, records = build_sfnt(tables)
    woff = build_woff(sfnt, records, tables)

    output_path = output_dir / 'ai-commit-lite-icons.woff'
    output_path.write_bytes(woff)
    print(f'Generated {output_path}')


if __name__ == '__main__':
    main()

