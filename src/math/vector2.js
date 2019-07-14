import {html, IoElement} from "../io.js";

export class IoVector2 extends IoElement {
  static get Style() {
    return html`<style>
      :host {
        display: flex;
        flex-direction: row;
      }
      :host > io-number {
        flex: 1 1 auto;
      }
      :host > io-number:not(:last-child) {
        margin-right: var(--io-spacing);
      }
      :host > io-boolean {
        border-color: transparent;
        background: none;
      }
      :host > io-boolean:not([value]) {
        opacity: 0.25;
      }
    </style>`;
  }
  static get Properties() {
    return {
      value: [0, 0],
      conversion: 1,
      step: 0.001,
      min: -Infinity,
      max: Infinity,
      canlink: false,
      linked: false,
      _components: [0, 1],
    };
  }
  _onValueSet(event) {
    const item = event.composedPath()[0];
    const prop = item.id;
    if (prop !== null) {
      const value = event.detail.value;
      const oldValue = event.detail.oldValue;
      this.value[prop] = value;

      if (this.linked) {
        const change = value / oldValue;
        for (let i in this._components) {
          const p = this._components[i];
          if (oldValue === 0) {
            this.value[p] = value;
          } else if (p !== prop) {
            this.value[p] *= change;
          }
        }
      }
      // TODO: test
      const detail = {object: this.value, prop: this.linked ? null : prop, value: value, oldValue: oldValue};
      this.dispatchEvent('object-mutated', detail, false, window);
    }
  }
  valueChanged() {
    this._components = this.value instanceof Array ? [0, 1] : ['x', 'y'];
  }
  changed() {
    const elements = [];
    for (let i in this._components) {
      const prop = this._components[i];
      if (this.value[prop] !== undefined) {
        elements.push(['io-number', {
          id: prop,
          value: this.value[prop],
          conversion: this.conversion,
          step: this.step,
          min: this.min,
          max: this.max,
          'on-value-set': this._onValueSet
        }]);
      }
    }
    if (this.canlink) {
      elements.push(['io-boolean', {value: this.bind('linked'), true: '🔗', false: '🔗'}]);
    }
    this.template(elements);
  }
}

IoVector2.Register();
