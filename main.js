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
    const parser = new DOMParser();
    const data = parser.parseFromString(source.trim(), "application/xml");
  
    const parseError = data.querySelector("parsererror");
    if (parseError) {
      container.createDiv({
        text: `Invalid XML: ${parseError.textContent.trim()}`
      });
      return;
    }
  
    const treeContainer = container.createDiv({ cls: "xml-tree" });
  
    const declaration = source.match(/^\s*<\?xml[\s\S]*?\?>/);
    if (declaration) {
      const line = treeContainer.createDiv({ cls: "xml-line" });
      line.createSpan({ cls: "xml-toggle empty" });
      line.createSpan({ cls: "xml-declaration", text: declaration[0].trim() });
    }
  
    this.renderXmlNode(data.documentElement, treeContainer);
  }
  
  renderXmlNode(node, container) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (!text) return;
  
      const line = container.createDiv({ cls: "xml-line" });
      line.createSpan({ cls: "xml-toggle empty" });
      line.createSpan({ cls: "xml-text", text });
      return;
    }
  
    if (node.nodeType === Node.COMMENT_NODE) {
      const line = container.createDiv({ cls: "xml-line" });
      line.createSpan({ cls: "xml-toggle empty" });
      line.createSpan({ cls: "xml-comment", text: `<!--${node.textContent}-->` });
      return;
    }
  
    if (node.nodeType !== Node.ELEMENT_NODE) return;
  
    const element = node;
    const children = Array.from(element.childNodes).filter(child => {
      return child.nodeType !== Node.TEXT_NODE || child.textContent.trim();
    });
  
    const attrs = Array.from(element.attributes)
      .map(attr => ` ${attr.name}="${attr.value}"`)
      .join("");
  
    const line = container.createDiv({ cls: "xml-line" });
  
    const hasChildren = children.length > 0;
    const hasSingleTextChild =
      children.length === 1 && children[0].nodeType === Node.TEXT_NODE;
  
    const toggle = line.createSpan({ cls: "xml-toggle" });
    toggle.textContent = hasChildren && !hasSingleTextChild ? "▼" : "";
    if (!toggle.textContent) toggle.addClass("empty");
  
    if (!hasChildren) {
      line.createSpan({
        cls: "xml-tag",
        text: `<${element.tagName}${attrs}/>`
      });
      return;
    }
  
    if (hasSingleTextChild) {
      line.createSpan({
        cls: "xml-tag",
        text: `<${element.tagName}${attrs}>`
      });
      line.createSpan({
        cls: "xml-text",
        text: children[0].textContent.trim()
      });
      line.createSpan({
        cls: "xml-tag",
        text: `</${element.tagName}>`
      });
      return;
    }
  
    line.createSpan({
      cls: "xml-tag",
      text: `<${element.tagName}${attrs}>`
    });
  
    const childrenContainer = container.createDiv({ cls: "xml-node" });
  
    children.forEach(child => {
      this.renderXmlNode(child, childrenContainer);
    });
  
    const closingLine = container.createDiv({ cls: "xml-line" });
    closingLine.createSpan({ cls: "xml-toggle empty" });
    closingLine.createSpan({
      cls: "xml-tag",
      text: `</${element.tagName}>`
    });
  
    let isExpanded = true;
    toggle.onclick = () => {
      isExpanded = !isExpanded;
      toggle.textContent = isExpanded ? "▼" : "▶";
      childrenContainer.toggleClass("xml-collapsed", !isExpanded);
      closingLine.toggleClass("xml-collapsed", !isExpanded);
    };
  }
}

module.exports = XmlCollapsiblePlugin;
