import React from 'react';
import Dialog from './dialog.jsx';

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
    const { children } = this.props;
    if (!children) return null;
    return (
      <span>
        <span className='dialog-link' onClick={this.handleDialogToggle}>About</span>
        <Dialog visible={dialogVisible} onToggle={this.handleDialogToggle} title='About'>
          {children}
        </Dialog>
      </span>
    );
  }
}
