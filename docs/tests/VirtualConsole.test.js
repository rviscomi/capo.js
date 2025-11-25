/**
 * @vitest-environment jsdom
 */
import { describe, it, beforeEach, expect } from 'vitest';
import { VirtualConsole } from '../src/lib/VirtualConsole.js';

describe('VirtualConsole', () => {
  let virtualConsole;

  beforeEach(() => {
    if (!customElements.get('virtual-console')) {
      customElements.define('virtual-console', VirtualConsole);
    }
    virtualConsole = document.createElement('virtual-console');
    document.body.appendChild(virtualConsole);
  });

  it('should clear content', () => {
    virtualConsole.innerHTML = '<span>some content</span>';
    virtualConsole.clear();
    expect(virtualConsole.innerHTML).toBe('');
  });

  it('should highlight HTML', () => {
    const html = '&lt;div class=&quot;test&quot;&gt;content&lt;/div&gt;';
    const highlighted = virtualConsole.highlightHTML(html);
    expect(highlighted).toContain('<span class="tag">div</span>');
    expect(highlighted).toContain('<span class="attr">class</span>');
    expect(highlighted).toContain('<span class="val">&quot;test&quot;</span>');
  });

  it('should highlight JSON', () => {
    const json = '&quot;key&quot;: &quot;value&quot;, &quot;number&quot;: 123, &quot;bool&quot;: true, &quot;null&quot;: null';
    const highlighted = virtualConsole.highlightJSON(json);
    expect(highlighted).toContain('<span class="key">&quot;key&quot;:</span>');
    expect(highlighted).toContain('<span class="string">&quot;value&quot;</span>');
    expect(highlighted).toContain('<span class="number">123</span>');
    expect(highlighted).toContain('<span class="boolean">true</span>');
    expect(highlighted).toContain('<span class="null">null</span>');
  });

  it('should render log elements', () => {
    virtualConsole.log('test message');
    const logDiv = virtualConsole.querySelector('.log');
    expect(logDiv).toBeTruthy();
    expect(logDiv.textContent).toBe('test message');
  });

  it('should render warn elements', () => {
    virtualConsole.warn('warning message');
    const warnDiv = virtualConsole.querySelector('.warn');
    expect(warnDiv).toBeTruthy();
    expect(warnDiv.textContent).toBe('warning message');
  });

  it('should render error elements', () => {
    virtualConsole.error('error message');
    const errorDiv = virtualConsole.querySelector('.error');
    expect(errorDiv).toBeTruthy();
    expect(errorDiv.textContent).toBe('error message');
  });

  it('should handle grouped logs', () => {
    virtualConsole.groupCollapsed('group title');
    virtualConsole.log('grouped message');
    virtualConsole.groupEnd();

    const details = virtualConsole.querySelector('details');
    expect(details).toBeTruthy();
    const summary = details.querySelector('summary');
    expect(summary.textContent).toBe('group title');
    const logDiv = details.querySelector('.log');
    expect(logDiv).toBeTruthy();
    expect(logDiv.textContent).toBe('grouped message');
  });

  it('should render numbers with weight class', () => {
    const output = virtualConsole.renderLog(123);
    expect(output).toBe('<span class="weight">123</span>');
  });

  it('should render elements with highlighted HTML', () => {
    const div = document.createElement('div');
    div.className = 'test';
    const output = virtualConsole.renderLog(div);
    expect(output).toContain('<span class="tag">div</span>');
    expect(output).toContain('<span class="attr">class</span>');
  });

  it('should render objects with highlighted JSON', () => {
    const obj = { key: 'value' };
    const output = virtualConsole.renderLog(obj);
    expect(output).toContain('<pre>');
    expect(output).toContain('<span class="key">&quot;key&quot;:</span>');
  });

  it('should handle console style formatting', () => {
    const output = virtualConsole.renderLog('%cstyled text', 'color: red');
    expect(output).toContain('<span class="color-bar-item" style="color: red">styled text</span>');
  });

  it('should handle color bar formatting', () => {
    const output = virtualConsole.renderLog('%c ', 'background-color: red', '%c ', 'background-color: blue');
    expect(output).toContain('<div class="color-bar">');
    expect(output).toContain('background-color: red');
    expect(output).toContain('background-color: blue');
  });
});
