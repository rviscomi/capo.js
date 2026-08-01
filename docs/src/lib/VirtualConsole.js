export class VirtualConsole extends HTMLElement {
  constructor() {
    super();
    this.group = null;
  }

  clear() {
    this.innerHTML = "";
  }

  highlightHTML(html) {
    return html.replace(/&lt;(\/?)([\w-]+)(.*?)&gt;/g, (match, slash, tag, attrs) => {
      const highlightedAttrs = attrs.replace(
        / ([\w-]+)=(&quot;.*?&quot;)/g,
        ' <span class="attr">$1</span>=<span class="val">$2</span>',
      );
      return `&lt;${slash}<span class="tag">${tag}</span>${highlightedAttrs}&gt;`;
    });
  }

  highlightJSON(json) {
    return json.replace(
      /(&quot;.*?&quot;(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "number";
        if (/^&quot;/.test(match)) {
          if (/:$/.test(match)) {
            cls = "key";
          } else {
            cls = "string";
          }
        } else if (/true|false/.test(match)) {
          cls = "boolean";
        } else if (/null/.test(match)) {
          cls = "null";
        }
        return `<span class="${cls}">${match}</span>`;
      },
    );
  }

  renderLog(...args) {
    let output = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === undefined || arg === null || arg === "") {
        continue;
      }

      if (typeof arg === "number" || (typeof arg === "string" && /^\d+$/.test(arg.trim()))) {
        output.push(this.renderNumber(arg));
        continue;
      }

      if (typeof arg === "object" && arg !== null) {
        if (arg instanceof HTMLElement) {
          output.push(this.renderElement(arg));
        } else {
          output.push(this.renderObject(arg));
        }
        continue;
      }

      if (typeof arg == "string") {
        const { html, skipArgs } = this.renderConsoleStyle(arg, args, i);
        if (html) {
          output.push(html);
        }
        i += skipArgs;
      }
    }

    let result = "";
    for (let i = 0; i < output.length; i++) {
      const current = output[i];
      if (!current) continue;
      if (result.length === 0) {
        result += current;
      } else {
        const prev = output[i - 1];
        const isPrevBlock = /data-console-block="true"/i.test(prev);
        const isCurrBlock = /data-console-block="true"/i.test(current);
        if (isPrevBlock || isCurrBlock) {
          result += current;
        } else {
          result += " " + current;
        }
      }
    }
    return result;
  }

  renderNumber(arg) {
    return `<span class="weight">${escapeHTML(String(arg))}</span>`;
  }

  renderElement(arg) {
    let html = escapeHTML(arg.outerHTML);
    return `<span class="console-element" data-console-block="true">${this.highlightHTML(html)}</span>`;
  }

  renderObject(arg) {
    let json = escapeHTML(
      JSON.stringify(
        arg,
        (key, value) => {
          if (typeof HTMLElement !== "undefined" && value instanceof HTMLElement) {
            return value.outerHTML;
          }
          return value;
        },
        2,
      ),
    );
    return `<pre data-console-block="true">${this.highlightJSON(json)}</pre>`;
  }

  renderConsoleStyle(arg, args, index) {
    const fragments = arg.split("%c");
    if (fragments.length == 1) {
      return { html: linkifyURLs(escapeHTML(arg)), skipArgs: 0 };
    }

    let currentGroup = [];
    let result = [];
    result.push(linkifyURLs(nlToBr(escapeHTML(fragments[0]))));

    let skipArgs = 0;
    for (let j = 1; j < fragments.length; j++) {
      const fragment = fragments[j];
      const styleArg = args[index + j];
      if (!styleArg) {
        continue;
      }
      const style =
        styleArg.split(";").find((s) => {
          return s.split(":")[0].trim() == "background-color" || s.split(":")[0].trim() == "background-image";
        }) || styleArg;
      const isColorBarSpan =
        style &&
        (style.includes("background-color") || style.includes("background-image")) &&
        (fragment === " " || fragment === "");
      const span = `<span class="color-bar-item" style="${style}">${linkifyURLs(nlToBr(escapeHTML(fragment)))}</span>`;

      if (isColorBarSpan) {
        currentGroup.push(span);
      } else {
        if (currentGroup.length > 0) {
          result.push(`<div class="color-bar" data-console-block="true">${currentGroup.join("")}</div>`);
          currentGroup = [];
        }
        result.push(span);
      }
      skipArgs++;
    }
    if (currentGroup.length > 0) {
      result.push(`<div class="color-bar" data-console-block="true">${currentGroup.join("")}</div>`);
    }

    return { html: result.join(""), skipArgs };
  }

  logAtLevel(level, ...args) {
    const div = document.createElement("div");
    div.classList.add(level);
    div.innerHTML = this.renderLog(...args);

    if (this.group) {
      this.group.appendChild(div);
    } else {
      this.appendChild(div);
    }
  }

  log(...args) {
    this.logAtLevel("log", ...args);
    console.log(...args);
  }

  warn(...args) {
    this.logAtLevel("warn", ...args);
    console.warn(...args);
  }

  error(...args) {
    this.logAtLevel("error", ...args);
    console.error(...args);
  }

  groupCollapsed(...args) {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.innerHTML = this.renderLog(...args);
    details.appendChild(summary);

    if (this.group) {
      this.group.appendChild(details);
    } else {
      this.appendChild(details);
    }
    this.group = details;
    console.groupCollapsed(...args);
  }

  groupEnd(...args) {
    if (this.group) {
      // Move up one level if possible, or back to root
      const parent = this.group.parentElement;
      if (parent && parent.tagName === "DETAILS") {
        this.group = parent;
      } else {
        this.group = null;
      }
    }
    console.groupEnd(...args);
  }
}

export function nlToBr(str) {
  return str.replace(/\n/g, "<br>");
}

export function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function linkifyURLs(str) {
  return str.replace(/(https?:\/\/[^\s<"']+)/g, (match) => {
    let url = match;
    let trailing = "";
    const puncMatch = url.match(/[.,;)\]]+$/);
    if (puncMatch) {
      trailing = puncMatch[0];
      url = url.slice(0, -trailing.length);
    }
    const safeHref = url
      .replace(/"/g, "%22")
      .replace(/&amp;quot;/g, "%22")
      .replace(/&quot;/g, "%22");
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="vc-link">${url}</a>${trailing}`;
  });
}
