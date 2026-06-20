import re
import os

def theme_svg(input_path, is_dark):
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return

    with open(input_path, 'r', encoding='utf-8') as f:
        svg_content = f.read()

    # Extract style tag content
    style_match = re.search(r'<style>(.*?)</style>', svg_content, re.DOTALL)
    style_content = style_match.group(1) if style_match else ""

    # Remove style tag from body to avoid duplication or nested styling issues
    body_content = re.sub(r'<style>.*?</style>', '', svg_content, flags=re.DOTALL)
    # Remove XML declarations, outer svg tags, and description
    body_content = re.sub(r'<\?xml.*?\?>', '', body_content)
    body_content = re.sub(r'<!DOCTYPE.*?>', '', body_content)
    body_content = re.sub(r'<svg.*?>', '', body_content, count=1)
    body_content = re.sub(r'</svg>', '', body_content)
    body_content = re.sub(r'<desc>.*?</desc>', '', body_content)

    # Clean up empty lines or spaces
    body_content = body_content.strip()

    # Set up theme colors
    bg_sky = "#5c94fc"  # Mario Sky Blue
    dialog_bg = "#fce4a0"  # Beige Board
    inner_border = "#b83c18"  # Red-brown
    outer_border = "#000000"  # Black

    # New SVG wrapping layout:
    # Width: 960, Height: 320
    # Dialogue box container: x=20, y=20, width=920, height=260
    # Original content: translated to start at x=40, y=68 (dx=56, dy=100)
    new_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 320" width="100%">
  <defs>
    <style>
      {style_content}
      .bg-sky {{ fill: {bg_sky}; }}
      .box-container {{ fill: {dialog_bg}; stroke: {outer_border}; stroke-width: 3; }}
      .box-inner {{ fill: none; stroke: {inner_border}; stroke-width: 1.5; }}
    </style>
  </defs>

  <!-- Sky Background -->
  <rect width="960" height="320" class="bg-sky"/>

  <!-- Ground Terrain decoration at the bottom -->
  <g transform="translate(0, 300)">
    <rect width="960" height="6" fill="#fc9838"/>
    <rect y="6" width="960" height="14" fill="#b83c18"/>
    <path d="M 0 6 L 960 6 M 0 13 L 960 13" stroke="#000" stroke-width="1" stroke-opacity="0.3"/>
    <path d="{" ".join(f"M {x} 0 v 20" for x in range(0, 960, 20))}" stroke="#000" stroke-width="1" stroke-opacity="0.3"/>
  </g>

  <!-- Dialogue Box Board -->
  <rect x="20" y="20" width="920" height="260" rx="8" class="box-container"/>
  <rect x="26" y="26" width="908" height="248" rx="5" class="box-inner"/>

  <!-- Bouncing Text Title inside the dialogue box -->
  <text x="480" y="52" font-family="'Press Start 2P', monospace" font-size="10" fill="#b83c18" font-weight="bold" text-anchor="middle">> MY CONTRIBUTION GRID &lt;</text>

  <!-- Shifted Original Snake Game Grid -->
  <g transform="translate(56, 100)">
    {body_content}
  </g>
</svg>
"""

    with open(input_path, 'w', encoding='utf-8') as f:
        f.write(new_svg)
    print(f"Themed SVG saved: {input_path}")

def main():
    theme_svg("dist/snake-dark.svg", is_dark=True)
    theme_svg("dist/snake-light.svg", is_dark=False)

if __name__ == "__main__":
    main()
