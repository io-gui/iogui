import {Binding} from './binding.js';

/**
 * Property configuration object for a class **prototype**.
 * It is generated from property definitions in `static get Properties()` return object.
 * @property {*} value - Default value.
 * @property {function} type - Constructor of value.
 * @property {number} reflect - Reflects to HTML attribute
 * @property {boolean} notify - Trigger change handlers and change events.
 * @property {boolean} observe - Observe object mutations for this property.
 * @property {boolean} readonly - Makes the property readonly. // TODO: document and test
 * @property {boolean} strict - Enforce stric typing. // TODO: document and test
 * @property {boolean} enumerable - Makes property enumerable.
 * @property {Binding} binding - Binding object.
 */
class ProtoProperty {
  /**
   * Creates the property configuration object and sets the default values.
   * @param {ProtoProperty} prop - Configuration object.
   * @param {boolean} noDefaults - Assign default values.
   */
  constructor(prop, noDefaults) {

    if (!noDefaults) {
      this.value = undefined;
      this.type = undefined;
      this.reflect = 0;
      this.notify = true;
      this.observe = false;
      this.readonly = false;
      this.strict = false;
      this.enumerable = true;
      this.binding = undefined;
    }

    if (prop === undefined || prop === null) {

      prop = {value: prop};

    } else if (typeof prop === 'function') {

      prop = {type: prop};

    } else if (prop instanceof Binding) {

      prop = {binding: prop};

    } else if (!(prop && prop.constructor === Object)) {

      prop = {value: prop};

    }

    if (prop.type === undefined) {

      if (prop.value !== undefined && prop.value !== null) {

        prop.type = prop.value.constructor;

      }

    }

    if (prop.value !== undefined) this.value = prop.value;
    if (typeof prop.type === 'function') this.type = prop.type;
    if (typeof prop.reflect == 'number') this.reflect = prop.reflect;
    if (typeof prop.notify == 'boolean') this.notify = prop.notify;
    if (typeof prop.observe == 'boolean') this.observe = prop.observe;
    if (typeof prop.readonly == 'boolean') this.readonly = prop.readonly;
    if (typeof prop.strict == 'boolean') this.strict = prop.strict;
    if (typeof prop.enumerable == 'boolean') this.enumerable = prop.enumerable;
    if (prop.binding instanceof Binding) this.binding = prop.binding;

    return this;
  }
}

/**
 * Property configuration object for a class **instance**.
 * It is copied from the corresponding `ProtoProperty`.
 * @property {*} value - Property value.
 * @property {function} type - Constructor of the property value.
 * @property {number} reflect - HTML attribute [-1, 0, 1 or 2]
 * @property {boolean} notify - Enables change handlers and events.
 * @property {boolean} observe - Observe object mutations for this property.
 * @property {boolean} readonly - Makes the property readonly. // TODO: document and test
 * @property {boolean} strict - Enforce stric typing. // TODO: document and test
 * @property {boolean} enumerable - Makes property enumerable.
 * @property {Binding} binding - Binding object.
 */
class Property {
  /**
   * Creates the property configuration object and copies values from `ProtoProperty`.
   * @param {ProtoProperty} protoProp - ProtoProperty.
   */
  constructor(protoProp) {
    this.value = protoProp.value;
    this.type = protoProp.type;
    this.reflect = protoProp.reflect;
    this.notify = protoProp.notify;
    this.observe = protoProp.observe;
    this.readonly = protoProp.readonly;
    this.strict = protoProp.strict;
    this.enumerable = protoProp.enumerable;
    this.binding = protoProp.binding;

    if (this.binding instanceof Binding) this.value = this.binding.value;
    else if (this.value === undefined) {
      if (typeof this.type === 'function') {
        if (this.type === Boolean) this.value = false;
        else if (this.type === String) this.value = '';
        else if (this.type === Number) this.value = 0;
        else if (this.type === Array) this.value = [];
        else if (this.type === Object) this.value = {};
        else this.value = new this.type();
      }
    } else {
      if (this.type === Array && this.value instanceof Array) {
        this.value = [...this.value];
      } else if (this.type === Object && this.value instanceof Object) {
        this.value = Object.assign({}, this.value);
      }
    }

    debug:
    if ([-1, 0, 1, 2].indexOf(this.reflect) == -1) {
      console.error(`Invalid reflect value ${this.reflect}!`);
    }
  }
}

/**
 * Collection of all property configurations for a class **prototype**.
 * Property configurations are inferred from all property definitions in the prototype chain.
 */
class ProtoProperties {
  /**
   * Creates all property configurations for specified prototype chain.
   * @param {ProtoChain} protochain - Prototype chain.
   */
  constructor(protochain) {
    for (let i = protochain.length; i--;) {
      const props = protochain[i].constructor.Properties;
      for (let p in props) {
        if (!this[p]) this[p] = new ProtoProperty(props[p]);
        else Object.assign(this[p], new ProtoProperty(props[p], true));
        if (p.charAt(0) === '_') {
          this[p].notify = false;
          this[p].enumerable = false;
        }
      }
    }
  }
}

/**
 * Collection of all property configurations and values for a class **instance** compied from corresponding `ProtoProperties`.
 * It also takes care of attribute reflections, binding connections and queue dispatch scheduling.
 */
class Properties {
  /**
   * Creates the properties for specified `Node`.
   * @param {Node} node - Owner instance of `Node`.
   * @param {ProtoProperties} protoProps - Configuration object.
   */
  constructor(node, protoProps) {
    Object.defineProperty(this, '__node', {enumerable: false, configurable: true, value: node});
    Object.defineProperty(this, '__connected', {enumerable: false, writable: true, value: false});
    for (let prop in protoProps) {
      Object.defineProperty(this, prop, {
        value: new Property(protoProps[prop]),
        enumerable: protoProps[prop].enumerable,
        configurable: true
      });
      const value = this[prop].value;
      if (value !== undefined && value !== null) {
        // TODO: document special handling of object and node values
        if (typeof value === 'object') {
          node.queue(prop, value, undefined);
          if (value.__isNode && node.__connected) value.connect(node);
        } else if (this[prop].reflect >= 1 && node.__isIoElement) {
          // TODO: figure out how to resolve bi-directionsl reflection when attributes are set in html (role, etc...)
          node.setAttribute(prop, value);
        }
      }
      const binding = this[prop].binding;
      if (binding) binding.addTarget(node, prop);
    }
    Object.defineProperty(this, '__keys', {enumerable: false, configurable: true, value: Object.keys(this)});
  }
  /**
   * Returns the property value.
   * @param {string} key - property name.
   * @return {*} Property value.
   */
  get(key) {
    return this[key].value;
  }
  /**
   * Sets the property value, connects the bindings and sets attributes for properties with attribute reflection enabled.
   * @param {string} key - property name.
   * @param {*} value - property value or binding.
   * @param {boolean} skipDispatch - Skips queue dispatch if `true`.
   */
  set(key, value, skipDispatch) {

    const prop = this[key];
    const oldValue = prop.value;

    if (value !== oldValue) {

      const node = this.__node;
      const binding = (value instanceof Binding) ? value : undefined;

      if (binding) {

        const oldBinding = prop.binding;
        if (oldBinding && binding !== oldBinding) {
          oldBinding.removeTarget(node, key);
        }

        binding.addTarget(node, key);
        value = binding.source[binding.sourceProp];

      } else {

        if (prop.strict && prop.type && !(value instanceof prop.type)) {
          debug: {
            console.warn(`IoGUI strict type mismatch for "${key}" property! Value automatically converted to "${prop.type.name}."`);
          }
          value = new prop.type(value);
        }

      }

      prop.value = value;

      debug:
      {
        if (prop.type == String) {
          if (typeof value !== 'string') {
            console.warn(`Wrong type of property "${key}". Value: "${value}". Expected type: ${prop.type.name}`, this.__node);
          }
        } else if (prop.type == Number) {
          if (typeof value !== 'number') {
            console.warn(`Wrong type of property "${key}". Value: "${value}". Expected type: ${prop.type.name}`, this.__node);
          }
        } else if (prop.type == Boolean) {
          if (typeof value !== 'boolean') {
            console.warn(`Wrong type of property "${key}". Value: "${value}". Expected type: ${prop.type.name}`, this.__node);
          }
        } else if (prop.type) {
          if (!(value instanceof prop.type)) {
            console.warn(`Wrong type of property "${key}". Value: "${value}". Expected type: ${prop.type.name}`, this.__node);
          }
        }
      }


      if (value && value.__isNode && !value.__isIoElement) value.connect(node);
      if (oldValue && oldValue.__isNode && oldValue.__connected && !oldValue.__isIoElement) oldValue.disconnect(node);

      if (prop.notify && oldValue !== value) {
        node.queue(key, value, oldValue);
        if (node.__connected && !skipDispatch) {
          node.queueDispatch();
        }
      }

      if (prop.reflect >= 1 && node.__isIoElement) node.setAttribute(key, value);
    }

  }
  /**
   * Connects all property bindings and `Node` properties.
   */
  connect() {
    this.__connected = true;
    for (let i = this.__keys.length; i--;) {
      const p = this.__keys[i];
      if (this[p].binding) {
        this[p].binding.addTarget(this.__node, p);
      }
      // TODO: investigate and test element property connections - possible clash with element's native `disconenctedCallback()`
      if (this[p].value && this[p].value.__isNode && !this[p].value.__connected && !this[p].value.__isIoElement) {
        this[p].value.connect(this.__node);
      }
    }
  }
  /**
   * Disconnects all property bindings and `Node` properties.
   */
  disconnect() {
    this.__connected = false;
    for (let i = this.__keys.length; i--;) {
      const p = this.__keys[i];
      if (this[p].binding) {
        this[p].binding.removeTarget(this.__node, p);
      }
      // TODO: investigate and test element property connections
      // possible clash with element's native `disconenctedCallback()`
      // TODO: fix BUG - diconnecting already disconencted.
      if (this[p].value && this[p].value.__isNode && !this[p].value.__isIoElement) {
        // TODO: remove this workaround once the bug is fixed properly.
        if (this[p].value.__connections.indexOf(this.__node) !== -1) {
          this[p].value.disconnect(this.__node);
        }
      }
    }
  }
  /**
   * Disconnects all property bindings and `Node` properties.
   * Use this when properties are no loner needed.
   */
  dispose() {
    this.disconnect();
    delete this['__node'];
    delete this['__keys'];
  }
}

export {ProtoProperty, ProtoProperties, Property, Properties};