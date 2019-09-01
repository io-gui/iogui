import {html} from "../../io.js";
import {IoSelector} from "./selector.js";
// TODO: remove io-menu-options dependency.

export class IoSelectorTabs extends IoSelector {
  static get Style() {
    return html`<style>
    :host {
      flex-direction: column;
      align-self: stretch;
      justify-self: stretch;
      flex: 1 1 auto;
    }
    :host > io-menu-options {
      flex: 0 0 auto;
      border: none;
      border-radius: 0;
      background-color: var(--io-background-color-dark);
    }
    :host > .io-content {
      border: var(--io-border);
      border-width: var(--io-border-width) 0 0 0;
      padding: 0;
      box-shadow: none;
      border-radius: 0;
    }
    </style>`;
  }
  static get Properties() {
    return {
      options: {
        type: Array,
        observe: true,
      },
      slotted: {
        type: Array,
        observe: true,
      },
    };
  }
  _onValueSet(event) {
    this.set('selected', event.detail.value.toLowerCase());
  }
  _onScroll() {
    super._onScroll();
    if (this.$.tabs.selected !== this.selected) {
      let hasOption = !!this.filterObject(this.options, (option) => {
        return String(option).toLowerCase() === this.selected || String(option.value).toLowerCase() === this.selected;
      });
      if (hasOption) this.$.tabs.selected = this.selected;
    }
  }
  renderShadow() {
    const tabs = [
      ['io-menu-options', {
        id: 'tabs',
        role: 'navigation',
        horizontal: true,
        value: this.selected,
        options: this.options.length ? this.options : this.elements.map(element => { return element[1].name; }),
        slotted: this.slotted,
        selectable: true,
        'on-value-set': this._onValueSet,
      }],
    ];
    this.template([tabs, ['div', {id: 'content', class: 'io-content'}]]);
  }
}

IoSelectorTabs.Register();
