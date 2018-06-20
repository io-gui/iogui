import {html, IoElement} from "./core.js";
import "./elements.js";

export class IoDemo extends IoElement {
  static get style() {
    return html`<style>
      :host io-string,
      :host io-boolean,
      :host io-number {
        border: 1px solid #eee;
      }
      :host div.demo > io-option,
      :host div.demo > io-object {
        display: inline-block;
        border: 1px solid #eee;
        vertical-align: top;
      }
      :host div.demo {
        margin: 1em;
      }
      :host .menubar {
        background: #fec;
      }
      :host div.menuarea {
        padding: 1em;
        background: #fec;
      }
      :host div.header, span.rowlabel {
        color: rgba(128, 122, 255, 0.75);
      }
      :host span.rowlabel {
        text-align: right;
        padding-right: 0.2em;;
      }
      :host div.row > *  {
        flex: 1;
        margin: 2px;
      }
      :host .narrow {
        display: flex;
        width: 22em;
      }
      :host .sliders > io-slider {
        margin: 1em;
      }
      :host .sliders > io-number-slider {
        display: flex;
        margin: 1em;
      }
    </style>`;
  }
  static get properties() {
    return {
      number: 1337,
      string: "hello",
      boolean: true,
      null: null,
      NaN: NaN,
      undefined: undefined,
      array: Array
    };
  }
  static get listeners() {
    return {
      'value-set': '_onValueSet'
    }
  }
  _onValueSet(event) {
    this.dispatchEvent('io-object-mutated', {object: this, key: '*'}, false, window);
  }
  constructor() {
    super();
    this.array = [1, 2, 3, false, 'apple', this];
    let suboptions1 = [
      {label: 'sub_sub_one', value: 1, action: console.log},
      {label: 'sub_sub_two', value: 2, action: console.log},
      {label: 'sub_sub_three', value: 3, action: console.log},
      {label: 'sub_sub_four', value: 4, action: console.log},
      {label: 'sub_sub_five', value: 5, action: console.log}
    ];
    let suboptions0 = [
      {label: 'sub_one', options: suboptions1},
      {label: 'sub_two', options: suboptions1},
      {label: 'sub_three', options: suboptions1},
      {label: 'sub_four', options: suboptions1},
      {label: 'sub_five', options: suboptions1}
    ];
    let longOptions = [];
    for (let i = 0; i < 1000; i++) {
      let r = Math.random();
      longOptions[i] = {label: String(r), value: r, action: console.log, icon: 'ξ', hint: 'log'};
    }
    this.menuoptions = [
      {label: 'one', options: suboptions0},
      {label: 'two', value: 2, action: console.log},
      {label: 'three', value: 3, action: console.log},
      {label: 'four', value: 4, action: console.log},
      {label: 'five', options: suboptions0},
      {label: 'long', options: longOptions, hint: 'list', icon: '⚠'}
    ];
    this.options = [
      {label: 'negative one', value: -1},
      {label: 'zero', value: 0},
      {label: 'one', value: 1},
      {label: 'two', value: 2},
      {label: 'three', value: 3},
      {label: 'four', value: 4},
      {label: 'leet', value: 1337},
    ];
    let _configs = {
      'IoDemo': {
        'key:id': null,
        'key:contenteditable': null,
        'key:tabindex': null
      }
    }
    this.render([
      ['div', {className: 'demo'}, [
        ['div', {className: 'row narrow header'}, [
          ['span', {className: 'rowlabel'}],
          ['span', 'string'],
          ['span', 'number'],
          ['span', 'boolean'],
        ]],
        ['div', {className: 'row narrow'}, [
          ['span', {className: 'rowlabel'}, 'string'],
          ['io-string', {id: 'string', value: this.bind('string')}],
          ['io-number', {value: this.bind('string')}],
          ['io-boolean', {type: 'boolean', value: this.bind('string')}],
        ]],
        ['div', {className: 'row narrow'}, [
          ['span', {className: 'rowlabel'}, 'number'],
          ['io-string', {value: this.bind('number')}],
          ['io-number', {id: 'number', value: this.bind('number')}],
          ['io-boolean', {type: 'boolean', value: this.bind('number')}],
        ]],
        ['div', {className: 'row narrow'}, [
          ['span', {className: 'rowlabel'}, 'boolean'],
          ['io-string', {value: this.bind('boolean')}],
          ['io-number', {value: this.bind('boolean')}],
          ['io-boolean', {id: 'boolean', type: 'boolean', value: this.bind('boolean')}],
        ]],
        ['div', {className: 'row narrow'}, [
          ['span', {className: 'rowlabel'}, 'NaN'],
          ['io-string', {value: this.bind('NaN')}],
          ['io-number', {value: this.bind('NaN')}],
          ['io-boolean', {type: 'boolean', value: this.bind('NaN')}],
        ]],
        ['div', {className: 'row narrow'}, [
          ['span', {className: 'rowlabel'}, 'null'],
          ['io-string', {value: this.bind('null')}],
          ['io-number', {value: this.bind('null')}],
          ['io-boolean', {type: 'boolean', value: this.bind('null')}],
        ]],
        ['div', {className: 'row narrow'}, [
          ['span', {className: 'rowlabel'}, 'undefined'],
          ['io-string', {value: this.bind('undefined')}],
          ['io-number', {value: this.bind('undefined')}],
          ['io-boolean', {type: 'boolean', value: this.bind('undefined')}],
        ]],
      ]],
      ['div', {className: 'demo'}, [
        ['span', {className: 'rowlabel'}, 'io-option'],
        ['io-option', {options: this.options, value: this.bind('number')}],
      ]],
      ['div', {className: 'demo sliders'}, [
        ['span', {className: 'rowlabel'}, 'io-slider'],
        ['io-slider', {value: this.bind('number')}],
        ['io-slider', {value: this.bind('number'), step: 0.5, min: -2, max: 3}],
        ['io-slider', {value: this.bind('number'), min: 0, max: 8}]
      ]],
      ['div', {className: 'demo'}, [
        ['span', {className: 'rowlabel'}, 'io-object'],
        ['io-object', {value: this, configs: _configs, expanded: true, labeled: true}]
      ]],
      ['io-menu-group', {className: 'menubar', options: this.menuoptions, horizontal: true}],
      ['div', {className: 'demo menuarea'}, [
        ['h3', 'io-menu (click)'],
        ['io-menu', {options: this.menuoptions, position: 'pointer'}]
      ]],
      ['div', {className: 'demo menuarea'}, [
        ['h3', 'io-menu (contextmenu)'],
        ['io-menu', {options: this.menuoptions, position: 'pointer', listener: 'contextmenu'}]
      ]]
    ]);
  }
}

IoDemo.Register();
