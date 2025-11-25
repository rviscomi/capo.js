export class VirtualConsole {

  constructor(rootElement) {
    this.rootElement = rootElement;
    this.group = null;
  }

  clear() {
    this.rootElement.innerHTML = '';
  }

  renderLog(...args) {
    let output = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === undefined || arg === null) {
        continue;
      }

      if (typeof arg === 'number') {
        output.push(`<span class="weight">${arg}</span>`);
        continue;
      }

      if (typeof arg === 'string' && /^\d+$/.test(arg.trim())) {
        output.push(`<span class="weight">${escapeHTML(arg)}</span>`);
        continue;
      }

      if (typeof arg === 'object' && arg !== null) {
        if (arg instanceof HTMLElement) {
        // Stringify element
          let html = escapeHTML(arg.outerHTML);
          output.push(html);
          continue;
        }
        let json = `<pre>${escapeHTML(JSON.stringify(arg, null, 2))}</pre>`;
        output.push(json);
        continue;
      }
      
      if (typeof arg == 'string') {
        // Handle console styles
        const fragments = arg.split('%c');
        if (fragments.length == 1) {
          output.push(escapeHTML(arg));
          continue;
        }

        let currentGroup = [];
        let result = [];
        result.push(nlToBr(escapeHTML(fragments[0])));

        for (let j = 1; j < fragments.length; j++) {
          const fragment = fragments[j];
          const style = args[i + j];
          const isColorBarSpan = style && (style.includes('background-color') || style.includes('background-image')) && (fragment === ' ' || fragment === '');
          const span = `<span style="${style}">${nlToBr(escapeHTML(fragment))}</span>`;

          if (isColorBarSpan) {
            currentGroup.push(span);
          } else {
            if (currentGroup.length > 0) {
              result.push(`<div class="color-bar">${currentGroup.join('')}</div>`);
              currentGroup = [];
            }
            result.push(span);
          }
          delete args[i + j];
        }
        if (currentGroup.length > 0) {
          result.push(`<div class="color-bar">${currentGroup.join('')}</div>`);
        }

        output.push(result.join(''));
      }
    }

    return output.join(' ');
  }

  logAtLevel(level, ...args) {
    const div = document.createElement('div');
    div.classList.add(level);
    div.innerHTML = this.renderLog(...args);

    if (this.group) {
      this.group.appendChild(div);
    } else {
      this.rootElement.appendChild(div);
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
      this.rootElement.appendChild(details);
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

function nlToBr(str) {
  return str.replace(/\n/g, '<br>');
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
