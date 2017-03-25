import React from 'react';
import Dialog from './dialog.jsx';

export default class AboutDialog extends React.PureComponent {
  render() {
    const { visible, children } = this.props;
    return (
      <Dialog visible={visible} title="About">
        {children}
      </Dialog>
    );
  }
}
