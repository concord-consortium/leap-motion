import React from 'react';

export default class ActiveViewSelector extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      overlays: props.initialOverlays.view,
      activeView: 'none'
    }
    this.generateActiveToggles = this.generateActiveToggles.bind(this);
    this.onChangeView = this.onChangeView.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    const { overlays } = this.state
    let availableOverlays = Object.assign({}, overlays);
    for (let key in overlays) {
      availableOverlays[key] = nextProps.overlays[key]
    }
    let active = nextProps.overlays.leapControlledView;
    if (active) {
      this.setState({ overlays: availableOverlays, activeView: active });
    } else {
      this.setState({ overlays: availableOverlays });
    }
  }

  onChangeView(e) {
    const { overlays } = this.state
    let views = Object.assign({}, overlays);
    views.leapControlledView = e.currentTarget.value
    this.props.onViewStateChange(e.currentTarget.value)
  }
  createInput (key, val, active) {
    let label = key
    return (
      <label key={key} className={key}>{val}
        <input type="radio" className={key} name="active-view" value={val} key={key} checked={active} onChange={this.onChangeView}/>
      </label>
    )
  }

  generateActiveToggles(){
    const { overlays, activeView } = this.state
    let inputs = []
    for (let key in overlays){
      let val = overlays[key]
      let active = val === activeView
      if (val !== 'nothing') {
        inputs.push(this.createInput(key, val, active))
      }
    }
    return inputs;
  }

  render() {
    const inputs = this.generateActiveToggles();

    return (
      <div className="active-view-selector">
        {inputs}
      </div>
    )
  }
}