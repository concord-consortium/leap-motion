import React from 'react';
import fullscreenImg from '../../images/fullscreen.svg';
import fullscreenExitImg from '../../images/fullscreen.svg';
import screenfull from 'screenfull';
import '../../css/fullscreen-container.less';

export default class FullscreenContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isFullscreen: false
    };
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
  }

  toggleFullscreen() {
    const { isFullscreen } = this.state;
    if (!isFullscreen) {
      screenfull.request(this.refs.container);
    } else {
      screenfull.exit();
    }
    this.setState({isFullscreen: !isFullscreen});
  }

  render() {
    const { children, className } = this.props;
    const { isFullscreen } = this.state;
    return (
      <div ref='container' className={`fullscreen-container ${className}`}>
        {children}
        <img className='toggle-fullscreen' src={isFullscreen ? fullscreenExitImg : fullscreenImg}
             onClick={this.toggleFullscreen}/>
      </div>
    );
  }
}
