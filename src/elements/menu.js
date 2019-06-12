import {IoElement} from "../core/element.js";
import {IoMenuLayer} from "./menu-layer.js";

// TODO: implement keyboard modifiers maybe. Touch alternative?
export class IoMenu extends IoElement {
  static get properties() {
    return {
      options: Array,
      expanded: Boolean,
      position: 'pointer',
      button: 0,
    };
  }
  constructor(props) {
    super(props);
    this.template([
      ['io-menu-options', {
        id: 'group',
        $parent: this,
        options: this.bind('options'),
        position: this.bind('position'),
        expanded: this.bind('expanded')
      }]
    ]);
  }
  connectedCallback() {
    super.connectedCallback();
    this.parentElement.addEventListener('mousedown', this._onMousedown);
    this.parentElement.addEventListener('touchstart', this._onTouchstart);
    this.parentElement.addEventListener('contextmenu', this._onContextmenu);
    IoMenuLayer.singleton.appendChild(this.$['group']);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.parentElement.removeEventListener('mousedown', this._onMousedown);
    this.parentElement.removeEventListener('touchstart', this._onTouchstart);
    this.parentElement.removeEventListener('touchmove', this._onTouchmove);
    this.parentElement.removeEventListener('touchend', this._onTouchend);
    this.parentElement.removeEventListener('contextmenu', this._onContextmenu);
    if (this.$['group']) IoMenuLayer.singleton.removeChild(this.$['group']);
  }
  getBoundingClientRect() {
    return this.parentElement.getBoundingClientRect();
  }
  _onContextmenu(event) {
    if (this.button === 2) {
      event.preventDefault();
      this.open(event);
    }
  }
  _onMousedown(event) {
    if (event.button === this.button && event.button !== 2) {
      this.open(event);
    }
  }
  _onTouchstart(event) {
    if (this.button !== 2) {
      event.preventDefault();
      this.open(event.changedTouches[0]);
    }
    this.parentElement.addEventListener('touchmove', this._onTouchmove);
    this.parentElement.addEventListener('touchend', this._onTouchend);
  }
  _onTouchmove(event) {
    if (this.expanded) event.preventDefault();
    IoMenuLayer.singleton._onTouchmove(event);
  }
  _onTouchend(event) {
    this.parentElement.removeEventListener('touchmove', this._onTouchmove);
    this.parentElement.removeEventListener('touchend', this._onTouchend);
    IoMenuLayer.singleton._onTouchend(event);
  }
  expandedChanged() {
    if (this.expanded) {
      this._focused = document.activeElement;
      // console.log(this._focused);
      // setTimeout(() => {
      //   if (this.$.group.firstChild) this.$.group.firstChild.focus();
      // }, 100);
    } else {
      if (this._focused) this._focused.focus();
      delete this._focused;
    }
  }
  open(event) {
    IoMenuLayer.singleton.collapseAllGroups();
    IoMenuLayer.singleton._x = event.clientX;
    IoMenuLayer.singleton._y = event.clientY;
    IoMenuLayer.singleton.collapseOnPointerup = false;
    window.getSelection().removeAllRanges();
    this.expanded = true;
  }
}

IoMenu.Register();
