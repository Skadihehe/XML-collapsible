const { Plugin } = require('obsidian');

class XmlCollapsiblePlugin extends Plugin {
  async onload() {
    console.log('Loading XML Collapsible Plugin');

    this.registerMarkdownCodeBlockProcessor('xml', (source, el, ctx) => {
      this.renderXmlTree(source, el);
    });

    this.addStyles();
  }

  onunload() {
    console.log('Unloading XML Collapsible Plugin');
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .xml-tree {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 13px;
        line-height: 1.6;
        background: var(--background-primary);
        padding: 10px;
        border-radius: 4px;
      }

      .xml-node {
        margin-left: 20px;
      }

      .xml-line {
        display: flex;
        align-items: flex-start;
        padding: 2px 0;
      }

      .xml-toggle {
        cursor: pointer;
        user-select: none;
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-right: 4px;
        color: var(--text-muted);
        flex-shrink: 0;
      }

      .xml-toggle:hover {
        color: var(--text-normal);
      }

      .xml-toggle.empty {
        visibility: hidden;
      }

      .xml-key {
        color: var(--text-accent);
        font-weight: 500;
        margin-right: 4px;
      }

      .xml-colon {
        margin-right: 4px;
        color: var(--text-muted);
      }

      .xml-value {
        color: var(--text-normal);
      }

      .xml-value.string {
        color: var(--text-success);
      }

      .xml-value.number {
        color: var(--text-warning);
      }

      .xml-value.boolean {
        color: var(--color-blue);
      }

      .xml-value.null {
        color: var(--text-faint);
        font-style: italic;
      }

      .xml-bracket {
        color: var(--text-muted);
        margin-left: 4px;
      }

      .xml-collapsed {
        display: none;
      }

      .xml-count {
        color: var(--text-faint);
        font-size: 0.9em;
        margin-left: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  renderXmlTree(source, container) {
    try {
      const parser = new DOMParser();
      const data = parser.parseFromString(source, "application/xml");
      const treeContainer = container.createDiv({ cls: 'xml-tree' });
      this.renderNode(data, treeContainer, '', true);
    } catch (e) {
      container.createDiv({ text: `Invalid XML: ${e.message}` });
    }
  }

  renderNode(value, container, key = '', isRoot = false) {
    const line = container.createDiv({ cls: 'xml-line' });

    // first line is of form <? .* ?>
    const firstLineRegex = /<?.*?>/gm;
    
    // if line segment begins with "<WORD>"
      // check if string segment contains more than one "<WORD>" tags
        // if contains more than one, then it is a parent - so create new line
      // else look for next </WORD>
          // new line after </WORD>
    if (type === 'object' || type === 'array') {
      const isArray = type === 'array';
      const children = isArray ? value : Object.entries(value);
      const isEmpty = children.length === 0;

      const toggle = line.createSpan({ cls: 'json-toggle' });
      toggle.textContent = isEmpty ? '' : '▼';
      if (isEmpty) toggle.addClass('empty');

      if (!isRoot && key) {
        line.createSpan({ cls: 'json-key', text: `"${key}"` });
        line.createSpan({ cls: 'json-colon', text: ':' });
      }

      const openBracket = isArray ? '[' : '{';
      const closeBracket = isArray ? ']' : '}';

      if (isEmpty) {
        line.createSpan({ cls: 'json-bracket', text: openBracket + closeBracket });
      } else {
        line.createSpan({ cls: 'json-bracket', text: openBracket });
        const count = line.createSpan({ cls: 'json-count', text: `${children.length} items` });
        
        const childrenContainer = container.createDiv({ cls: 'json-node' });

        if (isArray) {
          value.forEach((item, index) => {
            this.renderNode(item, childrenContainer, String(index), false);
          });
        } else {
          Object.entries(value).forEach(([k, v]) => {
            this.renderNode(v, childrenContainer, k, false);
          });
        }

        const closingLine = container.createDiv({ cls: 'json-line' });
        closingLine.createSpan({ cls: 'json-toggle empty' });
        closingLine.createSpan({ cls: 'json-bracket', text: closeBracket });

        let isExpanded = true;
        toggle.onclick = () => {
          isExpanded = !isExpanded;
          toggle.textContent = isExpanded ? '▼' : '▶';
          childrenContainer.toggleClass('json-collapsed', !isExpanded);
          closingLine.toggleClass('json-collapsed', !isExpanded);
          count.toggleClass('json-collapsed', isExpanded);
        };
      }
    } else {
      line.createSpan({ cls: 'json-toggle empty' });
      
      if (key) {
        line.createSpan({ cls: 'json-key', text: `"${key}"` });
        line.createSpan({ cls: 'json-colon', text: ':' });
      }

      const valueSpan = line.createSpan({ cls: `json-value ${type}` });
      valueSpan.textContent = this.formatValue(value, type);
    }
}

module.exports = XmlCollapsiblePlugin;
