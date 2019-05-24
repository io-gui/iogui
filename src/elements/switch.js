import {html} from "../core/element.js";
import {IoButton} from "./button.js";

export class IoSwitch extends IoButton {
  static get style() {
    return html`<style>
      :host {
        background: none;
        border: none;
        padding: 0;
        --io-toggle-size: calc(1.25em - calc(2 * var(--io-padding)));
      }
      :host > div {
        position: relative;
        border: var(--io-inset-border);
        border-color: var(--io-inset-border-color);
        color: var(--io-field-color);
        background-color: var(--io-field-bg);
        margin: calc(var(--io-padding) + 0.25em);
        width: calc(var(--io-toggle-size) * 2);
        height: var(--io-toggle-size);
        border-radius: var(--io-toggle-size);
      }
      :host[value] > div {
        background-color: rgba(80, 210, 355, 0.2);
      }
      :host:focus > div {
        border-color: var(--io-focus-color);
      }
      :host > div:after {
        display: inline-block;
        position: absolute;
        content: '';
        top: 0;
        left: 0;
        height: calc(var(--io-toggle-size) - calc(2 * var(--io-border-width)));
        width: calc(var(--io-toggle-size) - calc(2 * var(--io-border-width)));
        background-color: var(--io-hover-bg);
        border: var(--io-outset-border);
        border-color: var(--io-outset-border-color);
        border-radius: var(--io-toggle-size);
      }
      :host[value] > div:after {
        background-color: rgba(80, 210, 355, 0.75);
        left: calc(100% - var(--io-toggle-size));
      }
    </style>`;
  }
  static get properties() {
    return {
      value: {
        type: Boolean,
        reflect: true
      },
      role: 'switch'
    };
  }
  constructor(props) {
    super(props);
    this.__properties.action.value = this.toggle;
    this.template([['div']]);
  }
  toggle() {
    this.set('value', !this.value);
  }
  changed() {
    this.setAttribute('aria-checked', String(this.value));
  }
}

IoSwitch.Register();