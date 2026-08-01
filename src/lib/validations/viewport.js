/**
 * @typedef {import('../../adapters/adapter.js').AdapterInterface} AdapterInterface
 * @typedef {import('../validation.js').CustomValidationResult} CustomValidationResult
 */

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isMetaViewport(element, adapter) {
  if (adapter.getTagName(element) !== "meta") return false;
  const name = adapter.getAttribute(element, "name");
  return name?.toLowerCase() === "viewport";
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */
export function validateMetaViewport(element, adapter) {
  /** @type {string[]} */
  const warnings = [];
  /** @type {any} */
  let payload = null;

  const siblings = adapter.getSiblings(element);
  const hasDuplicateViewport = siblings.some((sibling) => {
    if (adapter.getTagName(sibling) !== "meta") return false;
    const name = adapter.getAttribute(sibling, "name");
    return name?.toLowerCase() === "viewport";
  });

  if (hasDuplicateViewport) {
    const parent = adapter.getParent(element);
    if (parent) {
      const viewportElements = adapter.getChildren(parent).filter((/** @type {any} */ child) => {
        if (adapter.getTagName(child) !== "meta") return false;
        const name = adapter.getAttribute(child, "name");
        return name?.toLowerCase() === "viewport";
      });
      const firstMetaViewport = viewportElements.find((/** @type {any} */ el) => el !== element);
      if (firstMetaViewport) {
        payload = { firstMetaViewport };
        warnings.push(
          "Another meta viewport element has already been declared. Having multiple viewport settings can lead to unexpected behavior.",
        );
        return { ruleId: "valid-meta-viewport", warnings, payload };
      }
    }
  }

  const content = adapter.getAttribute(element, "content")?.toLowerCase();
  if (!content) {
    warnings.push("Invalid viewport. The content attribute must be set.");
    return { ruleId: "valid-meta-viewport", warnings, payload };
  }

  /** @type {Record<string, string>} */
  const directives = Object.fromEntries(
    content.split(",").map((directive) => {
      const [key, value] = directive.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );

  if ("width" in directives) {
    const width = directives["width"];
    if (Number(width) < 1 || Number(width) > 10000) {
      warnings.push(`Invalid width "${width}". Numeric values must be between 1 and 10000.`);
    } else if (width !== "device-width") {
      warnings.push(`Invalid width "${width}".`);
    }
  }

  if ("height" in directives) {
    const height = directives["height"];
    if (Number(height) < 1 || Number(height) > 10000) {
      warnings.push(`Invalid height "${height}". Numeric values must be between 1 and 10000.`);
    } else if (height !== "device-height") {
      warnings.push(`Invalid height "${height}".`);
    }
  }

  if ("initial-scale" in directives) {
    const initialScale = Number(directives["initial-scale"]);
    if (isNaN(initialScale)) {
      warnings.push(`Invalid initial zoom level "${directives["initial-scale"]}". Values must be numeric.`);
    }
    if (initialScale < 0.1 || initialScale > 10) {
      warnings.push(`Invalid initial zoom level "${initialScale}". Values must be between 0.1 and 10.`);
    }
  }

  if ("minimum-scale" in directives) {
    const minimumScale = Number(directives["minimum-scale"]);
    if (isNaN(minimumScale)) {
      warnings.push(`Invalid minimum zoom level "${directives["minimum-scale"]}". Values must be numeric.`);
    }
    if (minimumScale < 0.1 || minimumScale > 10) {
      warnings.push(`Invalid minimum zoom level "${minimumScale}". Values must be between 0.1 and 10.`);
    }
  }

  if ("maximum-scale" in directives) {
    const maxScale = Number(directives["maximum-scale"]);
    if (isNaN(maxScale)) {
      warnings.push(`Invalid maximum zoom level "${directives["maximum-scale"]}". Values must be numeric.`);
    }
    if (maxScale < 0.1 || maxScale > 10) {
      warnings.push(`Invalid maximum zoom level "${maxScale}". Values must be between 0.1 and 10.`);
    }
    if (maxScale < 2) {
      warnings.push(
        `Disabling zoom levels under 2x can cause accessibility issues. Found "maximum-scale=${directives["maximum-scale"]}".`,
      );
    }
  }

  if ("user-scalable" in directives) {
    const userScalable = directives["user-scalable"];
    if (userScalable === "no" || userScalable === "0") {
      warnings.push(
        `Disabling zooming can cause accessibility issues to users with visual impairments. Found "user-scalable=${userScalable}".`,
      );
    }
    if (!["0", "1", "yes", "no"].includes(userScalable)) {
      warnings.push(`Unsupported value "${userScalable}" found.`);
    }
  }

  if ("interactive-widget" in directives) {
    const interactiveWidget = directives["interactive-widget"];
    const validValues = ["resizes-visual", "resizes-content", "overlays-content"];
    if (!validValues.includes(interactiveWidget)) {
      warnings.push(`Unsupported value "${interactiveWidget}" found.`);
    }
  }

  if ("viewport-fit" in directives) {
    const viewportFit = directives["viewport-fit"];
    const validValues = ["auto", "contain", "cover"];
    if (!validValues.includes(viewportFit)) {
      warnings.push(`Unsupported value "${viewportFit}" found. Should be one of: ${validValues.join(", ")}.`);
    }
  }

  if ("shrink-to-fit" in directives) {
    warnings.push(
      "The shrink-to-fit directive has been obsolete since iOS 9.2.\n  See https://www.scottohara.me/blog/2018/12/11/shrink-to-fit.html",
    );
  }

  const validDirectives = new Set([
    "width",
    "height",
    "initial-scale",
    "minimum-scale",
    "maximum-scale",
    "user-scalable",
    "interactive-widget",
  ]);

  Object.keys(directives)
    .filter((directive) => {
      if (validDirectives.has(directive)) {
        return false;
      }
      if (directive === "shrink-to-fit") {
        return false;
      }
      if (directive === "viewport-fit") {
        return false;
      }
      return true;
    })
    .forEach((directive) => {
      warnings.push(`Invalid viewport directive "${directive}".`);
    });

  return { ruleId: "valid-meta-viewport", warnings, payload };
}
