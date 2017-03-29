import React from 'react';
import Dialog from './dialog.jsx';
import LeapStatus from './leap-status.jsx';

export default class SettingsDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogVisible: false
    };
    this.handleDialogToggle = this.handleDialogToggle.bind(this);
  }

  handleDialogToggle() {
    const { dialogVisible } = this.state;
    this.setState({dialogVisible: !dialogVisible});
  }

  get plotter() {
    return this.refs.status.plotter;
  }

  render() {
    const { dialogVisible } = this.state;
    const { children } = this.props;
    return (
      <span>
        <span className='dialog-link' onClick={this.handleDialogToggle}>Settings</span>
        <Dialog visible={dialogVisible} onToggle={this.handleDialogToggle} title='Settings'>
          <LeapStatus ref='status' visible={dialogVisible}>
            {children}
          </LeapStatus>
        </Dialog>
      </span>
    );
  }
}
