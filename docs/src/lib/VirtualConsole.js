export class VirtualConsole extends HTMLElement {
  constructor() {
    super();
    this.group = null;
  }

  clear() {
    this.innerHTML = '';
  }

  highlightHTML(html) {
    return html.replace(/&lt;(\/?)([\w-]+)(.*?)&gt;/g, (match, slash, tag, attrs) => {
      const highlightedAttrs = attrs.replace(/ ([\w-]+)=(&quot;.*?&quot;)/g, ' <span class="attr">$1</span>=<span class="val">$2</span>');
      return `&lt;${slash}<span class="tag">${tag}</span>${highlightedAttrs}&gt;`;
    });
  }

  highlightJSON(json) {
    return json.replace(/(&quot;.*?&quot;(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'number';
      if (/^&quot;/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return `<span class="${cls}">${match}</span>`;
    });
  }

  renderLog(...args) {
    let output = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === undefined || arg === null) {
        continue;
      }

      if (typeof arg === 'number' || (typeof arg === 'string' && /^\d+$/.test(arg.trim()))) {
        output.push(this.renderNumber(arg));
        continue;
      }

      if (typeof arg === 'object' && arg !== null) {
        if (arg instanceof HTMLElement) {
          output.push(this.renderElement(arg));
        } else {
          output.push(this.renderObject(arg));
        }
        continue;
      }
      
      if (typeof arg == 'string') {
        const { html, skipArgs } = this.renderConsoleStyle(arg, args, i);
        output.push(html);
        i += skipArgs;
      }
    }

    return output.join(' ');
  }

  renderNumber(arg) {
    return `<span class="weight">${escapeHTML(String(arg))}</span>`;
  }

  renderElement(arg) {
    let html = escapeHTML(arg.outerHTML);
    return this.highlightHTML(html);
  }

  renderObject(arg) {
    let json = escapeHTML(JSON.stringify(arg, null, 2));
    return `<pre>${this.highlightJSON(json)}</pre>`;
  }

  renderConsoleStyle(arg, args, index) {
    const fragments = arg.split('%c');
    if (fragments.length == 1) {
      return { html: escapeHTML(arg), skipArgs: 0 };
    }

    let currentGroup = [];
    let result = [];
    result.push(nlToBr(escapeHTML(fragments[0])));

    let skipArgs = 0;
    for (let j = 1; j < fragments.length; j++) {
      const fragment = fragments[j];
      const styleArg = args[index + j];
      if (!styleArg) {
        continue;
      }
      const style = styleArg.split(';').find(s => {
        return s.split(':')[0].trim() == 'background-color' || s.split(':')[0].trim() == 'background-image';
      }) || styleArg;
      const isColorBarSpan = style && (style.includes('background-color') || style.includes('background-image')) && (fragment === ' ' || fragment === '');
      const span = `<span class="color-bar-item" style="${style}">${nlToBr(escapeHTML(fragment))}</span>`;

      if (isColorBarSpan) {
        currentGroup.push(span);
      } else {
        if (currentGroup.length > 0) {
          result.push(`<div class="color-bar">${currentGroup.join('')}</div>`);
          currentGroup = [];
        }
        result.push(span);
      }
      skipArgs++;
    }
    if (currentGroup.length > 0) {
      result.push(`<div class="color-bar">${currentGroup.join('')}</div>`);
    }

    return { html: result.join(''), skipArgs };
  }

  logAtLevel(level, ...args) {
    const div = document.createElement('div');
    div.classList.add(level);
    div.innerHTML = this.renderLog(...args);

    if (this.group) {
      this.group.appendChild(div);
    } else {
      this.appendChild(div);
    }
  }

  log(...args) {
    this.logAtLevel('log', ...args);
    console.log(...args);
  }

  warn(...args) {
    this.logAtLevel('warn', ...args);
    console.warn(...args);
  }

  error(...args) {
    this.logAtLevel('error', ...args);
    console.error(...args);
  }

  groupCollapsed(...args) {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
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
      if (parent && parent.tagName === 'DETAILS') {
        this.group = parent;
      } else {
        this.group = null;
      }
    }
    console.groupEnd(...args);
  }
}

export function nlToBr(str) {
  return str.replace(/\n/g, '<br>');
}

export function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
