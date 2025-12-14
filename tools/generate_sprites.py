#!/usr/bin/env python3
"""
Lighthouse Game Sprite Generator
Creates 16x16 pixel art sprites programmatically using PIL/Pillow
Generates: tilesets, characters, structures with proper shading and detail
"""

from PIL import Image, ImageDraw
import json
import os

# Modern GBA-style color palette (muted, cohesive)
COLORS = {
    # Grass tones
    'grass_light': (140, 191, 124),
    'grass_mid': (106, 170, 100),
    'grass_dark': (83, 141, 78),
    'grass_shadow': (61, 107, 61),

    # Water tones
    'water_light': (138, 199, 226),
    'water_mid': (91, 164, 200),
    'water_dark': (62, 137, 178),
    'water_deep': (43, 96, 125),

    # Sand tones
    'sand_light': (241, 225, 186),
    'sand_mid': (228, 204, 148),
    'sand_dark': (203, 178, 120),

    # Structure colors
    'stone_light': (211, 211, 211),
    'stone_mid': (169, 169, 169),
    'stone_dark': (128, 128, 128),
    'red_bright': (220, 70, 70),
    'red_dark': (180, 50, 50),
    'yellow_light': (255, 250, 205),
    'yellow_mid': (255, 235, 120),

    # Character colors
    'skin_light': (255, 220, 177),
    'skin_mid': (237, 188, 145),
    'brown_light': (139, 90, 60),
    'brown_dark': (90, 60, 40),
    'blue_clothes': (65, 105, 225),
    'blue_dark': (45, 75, 165),

    # UI colors
    'outline': (26, 26, 46),
    'shadow': (0, 0, 0, 90),
    'transparent': (0, 0, 0, 0)
}

def add_noise(img, intensity=0.1):
    """Add subtle noise for texture"""
    import random
    pixels = img.load()
    for y in range(img.height):
        for x in range(img.width):
            if pixels[x, y][3] > 0 and random.random() < intensity:
                r, g, b, a = pixels[x, y]
                adjust = random.randint(-5, 5)
                pixels[x, y] = (
                    max(0, min(255, r + adjust)),
                    max(0, min(255, g + adjust)),
                    max(0, min(255, b + adjust)),
                    a
                )
    return img

def create_grass_tile(variant=0):
    """16x16 grass tile with subtle details"""
    img = Image.new('RGBA', (16, 16), COLORS['transparent'])
    draw = ImageDraw.Draw(img)

    # Base fill
    draw.rectangle([0, 0, 15, 15], fill=COLORS['grass_mid'])

    # Top-left highlight
    for i in range(4):
        draw.point([(i, 0), (0, i)], fill=COLORS['grass_light'])

    # Bottom-right shadow
    for i in range(3):
        draw.point([(15-i, 15), (15, 15-i)], fill=COLORS['grass_dark'])

    # Grass blade details based on variant
    if variant == 0:
        draw.point([(3, 12), (7, 11), (11, 13)], fill=COLORS['grass_light'])
    elif variant == 1:
        draw.point([(2, 10), (9, 12), (14, 9)], fill=COLORS['grass_light'])
        draw.point([(5, 14)], fill=COLORS['grass_dark'])
    elif variant == 2:
        draw.point([(4, 11), (10, 13), (13, 10)], fill=COLORS['grass_light'])
        draw.point([(6, 8)], fill=COLORS['grass_dark'])
    elif variant == 3:
        draw.point([(1, 13), (8, 10), (12, 14)], fill=COLORS['grass_light'])

    return img

def create_water_tile(frame=0):
    """16x16 animated water tile (3 frames)"""
    img = Image.new('RGBA', (16, 16), COLORS['transparent'])
    draw = ImageDraw.Draw(img)

    # Base water
    draw.rectangle([0, 0, 15, 15], fill=COLORS['water_mid'])

    # Animated wave pattern
    wave_offset = frame * 2
    for y in range(0, 16, 4):
        y_pos = (y + wave_offset) % 16
        draw.line([(0, y_pos), (15, y_pos)], fill=COLORS['water_light'], width=1)

    # Dark accents
    for y in range(0, 16, 6):
        y_pos = (y + wave_offset + 3) % 16
        draw.point([(5, y_pos), (11, y_pos)], fill=COLORS['water_dark'])

    return img

def create_sand_tile(variant=0):
    """16x16 sand tile with subtle texture"""
    img = Image.new('RGBA', (16, 16), COLORS['transparent'])
    draw = ImageDraw.Draw(img)

    # Base sand
    draw.rectangle([0, 0, 15, 15], fill=COLORS['sand_mid'])

    # Highlights
    for i in range(3):
        draw.point([(i, 0), (0, i)], fill=COLORS['sand_light'])

    # Subtle texture dots
    if variant == 0:
        draw.point([(3, 7), (9, 10), (14, 4)], fill=COLORS['sand_dark'])
    elif variant == 1:
        draw.point([(5, 5), (11, 12), (2, 13)], fill=COLORS['sand_dark'])
    elif variant == 2:
        draw.point([(7, 9), (13, 6), (4, 14)], fill=COLORS['sand_dark'])

    return img

def create_transition_tile(from_terrain, to_terrain, direction):
    """Transition tiles for terrain edges (grass→sand, grass→water)"""
    img = Image.new('RGBA', (16, 16), COLORS['transparent'])
    draw = ImageDraw.Draw(img)

    from_color = COLORS.get(f'{from_terrain}_mid', COLORS['grass_mid'])
    to_color = COLORS.get(f'{to_terrain}_mid', COLORS['sand_mid'])

    # Create jagged transition edge
    if direction == 'N':  # Top edge
        draw.rectangle([0, 0, 15, 15], fill=from_color)
        points = [(0, 0), (4, 2), (8, 1), (12, 3), (15, 2), (15, 0), (0, 0)]
        draw.polygon(points, fill=to_color)
    elif direction == 'S':  # Bottom edge
        draw.rectangle([0, 0, 15, 15], fill=from_color)
        points = [(0, 13), (4, 14), (8, 12), (12, 14), (15, 13), (15, 15), (0, 15), (0, 13)]
        draw.polygon(points, fill=to_color)
    elif direction == 'E':  # Right edge
        draw.rectangle([0, 0, 15, 15], fill=from_color)
        points = [(13, 0), (14, 4), (12, 8), (14, 12), (15, 15), (15, 0), (13, 0)]
        draw.polygon(points, fill=to_color)
    elif direction == 'W':  # Left edge
        draw.rectangle([0, 0, 15, 15], fill=from_color)
        points = [(2, 0), (1, 4), (3, 8), (1, 12), (0, 15), (0, 0), (2, 0)]
        draw.polygon(points, fill=to_color)
    elif direction == 'NE':  # Top-right corner
        draw.rectangle([0, 0, 15, 15], fill=from_color)
        points = [(8, 0), (15, 0), (15, 8)]
        draw.polygon(points, fill=to_color)
    elif direction == 'NW':  # Top-left corner
        draw.rectangle([0, 0, 15, 15], fill=from_color)
        points = [(0, 0), (8, 0), (0, 8)]
        draw.polygon(points, fill=to_color)
    elif direction == 'SE':  # Bottom-right corner
        draw.rectangle([0, 0, 15, 15], fill=from_color)
        points = [(15, 8), (15, 15), (8, 15)]
        draw.polygon(points, fill=to_color)
    elif direction == 'SW':  # Bottom-left corner
        draw.rectangle([0, 0, 15, 15], fill=from_color)
        points = [(0, 8), (8, 15), (0, 15)]
        draw.polygon(points, fill=to_color)

    return img

def create_character_sprite(char_type='player', direction='down', frame=0):
    """24x32 character sprite with distinct personalities"""
    img = Image.new('RGBA', (24, 32), COLORS['transparent'])
    draw = ImageDraw.Draw(img)

    # Shadow (larger)
    draw.ellipse([6, 29, 17, 31], fill=COLORS['shadow'])

    # Character-specific colors and features
    if char_type == 'player':
        # Young explorer - brown hair, blue shirt, tan pants
        hair_color = COLORS['brown_dark']
        shirt_color = COLORS['blue_clothes']
        pants_color = (139, 119, 101)  # Tan
        skin_color = COLORS['skin_light']
        has_hat = True
    elif char_type == 'shopkeeper':
        # Friendly merchant - red hair, green apron, warm personality
        hair_color = (200, 100, 50)  # Auburn
        shirt_color = (140, 180, 140)  # Green
        pants_color = (80, 80, 120)  # Dark blue
        skin_color = COLORS['skin_mid']
        has_hat = False
    elif char_type == 'teacher':
        # Wise educator - gray hair, purple robe, glasses
        hair_color = (150, 150, 160)  # Gray
        shirt_color = (120, 80, 160)  # Purple
        pants_color = (100, 70, 140)  # Dark purple
        skin_color = COLORS['skin_light']
        has_hat = False
    elif char_type == 'scientist':
        # Researcher - blonde, white lab coat, energetic
        hair_color = (220, 200, 130)  # Blonde
        shirt_color = (240, 240, 250)  # White coat
        pants_color = (60, 60, 60)  # Dark gray
        skin_color = COLORS['skin_mid']
        has_hat = False
    elif char_type == 'fisherman':
        # Weathered sailor - beard, yellow raincoat, boots
        hair_color = (90, 70, 50)  # Dark brown beard
        shirt_color = (220, 200, 50)  # Yellow raincoat
        pants_color = (40, 60, 80)  # Blue jeans
        skin_color = (220, 170, 130)  # Tan skin
        has_hat = True
    else:
        # Default
        hair_color = COLORS['brown_dark']
        shirt_color = COLORS['blue_clothes']
        pants_color = COLORS['brown_light']
        skin_color = COLORS['skin_mid']
        has_hat = False

    # Outline for visibility
    draw.rectangle([7, 6, 16, 27], outline=COLORS['outline'], width=1)

    # Draw based on direction
    if direction == 'down':
        # Head
        draw.ellipse([8, 5, 15, 12], fill=skin_color)

        # Hair/Hat
        if has_hat:
            if char_type == 'fisherman':
                # Rain hat
                draw.rectangle([7, 4, 16, 7], fill=shirt_color)
            else:
                # Explorer cap
                draw.rectangle([7, 3, 16, 6], fill=hair_color)
        else:
            # Hair
            draw.ellipse([7, 4, 16, 10], fill=hair_color)

        # Eyes
        draw.point([(10, 9), (13, 9)], fill=COLORS['outline'])

        # Body (shirt)
        draw.rectangle([8, 13, 15, 21], fill=shirt_color)

        # Arms
        draw.rectangle([7, 14, 8, 20], fill=shirt_color)
        draw.rectangle([15, 14, 16, 20], fill=shirt_color)

        # Pants/Legs - animated
        if frame == 0:  # Standing
            draw.rectangle([9, 22, 11, 27], fill=pants_color)
            draw.rectangle([12, 22, 14, 27], fill=pants_color)
        else:  # Walking
            draw.rectangle([9, 22, 11, 27], fill=pants_color)
            draw.rectangle([12, 21, 14, 27], fill=pants_color)

    elif direction == 'up':
        # Back of head
        draw.ellipse([8, 5, 15, 12], fill=hair_color)

        # Body
        draw.rectangle([8, 13, 15, 21], fill=shirt_color)

        # Arms
        draw.rectangle([7, 14, 8, 20], fill=shirt_color)
        draw.rectangle([15, 14, 16, 20], fill=shirt_color)

        # Legs - animated
        if frame == 0:
            draw.rectangle([9, 22, 11, 27], fill=pants_color)
            draw.rectangle([12, 22, 14, 27], fill=pants_color)
        else:
            draw.rectangle([9, 21, 11, 27], fill=pants_color)
            draw.rectangle([12, 22, 14, 27], fill=pants_color)

    elif direction == 'left':
        # Side view - head
        draw.ellipse([9, 5, 16, 12], fill=skin_color)
        draw.ellipse([8, 4, 15, 10], fill=hair_color)

        # Eye
        draw.point([(12, 9)], fill=COLORS['outline'])

        # Body
        draw.rectangle([9, 13, 15, 21], fill=shirt_color)

        # Arm (one visible)
        draw.rectangle([8, 15, 10, 20], fill=shirt_color)

        # Legs - animated
        if frame == 0:
            draw.rectangle([10, 22, 13, 27], fill=pants_color)
        else:
            draw.rectangle([9, 22, 12, 27], fill=pants_color)
            draw.rectangle([12, 21, 14, 27], fill=pants_color)

    elif direction == 'right':
        # Side view - head (mirrored)
        draw.ellipse([7, 5, 14, 12], fill=skin_color)
        draw.ellipse([8, 4, 15, 10], fill=hair_color)

        # Eye
        draw.point([(11, 9)], fill=COLORS['outline'])

        # Body
        draw.rectangle([8, 13, 14, 21], fill=shirt_color)

        # Arm
        draw.rectangle([13, 15, 15, 20], fill=shirt_color)

        # Legs - animated
        if frame == 0:
            draw.rectangle([10, 22, 13, 27], fill=pants_color)
        else:
            draw.rectangle([9, 21, 11, 27], fill=pants_color)
            draw.rectangle([11, 22, 14, 27], fill=pants_color)

    return img

def create_tree():
    """32x32 tree (2x2 tiles)"""
    img = Image.new('RGBA', (32, 32), COLORS['transparent'])
    draw = ImageDraw.Draw(img)

    # Trunk (bottom center)
    draw.rectangle([12, 20, 19, 31], fill=COLORS['brown_dark'])
    draw.rectangle([13, 21, 18, 30], fill=COLORS['brown_light'])

    # Canopy (circle approximation)
    draw.ellipse([6, 4, 25, 23], fill=COLORS['grass_dark'])
    draw.ellipse([8, 6, 23, 21], fill=COLORS['grass_mid'])

    # Highlights on canopy
    draw.ellipse([10, 8, 18, 14], fill=COLORS['grass_light'])

    return img

def create_lighthouse():
    """48x80 lighthouse structure (3x5 tiles)"""
    img = Image.new('RGBA', (48, 80), COLORS['transparent'])
    draw = ImageDraw.Draw(img)

    # Base
    draw.rectangle([8, 60, 39, 79], fill=COLORS['stone_dark'])
    draw.rectangle([10, 62, 37, 77], fill=COLORS['stone_mid'])

    # Door
    draw.rectangle([20, 68, 27, 77], fill=COLORS['brown_dark'])
    draw.rectangle([21, 69, 26, 76], fill=COLORS['brown_light'])

    # Tower body
    draw.polygon([(12, 60), (35, 60), (30, 15), (17, 15)], fill=COLORS['stone_mid'])

    # Red stripes
    for y in [25, 38, 51]:
        draw.rectangle([13, y, 34, y+6], fill=COLORS['red_bright'])
        draw.rectangle([14, y+1, 33, y+5], fill=COLORS['red_dark'])

    # Light chamber (top)
    draw.rectangle([15, 8, 32, 16], fill=COLORS['yellow_mid'])
    draw.rectangle([16, 9, 31, 15], fill=COLORS['yellow_light'])

    # Roof
    draw.polygon([(12, 8), (35, 8), (23, 2)], fill=COLORS['red_bright'])

    # Windows
    for y in [30, 44, 56]:
        draw.rectangle([21, y, 26, y+4], fill=COLORS['yellow_light'])

    # Light beam (subtle glow at top)
    for i in range(3):
        opacity = 50 - i * 15
        draw.rectangle([20 - i, 0, 27 + i, 8],
                      fill=COLORS['yellow_light'][:3] + (opacity,))

    return img

def main():
    """Generate all sprite sheets and index files"""
    output_dir = 'static/sprites'
    os.makedirs(output_dir, exist_ok=True)

    print("Generating sprite sheets...")

    # TILESET (256x128 - 16x8 grid of 16x16 tiles)
    tileset = Image.new('RGBA', (256, 128), COLORS['transparent'])
    tileset_index = {
        'tileSize': 16,
        'tiles': {}
    }

    tile_x, tile_y = 0, 0

    # Grass variants (4 tiles)
    for i in range(4):
        grass = create_grass_tile(i)
        tileset.paste(grass, (tile_x * 16, tile_y * 16))
        tileset_index['tiles'][f'grass_{i}'] = {'x': tile_x, 'y': tile_y}
        tile_x += 1

    # Water animation frames (3 tiles)
    for i in range(3):
        water = create_water_tile(i)
        tileset.paste(water, (tile_x * 16, tile_y * 16))
        tileset_index['tiles'][f'water_{i}'] = {'x': tile_x, 'y': tile_y}
        tile_x += 1

    # Sand variants (3 tiles)
    for i in range(3):
        sand = create_sand_tile(i)
        tileset.paste(sand, (tile_x * 16, tile_y * 16))
        tileset_index['tiles'][f'sand_{i}'] = {'x': tile_x, 'y': tile_y}
        tile_x += 1

    # Move to next row
    tile_x, tile_y = 0, 1

    # Transition tiles: grass→sand
    for direction in ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW']:
        trans = create_transition_tile('grass', 'sand', direction)
        tileset.paste(trans, (tile_x * 16, tile_y * 16))
        tileset_index['tiles'][f'grass_sand_{direction}'] = {'x': tile_x, 'y': tile_y}
        tile_x += 1
        if tile_x >= 16:
            tile_x = 0
            tile_y += 1

    # Transition tiles: grass→water
    for direction in ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW']:
        trans = create_transition_tile('grass', 'water', direction)
        tileset.paste(trans, (tile_x * 16, tile_y * 16))
        tileset_index['tiles'][f'grass_water_{direction}'] = {'x': tile_x, 'y': tile_y}
        tile_x += 1
        if tile_x >= 16:
            tile_x = 0
            tile_y += 1

    tileset.save(f'{output_dir}/tileset.png')
    with open(f'{output_dir}/tileset.json', 'w') as f:
        json.dump(tileset_index, f, indent=2)
    print(f"✓ Tileset created: {output_dir}/tileset.png")

    # CHARACTERS - Multiple character types (5 types × 4 directions × 2 frames)
    # Sprite sheet: 120x128 (5 rows of 4 directions, each 24x32)
    char_types = ['player', 'shopkeeper', 'teacher', 'scientist', 'fisherman']
    characters = Image.new('RGBA', (96, 160), COLORS['transparent'])
    char_index = {
        'spriteWidth': 24,
        'spriteHeight': 32,
        'characters': {}
    }

    directions = ['down', 'up', 'left', 'right']

    for char_idx, char_type in enumerate(char_types):
        char_index['characters'][char_type] = {'animations': {}}

        for dir_idx, direction in enumerate(directions):
            frames_data = []
            for frame in range(2):
                char = create_character_sprite(char_type, direction, frame)
                x = dir_idx * 24
                y = (char_idx * 2 + frame) * 32
                characters.paste(char, (x, y))
                frames_data.append({'x': dir_idx, 'y': char_idx * 2 + frame})

            char_index['characters'][char_type]['animations'][direction] = {
                'frames': frames_data
            }

    characters.save(f'{output_dir}/characters.png')
    with open(f'{output_dir}/characters.json', 'w') as f:
        json.dump(char_index, f, indent=2)
    print(f"✓ Characters created: {output_dir}/characters.png (5 unique characters)")

    # TREE (32x32)
    tree = create_tree()
    tree.save(f'{output_dir}/tree.png')
    print(f"✓ Tree created: {output_dir}/tree.png")

    # LIGHTHOUSE (48x80)
    lighthouse = create_lighthouse()
    lighthouse.save(f'{output_dir}/lighthouse.png')
    print(f"✓ Lighthouse created: {output_dir}/lighthouse.png")

    print("\n✓ All sprites generated successfully!")
    print(f"  Output directory: {output_dir}/")

if __name__ == '__main__':
    main()
