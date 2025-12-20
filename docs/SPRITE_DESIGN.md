# Sprite Design Philosophy

## Programmatic Pixel Art over Emoji

**Decision**: Use programmatic pixel art for important game moments instead of emoji.

**Rationale**:
- **Emoji is lazy for critical moments** - The first creature encounter is a pivotal story beat. Using emoji (🦋) feels cheap and undermines the emotional weight of the scene.
- **Artistic control** - Pixel art allows us to convey specific details (damaged wing, glowing accents, shivering posture) that emoji cannot.
- **Consistency** - Characters use pixel art sprites, so creatures should too.
- **Narrative alignment** - The narrative describes "Something small is huddled between the rocks" with "One of its wings is tucked at a strange angle" - this requires visual detail that only pixel art can provide.

## Lumina Sprite Design

The first creature (Lumina, the moth) has a hand-crafted 16x16 pixel art sprite that shows:
- **Asymmetry**: Left wing damaged/folded vs right wing healthy/spread
- **Color palette**: Soft browns (#8B7355, #6B5345) for body, moccasin (#FFE4B5) for wings
- **Glowing accents**: Light blue (#87CEEB) spots to show Lumina's signature glow
- **Details**: Antennae, body segments, wing patterns

## Implementation

Creatures are drawn programmatically in `spriteLoader.js` using the `drawCreature()` method. This approach:
1. Avoids external asset dependencies
2. Allows dynamic variations (damaged/healthy states, animations)
3. Maintains pixel-perfect rendering at any scale
4. Can be easily modified without external tools

## Future Creatures

When adding new creatures:
1. Design them in `spriteLoader.drawCreature()` with unique visual characteristics
2. Match their appearance to their narrative description
3. Use colors that reflect their personality and abilities
4. Consider animation frames for idle/movement states

**Remember**: Creatures are characters in this story, not decorations. Treat their visual design with the same care as NPCs and the player.
