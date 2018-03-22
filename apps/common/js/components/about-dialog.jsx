import React from 'react';
import Dialog from './dialog.jsx';
import t from '../tools/translate';

export default class AboutDialog extends React.PureComponent {
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

  render() {
    const { dialogVisible } = this.state;
    const { children, lang } = this.props;
    if (!children) return null;
    return (
      <span>
        <span className='dialog-link' onClick={this.handleDialogToggle}>{t('~ABOUT', lang)}</span>
        <Dialog visible={dialogVisible} onToggle={this.handleDialogToggle} title='About'>
          {children}
        </Dialog>
      </span>
    );
  }
}
