import { run } from './capo.js';

export function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function highlightHTML(code) {
  const escaped = escapeHTML(code);
  return escaped.replace(/&lt;(\/?)([\w-]+)(.*?)&gt;/g, (match, slash, tag, attrs) => {
    const highlightedAttrs = attrs.replace(
      / ([\w-]+)=(&quot;.*?&quot;|&#039;.*?&#039;|"[^"]*"|'[^\']*'|[^\s&]+)/g,
      ' <span class="attr">$1</span>=<span class="val">$2</span>'
    );
    return `&lt;${slash}<span class="tag">${tag}</span>${highlightedAttrs}&gt;`;
  });
}

export class CapoWidgetElement extends HTMLElement {
  connectedCallback() {
    this.init();
  }

  init() {
    this.textarea = this.querySelector('.capo-widget-input');
    this.highlightPre = this.querySelector('.capo-widget-highlight');
    this.code = this.querySelector('.capo-widget-code');
    this.virtualConsole = this.querySelector('virtual-console');

    if (this.textarea) {
      this.textarea.addEventListener('input', () => {
        this.syncHighlight();
      });
      this.textarea.addEventListener('scroll', () => {
        this.syncScroll();
      });
      this.syncHighlight();
    }

    // Re-run whenever user switches to Results tab
    this.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab) {
        const tabText = (tab.textContent || '').trim().toUpperCase();
        if (tabText.includes('RESULTS')) {
          this.runCapo();
        }
      }
    });

    // Auto-run initial snippet on mount
    this.runCapo();
  }

  syncHighlight() {
    if (!this.textarea || !this.code) return;
    this.code.innerHTML = highlightHTML(this.textarea.value) + '\n';
    this.syncScroll();
  }

  syncScroll() {
    if (!this.textarea || !this.highlightPre) return;
    this.highlightPre.scrollTop = this.textarea.scrollTop;
    this.highlightPre.scrollLeft = this.textarea.scrollLeft;
  }

  runCapo() {
    if (!this.textarea || !this.virtualConsole) return;
    const html = this.textarea.value;
    try {
      this.virtualConsole.clear();
      run(html, this.virtualConsole);
    } catch (e) {
      console.error('Capo widget execution error:', e);
    }
  }
}
