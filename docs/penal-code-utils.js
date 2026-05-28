(function exposePenalCodeUtils(root) {
  function parseReferences(value) {
    if (!value.trim()) {
      return [];
    }

    const normalized = value
      .toLowerCase()
      .replace(/\bpenal\s+code\b/g, "")
      .replace(/\bpen\.?\s*code\b/g, "")
      .replace(/\bsection\b/g, "")
      .replace(/\bpc\b/g, "")
      .replace(/§/g, "")
      .replace(/\band\b/g, ",")
      .trim();

    if (!normalized) {
      return [];
    }

    const parts = normalized
      .split(/[,;/\n]+|\s+(?=\d)/)
      .map((part) => part.trim())
      .filter(Boolean);

    const references = parts.map((part) => {
      const match = part.match(/^(\d+(?:\.\d+)?[a-z]?)(\s*(?:\([a-z0-9]+\))*)\.?$/i);
      if (!match) {
        return null;
      }

      return {
        section: match[1].toLowerCase(),
        subdivisions: Array.from(match[2].matchAll(/\(([a-z0-9]+)\)/gi), (item) =>
          item[1].toLowerCase()
        ),
      };
    });

    if (!references.length || references.some((reference) => !reference)) {
      return null;
    }

    return references;
  }

  function formatReference(reference) {
    return `${reference.section}${reference.subdivisions
      .map((subdivision) => `(${subdivision})`)
      .join("")}`;
  }

  function getSubdivisionKind(subdivision) {
    return /^\d+$/.test(subdivision) ? "\\d+" : "[a-z]+";
  }

  function normalizeAdjacentSubdivisionMarkers(text) {
    return text.replace(/^(\([a-z0-9]+\))\s+(?=\([a-z0-9]+\))/i, "$1\n");
  }

  function findSubdivisionBounds(text, subdivision) {
    const markerPattern = new RegExp(
      `^\\((${getSubdivisionKind(subdivision)})\\)\\s*`,
      "gim"
    );
    const subdivisions = Array.from(text.matchAll(markerPattern));
    const selectedSubdivision = subdivisions.find(
      (match) => match[1].toLowerCase() === subdivision
    );

    if (!selectedSubdivision) {
      return null;
    }

    const selectedIndex = subdivisions.indexOf(selectedSubdivision);
    const nextSubdivision = subdivisions[selectedIndex + 1];

    return {
      firstStart: subdivisions[0].index,
      start: selectedSubdivision.index,
      end: nextSubdivision?.index ?? text.length,
    };
  }

  function getApplicableSectionText(sectionText, reference) {
    if (!reference.subdivisions.length) {
      return sectionText;
    }

    let applicableText = sectionText;
    const context = [];

    for (const subdivision of reference.subdivisions) {
      applicableText = normalizeAdjacentSubdivisionMarkers(applicableText);
      const bounds = findSubdivisionBounds(applicableText, subdivision);
      if (!bounds) {
        return "";
      }

      const parentContext = applicableText.slice(0, bounds.firstStart).trim();
      if (parentContext) {
        context.push(parentContext);
      }
      applicableText = applicableText.slice(bounds.start, bounds.end).trim();
    }

    return [...context, applicableText].filter(Boolean).join("\n\n");
  }

  function getTextPreview(text) {
    const firstParagraph = text
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .find((part) => part && !/^\d+(?:\.\d+)?[a-z]?\.$/i.test(part));

    if (!firstParagraph) {
      return text;
    }

    return firstParagraph.length > 240
      ? `${firstParagraph.slice(0, 237).trim()}...`
      : firstParagraph;
  }

  const utils = {
    parseReferences,
    formatReference,
    getApplicableSectionText,
    getTextPreview,
  };

  root.PenalCodeUtils = utils;
  if (typeof module !== "undefined") {
    module.exports = utils;
  }
})(typeof window !== "undefined" ? window : globalThis);
