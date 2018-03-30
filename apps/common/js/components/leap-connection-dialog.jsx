import React from 'react';
import Dialog from './dialog.jsx';
import t from '../tools/translate';

export default class LeapConnectionDialog extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      dialogVisible: false
    };
    this.handleDialogToggle = this.handleDialogToggle.bind(this);

  }
  componentDidMount(){
    if (this.props.connected === false){
      this.checkLeapConnection = setInterval(() => {
        if (this.props.connected === false){
          this.setState({dialogVisible: true});
          clearInterval(this.checkLeapConnection);
        }
      }, 5000);
    }
  }
  handleDialogToggle() {
    const { dialogVisible } = this.state;
    this.setState({dialogVisible: !dialogVisible});
  }

  render() {
    const { dialogVisible } = this.state;
    const { children, lang, connected } = this.props;
    let description = connected ? t('~LEAP_CONNECTED', lang) : t('~LEAP_NOT_CONNECTED',lang);
    return (
      <span>
        <span className='dialog-link' onClick={this.handleDialogToggle}>
          {!connected && <span className='leap-connection-lost-overlay'>!</span>}
          <img src='./leap.png' width='55px' height='15px' title={t('~LEAP_CONNECTION', lang)} />
        </span>
        <Dialog visible={dialogVisible} onToggle={this.handleDialogToggle} title='Leap Device Connection'>
          {description}
        </Dialog>
      </span>
    );
  }
}
