#!/usr/bin/env python3
"""
Dialogue Tree Auditor
Parses data.js and generates visual dialogue trees for all NPCs
"""

import re
from typing import List, Dict, Any

def parse_text_content(text_match_str: str) -> List[str]:
    """Parse text content - can be string or array"""
    if text_match_str.strip().startswith('['):
        # Array - extract all quoted strings
        lines = re.findall(r'"([^"]*)"', text_match_str)
        return lines
    else:
        # Single string
        return [text_match_str.strip().strip('"')]

def parse_choices(choices_str: str) -> List[str]:
    """Parse choices array"""
    if not choices_str or choices_str.strip() == 'null' or choices_str.strip() == '':
        return []

    # Find all text: "..." patterns within choice objects
    choice_texts = re.findall(r'text:\s*"([^"]*)"', choices_str)
    return choice_texts

def extract_dialogues_manually(data_js_path: str) -> Dict[str, List[Dict[str, Any]]]:
    """Manually extract all dialogue NPCs and their dialogues"""

    with open(data_js_path, 'r') as f:
        content = f.read()

    # Find the NPCS object
    npcs_match = re.search(r'const NPCS = \{(.*?)\n\};', content, re.DOTALL)
    if not npcs_match:
        return {}

    npcs_content = npcs_match.group(1)

    # Split into individual NPC definitions
    # Look for pattern: npcId: { ... }
    npc_blocks = {}

    # Find all top-level NPC IDs
    npc_ids = re.findall(r'^\s*(\w+):\s*\{', npcs_content, re.MULTILINE)

    for npc_id in npc_ids:
        # Extract this NPC's block
        pattern = rf'{npc_id}:\s*\{{(.*?)(?:\n\s*\}},|\n\s*\}}$)'
        match = re.search(pattern, npcs_content, re.DOTALL)
        if not match:
            continue

        npc_data = match.group(1)

        # Check if it's a dialogue_npc
        if "type: 'dialogue_npc'" not in npc_data:
            continue

        # Extract NPC name
        name_match = re.search(r"name:\s*'([^']*)'", npc_data)
        npc_name = name_match.group(1) if name_match else npc_id

        # Extract dialogues array
        dialogues_match = re.search(r'dialogues:\s*\[(.*?)\](?:\s*,\s*quests:|$)', npc_data, re.DOTALL)
        if not dialogues_match:
            continue

        dialogues_str = dialogues_match.group(1)

        # Parse each dialogue object
        dialogues = []

        # Split by top-level dialogue objects
        # Each dialogue starts with { and has condition:
        dialogue_parts = []
        current_dialogue = ""
        brace_depth = 0
        in_dialogue = False

        for char in dialogues_str:
            if char == '{':
                if brace_depth == 0:
                    in_dialogue = True
                brace_depth += 1
            elif char == '}':
                brace_depth -= 1
                if brace_depth == 0 and in_dialogue:
                    current_dialogue += char
                    dialogue_parts.append(current_dialogue)
                    current_dialogue = ""
                    in_dialogue = False
                    continue

            if in_dialogue:
                current_dialogue += char

        for dialogue_str in dialogue_parts:
            if 'condition:' not in dialogue_str:
                continue

            # Extract condition
            condition_match = re.search(r'condition:\s*\(game\)\s*=>\s*(.*?)(?=,\s*text:)', dialogue_str, re.DOTALL)
            condition = condition_match.group(1).strip() if condition_match else "unknown"

            # Extract text
            text_match = re.search(r'text:\s*(\[[\s\S]*?\](?=\s*,)|"[^"]*")', dialogue_str)
            text_content = parse_text_content(text_match.group(1)) if text_match else []

            # Extract choices
            choices_match = re.search(r'choices:\s*(\[[\s\S]*?\](?=\s*\})|null)', dialogue_str)
            choices = parse_choices(choices_match.group(1)) if choices_match else []

            dialogues.append({
                'condition': condition,
                'text': text_content,
                'choices': choices,
                'npc_name': npc_name
            })

        npc_blocks[npc_id] = {
            'name': npc_name,
            'dialogues': dialogues
        }

    return npc_blocks

def generate_dialogue_tree(npc_id: str, npc_data: Dict[str, Any]) -> str:
    """Generate a visual dialogue tree"""
    output = []
    output.append(f"\n{'='*80}")
    output.append(f"NPC: {npc_data['name']} (id: {npc_id})")
    output.append(f"{'='*80}\n")

    for i, dialogue in enumerate(npc_data['dialogues']):
        output.append(f"Dialogue #{i+1}")
        output.append(f"Condition: {dialogue['condition']}")
        output.append("")

        # Show text lines
        if len(dialogue['text']) == 1:
            output.append(f"  NPC: \"{dialogue['text'][0]}\"")
        else:
            output.append(f"  NPC (conversation flow):")
            for j, line in enumerate(dialogue['text']):
                output.append(f"    {j+1}. \"{line}\"")

        output.append("")

        # Show choices
        if dialogue['choices']:
            output.append(f"  Player Choices ({len(dialogue['choices'])}):")
            for j, choice in enumerate(dialogue['choices']):
                marker = "►" if len(dialogue['choices']) == 1 else chr(65+j)
                output.append(f"    [{marker}] \"{choice}\"")

            if len(dialogue['choices']) == 1:
                output.append(f"    ⚠️  SINGLE CHOICE - Should auto-advance!")
        else:
            output.append("  Player Action: [Press Space/Click to close]")

        output.append("")
        output.append("-" * 80)
        output.append("")

    return "\n".join(output)

def analyze_unnatural_turns(npc_id: str, npc_data: Dict[str, Any]) -> List[str]:
    """Identify unnatural dialogue turns"""
    issues = []

    for i, dialogue in enumerate(npc_data['dialogues']):
        # CRITICAL: Single choices should auto-advance
        if len(dialogue['choices']) == 1:
            issues.append(f"  🔴 CRITICAL Dialogue #{i+1}: Single choice '{dialogue['choices'][0]}' - player shouldn't need to click this!")

        # Check for very long single statements
        for j, line in enumerate(dialogue['text']):
            if len(line) > 120:
                issues.append(f"  ⚠️  Dialogue #{i+1}, Line {j+1}: Long line ({len(line)} chars)")

        # Check for single-line multi-line arrays (unnecessary)
        if len(dialogue['text']) == 1 and isinstance(dialogue['text'], list):
            issues.append(f"  ℹ️  Dialogue #{i+1}: Single line in array - could simplify")

        # Check for conversations that end abruptly
        if dialogue['choices'] and len(dialogue['choices']) == 0:
            issues.append(f"  ℹ️  Dialogue #{i+1}: Conversation ends with NPC speaking - feels abrupt")

        # Check for fake choices (all choices lead to same action - need to parse actions for this)
        if len(dialogue['choices']) > 1:
            # Check if all choices are very similar
            if len(set(dialogue['choices'])) < len(dialogue['choices']):
                issues.append(f"  ⚠️  Dialogue #{i+1}: Duplicate choice text detected")

    return issues

def main():
    print("Dialogue Tree Auditor")
    print("=" * 80)

    # Parse data.js
    npcs = extract_dialogues_manually('data.js')

    if not npcs:
        print("❌ No dialogue NPCs found!")
        return

    all_output = []
    all_issues = {}

    for npc_id, npc_data in npcs.items():
        # Generate tree
        tree = generate_dialogue_tree(npc_id, npc_data)
        all_output.append(tree)

        # Analyze for unnatural turns
        issues = analyze_unnatural_turns(npc_id, npc_data)
        if issues:
            all_issues[npc_id] = issues

    # Write trees to file
    output_file = 'dialogue_trees.txt'
    with open(output_file, 'w') as f:
        f.write('\n'.join(all_output))

    print(f"\n✓ Dialogue trees written to {output_file}\n")

    # Report issues
    if all_issues:
        print("="*80)
        print("UNNATURAL DIALOGUE TURNS DETECTED")
        print("="*80 + "\n")

        for npc_id, issues in all_issues.items():
            npc_name = npcs[npc_id]['name']
            print(f"{npc_name} ({npc_id}):")
            for issue in issues:
                print(issue)
            print()
    else:
        print("✓ No unnatural dialogue turns found!")

    # Summary
    print("="*80)
    print("SUMMARY")
    print("="*80)
    print(f"NPCs analyzed: {len(npcs)}")
    total_dialogues = sum(len(npc['dialogues']) for npc in npcs.values())
    print(f"Total dialogues: {total_dialogues}")
    print(f"Issues found: {sum(len(issues) for issues in all_issues.values())}")
    print(f"\nOutput: {output_file}")

if __name__ == '__main__':
    main()
