import React from 'react';
import logger from '../tools/logger';

import '../../css/logging-config.css';


export default class LoggingConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = Object.assign({}, logger.state);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleLoggingActivation = this.handleLoggingActivation.bind(this);
  }

  componentDidUpdate() {
    logger.setState(this.state);
  }

  handleInputChange(event) {
    const props = {};
    props[event.target.name] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    this.setState(props);
  }

  handleLoggingActivation(event) {
    const { onStart, onEnd } = this.props;
    const enabled = event.target.checked;
    // onStart and onEnd are called in a different moments, so client code have chances to log something
    // before / after logging is turned off / on.
    if (!enabled) {
      onEnd();
    }
    this.setState({enabled}, () => {
      if (enabled) {
        onStart();
      }
    });
  }

  render() {
    const { enabled, userId } = this.state;
    return (
      <div className='logging-config'>
        Logging Enabled: <input type='checkbox' name='enabled' checked={enabled} onChange={this.handleLoggingActivation}/>
        User ID: <input type='text' name='userId' value={userId} disabled={enabled} onChange={this.handleInputChange}/>
      </div>
    )
  }
}

LoggingConfig.defaultProps = {
  onStart: function() {},
  onEnd: function() {}
};
