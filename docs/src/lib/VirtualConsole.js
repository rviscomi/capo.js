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
    args.forEach((arg, i) => {
      if (!arg) {
        return;
      }

      if (arg instanceof HTMLElement) {
        // Stringify element
        output.push(escapeHTML(arg.outerHTML));
        return;
      }
      
      if (typeof arg == 'string') {
        // Handle console styles
        const fragments = arg.split('%c');
        if (fragments.length == 1) {
          output.push(escapeHTML(arg));
          return;
        }

        for (let j = 1; j < fragments.length; j++) {
          const fragment = escapeHTML(fragments[j]);
          // The subsequent arg is the style for this fragment
          fragments[j] = `<span style="${args[i + j]}">${fragment}</span>`;
          delete args[i + j];
        }

        output.push(fragments.map(nlToBr).join(''));
      }
    });

    return output.join(' ');
  }

  logAtLevel(level, ...args) {
    return;
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
    /* this.group = document.createElement('details');
    const summary = document.createElement('summary');
    summary.innerHTML = this.renderLog(...args);
    this.group.appendChild(summary); */
    console.groupCollapsed(...args);
  }

  groupEnd(...args) {
    /* this.rootElement.appendChild(this.group); */
    this.group = null;
    console.groupEnd(...args);
  }

}

function nlToBr(str) {
  return str.replace(/\n/g, '<br>');
}

function escapeHTML(str) {
  return str.replace(/<([^>]*>)[^<]*(<.*)/g, '<span style="font-family: monospace;">&lt;$1&hellip;');
}
