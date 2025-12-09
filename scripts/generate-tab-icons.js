#!/usr/bin/env node

/**
 * Script to generate PNG icon images from Lucide icons for NativeTabs
 *
 * Usage: node scripts/generate-tab-icons.js
 */

const fs = require("fs");
const path = require("path");

// Icon mappings: [lucideIconName, outputFileName]
const icons = [
  ["home", "home"],
  ["map-pin", "locations"],
  ["message-circle", "messages"],
  ["bell", "notifications"],
  ["settings", "settings"],
];

const colors = {
  default: "#6b7280", // gray
  selected: "#0086c9", // blue
};

const sizes = [24, 48, 72]; // 1x, 2x, 3x

async function generateIcons() {
  let sharp, lucideStatic;

  try {
    sharp = require("sharp");
    lucideStatic = require("lucide-static");
  } catch (error) {
    console.error("Missing dependencies. Please install:");
    console.error("  npm install --save-dev sharp lucide-static");
    process.exit(1);
  }

  const iconsDir = path.join(__dirname, "../assets/icons");
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Get path to lucide-static icons directory
  const lucideIconsPath = path.dirname(
    require.resolve("lucide-static/package.json")
  );
  const lucideIconsDir = path.join(lucideIconsPath, "icons");

  console.log("Generating icon images...\n");

  for (const [lucideName, fileName] of icons) {
    try {
      const svgPath = path.join(lucideIconsDir, `${lucideName}.svg`);

      if (!fs.existsSync(svgPath)) {
        console.warn(`⚠️  SVG file not found: ${svgPath}`);
        continue;
      }

      // Read SVG file
      let svgContent = fs.readFileSync(svgPath, "utf8");

      // Generate PNG for each state and size
      for (const [state, color] of Object.entries(colors)) {
        // Replace stroke color in SVG
        const coloredSvg = svgContent
          .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
          .replace(/stroke: [^;]*;/g, `stroke: ${color};`);

        for (let i = 0; i < sizes.length; i++) {
          const size = sizes[i];
          const scale = i + 1;
          const scaleSuffix = scale === 1 ? "" : `@${scale}x`;
          const outputPath = path.join(
            iconsDir,
            `${fileName}-${state}${scaleSuffix}.png`
          );

          // Convert SVG to PNG
          await sharp(Buffer.from(coloredSvg))
            .resize(size, size, {
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
            })
            .png()
            .toFile(outputPath);

          console.log(`✓ Generated ${path.basename(outputPath)}`);
        }
      }
    } catch (error) {
      console.error(`✗ Error generating icons for ${fileName}:`, error.message);
    }
  }

  console.log("\n✅ Icon generation complete!");
  console.log(`\nIcons saved to: ${iconsDir}`);
  console.log("\nNext steps:");
  console.log("1. Update app/(tabs)/_layout.tsx to use these images");
  console.log("2. Use require() to load the images in the Icon src prop");
}

if (require.main === module) {
  generateIcons().catch(console.error);
}
