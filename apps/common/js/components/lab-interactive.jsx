import React from 'react';
import iframePhone from 'iframe-phone';


export default class LabInteractive extends React.Component {
  componentDidMount() {
    this._phone = new iframePhone.ParentEndpoint(this.refs.iframe);
    if (this.props.interactive) {
      let interactive = this.props.interactive;
      if (this.props.model) {
        interactive = combineInteractiveAndModel(interactive, this.props.model)
      }
      this._phone.post('loadInteractive', interactive);
    }
  }

  get phone() {
    return this._phone;
  }

  componentWillUnmount() {
    this.phone.disconnect();
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