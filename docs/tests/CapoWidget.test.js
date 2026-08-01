/**
 * @vitest-environment jsdom
 */
import { describe, it, beforeEach, expect } from "vitest";
import { VirtualConsole } from "../src/lib/VirtualConsole.js";
import { CapoWidgetElement } from "../src/lib/CapoWidgetElement.js";

describe("CapoWidgetElement", () => {
  beforeEach(() => {
    if (!customElements.get("virtual-console")) {
      customElements.define("virtual-console", VirtualConsole);
    }
    if (!customElements.get("capo-widget")) {
      customElements.define("capo-widget", CapoWidgetElement);
    }
    document.body.innerHTML = "";
  });

  function createWidgetHTML(snippetHtml = "") {
    return `
      <capo-widget class="capo-widget">
        <div role="tablist">
          <button role="tab">HTML</button>
          <button role="tab">Results</button>
        </div>
        <div class="capo-widget-code-container">
          <pre class="capo-widget-highlight"><code class="capo-widget-code"></code></pre>
          <textarea class="capo-widget-input">${snippetHtml}</textarea>
        </div>
        <virtual-console></virtual-console>
      </capo-widget>
    `;
  }

  it("should auto-run capo on mount and populate virtual console", () => {
    const container = document.createElement("div");
    container.innerHTML = createWidgetHTML(`
      <meta charset="utf-8">
      <title>Test Page</title>
    `);
    document.body.appendChild(container);

    const virtualConsole = container.querySelector("virtual-console");
    expect(virtualConsole.children.length).toBeGreaterThan(0);
  });

  it("should sync syntax highlighting in the code container", () => {
    const container = document.createElement("div");
    container.innerHTML = createWidgetHTML('<title class="header">Hello</title>');
    document.body.appendChild(container);

    const code = container.querySelector(".capo-widget-code");
    expect(code.innerHTML).toContain('<span class="tag">title</span>');
    expect(code.innerHTML).toContain('<span class="attr">class</span>');
    expect(code.innerHTML).toContain('<span class="val">"header"</span>');
  });

  it("should display validation warning for invalid elements in head", () => {
    const container = document.createElement("div");
    container.innerHTML = createWidgetHTML(`
      <title>Invalid Element Test</title>
      <meta http-equiv="set-cookie" content="session=123">
    `);
    document.body.appendChild(container);

    const virtualConsole = container.querySelector("virtual-console");
    const warnings = Array.from(virtualConsole.querySelectorAll(".warn"));
    const hasHttpEquivWarning = warnings.some((w) => w.textContent.includes("set-cookie"));
    expect(hasHttpEquivWarning).toBe(true);
  });

  it("should re-run when Results tab is clicked", () => {
    const container = document.createElement("div");
    container.innerHTML = createWidgetHTML(`
      <title>Initial Title</title>
    `);
    document.body.appendChild(container);

    const textarea = container.querySelector(".capo-widget-input");
    const resultsTab = Array.from(container.querySelectorAll('[role="tab"]')).find((t) =>
      t.textContent.includes("Results"),
    );
    const virtualConsole = container.querySelector("virtual-console");

    textarea.value = `
      <meta charset="utf-8">
    `;

    resultsTab.click();

    const warnings = Array.from(virtualConsole.querySelectorAll(".warn"));
    const hasTitleWarning = warnings.some((w) => w.textContent.includes("Expected exactly 1 <title> element"));
    expect(hasTitleWarning).toBe(true);
  });

  it("should maintain isolation between multiple widget instances", () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div id="w1">
        ${createWidgetHTML("<title>Widget 1</title>")}
      </div>
      <div id="w2">
        ${createWidgetHTML('<meta charset="utf-8">')}
      </div>
    `;
    document.body.appendChild(wrapper);

    const vc1 = wrapper.querySelector("#w1 virtual-console");
    const vc2 = wrapper.querySelector("#w2 virtual-console");

    const warnings1 = Array.from(vc1.querySelectorAll(".warn"));
    const warnings2 = Array.from(vc2.querySelectorAll(".warn"));

    expect(warnings1.some((w) => w.textContent.includes("Expected exactly 1 <title> element"))).toBe(false);
    expect(warnings2.some((w) => w.textContent.includes("Expected exactly 1 <title> element"))).toBe(true);
  });
});
