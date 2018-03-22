import React from 'react';
import Dialog from './dialog.jsx';
import LeapStatus from './leap-status.jsx';
import t from '../tools/translate';

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
    const { children, lang } = this.props;
    return (
      <span>
        <span className='dialog-link' onClick={this.handleDialogToggle}>{t('~SETTINGS', lang)}</span>
        <Dialog visible={dialogVisible} onToggle={this.handleDialogToggle} title={t('~SETTINGS', lang)}>
          <LeapStatus ref='status' visible={dialogVisible}>
            {children}
          </LeapStatus>
        </Dialog>
      </span>
    );
  }
}
