import {html, IoElement} from "../io-core.js";

export class IoTheme extends IoElement {
  static get style() {
    return html`<style>
      body {
        --bg: #eee;
        --radius: 5px 5px 5px 5px;
        --spacing: 3px;
        --padding: 3px;
        --border-radius: 2px;

        --focus-border: 1px solid #09d;
        --focus-bg: #def;
        --active-bg: #ef8;
        --hover-bg: #fff;

        --frame-border: 1px solid #999;
        --frame-bg: #ccc;

        --content-border: 1px solid #999;
        --content-bg: #eee;

        --button-border: 1px solid #999;
        --button-bg: #bbb;

        --field-border: 1px solid #444;
        --field-bg: white;

        --menu-border: 1px solid #999;
        --menu-bg: #bbb;
        --menu-shadow: 2px 3px 5px rgba(0,0,0,0.2);
      }
    </style>`;
  }
}

IoTheme.Register();