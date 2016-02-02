import React from 'react';
import iframePhone from 'iframe-phone';

const LAB_PROPS_UPDATE_MIN_INTERVAL = 75; // ms

export default class LabInteractive extends React.Component {
  componentDidMount() {
    this._phone = new iframePhone.ParentEndpoint(this.refs.iframe);
    this._labUpdateTimeoutID = null;
    this.loadInteractive(this.props.interactive, this.props.model);
    this._phone.addListener('modelLoaded', () => {
      this.props.onModelLoaded();
      this.setLabProperties(this.props.labProps);
      this.setLabPlaying(this.props.playing);
      this.addLabListeners(this.props.labObservedProps);
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
      this.setLabProperties();
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

  setLabProperties() {
    if (this._labUpdateTimeoutID !== null) {
      return;
    }
    let updateFunc = () => {
      this._phone.post('set', {name: this.props.labProps});
      this._labUpdateTimeoutID = null;
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
