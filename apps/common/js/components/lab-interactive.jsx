import React from 'react';
import iframePhone from 'iframe-phone';
import extend from '../tools/extend';

const LAB_PROPS_UPDATE_MIN_INTERVAL = 75; // ms

export default class LabInteractive extends React.Component {
  componentDidMount() {
    this._phone = new iframePhone.ParentEndpoint(this.refs.iframe);
    this._labUpdateTimeoutID = null;
    this._labPropsToSet = {};

    this.loadInteractive(this.props.interactive, this.props.model);
    this._phone.addListener('modelLoaded', () => {
      this.props.onModelLoaded();
      this.setLabProperties(this.props.labProps);
      this.addLabListeners(this.props.labObservedProps);
      this.setLabPlaying(this.props.playing);
    });
    this._phone.addListener('propertyValue', (prop) => {
      this.props.onObservedPropChange(prop.name, prop.value);
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.interactive !== this.props.interactive ||
        nextProps.model !== this.props.model) {
      this.loadInteractive(nextProps.interactive, nextProps.model)
    }
    if (nextProps.labProps !== this.props.labProps) {
      // Set only DIFF of new and old properties. It's quite important difference,
      // as Lab calls 'onChange' callbacks each time we set given property,
      // even if we set the same value.
      this.setLabProperties(diff(nextProps.labProps, this.props.labProps));
    }
    if (nextProps.playing !== this.props.playing) {
      this.setLabPlaying(nextProps.playing);
    }
  }

  shouldComponentUpdate(nextProps) {
    // Update component only if it's width or height is changed.
    return nextProps.width !== this.props.width ||
           nextProps.height !== this.props.height;
  }

  componentWillUnmount() {
    this.phone.disconnect();
  }

  loadInteractive(interactive, model) {
    if (interactive) {
      if (model) {
        interactive = combineInteractiveAndModel(interactive, model)
      }
      this._phone.post('loadInteractive', interactive);
    }
  }

  setLabProperties(props) {
    extend(this._labPropsToSet, props);
    if (this._labUpdateTimeoutID !== null) {
      return;
    }
    let updateFunc = () => {
      // Hack. Expected format is `post('set', {name: 'propName', value: 'propValue'})`
      // However Lab internally checks if the `name` argument is string or hash, so we
      // can pass hash too. We shouldn't, but iframePhone messages seem to be expensive,
      // so it makes sense to limit their number.
      this._phone.post('set', {name: this._labPropsToSet});
      this._labUpdateTimeoutID = null;
      this._labPropsToSet = {};
    };
    this._labUpdateTimeoutID = setTimeout(updateFunc, LAB_PROPS_UPDATE_MIN_INTERVAL);
  }
  
  setLabPlaying(v) {
    if (v) {
      this._phone.post('play');
    } else {
      this._phone.post('stop');
    }
  }

  addLabListeners(observedProps) {
    observedProps.forEach((prop) => {
      this._phone.post('observe', prop);
    });
  }

  get phone() {
    return this._phone;
  }

  render() {
    return (
      <iframe ref='iframe' width={this.props.width} height={this.props.height}
              frameBorder='0' allowFullScreen
              src={this.props.src}></iframe>
    )
  }
}

LabInteractive.defaultProps = {
  width: '610px',
  height: '350px',
  labProps: {},
  labObservedProps: [],
  onModelLoaded: function () {},
  onObservedPropChange: function () {},
  // lab-1.10.0 is stored in `/public` directory.
  // Note that application pages must be stored in the same dir, so this path works
  // correctly. If an app is placed somewhere else, it has to provide custom `src` property
  // (e.g. '../lab-1.10.0/embeddable.html' if its page is in a `/public` subdirectory).
  src: 'lab-1.10.0/embeddable.html'
};

function combineInteractiveAndModel(interactive, model) {
  delete interactive.models[0].url;
  interactive.models[0].model = model;
  return interactive;
}

function diff(newProps, oldProps={}) {
  let result = {};
  Object.keys(newProps).forEach(function (key) {
    if (newProps[key] !== oldProps[key]) result[key] = newProps[key];
  });
  return result;
}
