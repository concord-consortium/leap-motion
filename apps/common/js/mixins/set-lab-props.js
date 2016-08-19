import update from 'react-addons-update';

export default {
  getInitialState: function (props) {
    return {
      labProps: {}
    };
  },

  componentDidMount() {
    this.setLabProps = this.setLabProps.bind(this);
    this.handleLabPropChange = this.handleLabPropChange.bind(this);
  },

  setLabProps(newProps) {
    let updateDef = {};
    Object.keys(newProps).forEach((key) => {
      if (newProps[key] !== this.state.labProps[key]) {
        updateDef[key] = {$set: newProps[key]};
      }
    });
    if (Object.keys(updateDef).length > 0) {
      // Call set state only if we really updated anything. Avoid React overhead (re-render, etc.).
      // LabInteractive component sends only updated properties to the model anyway.
      this.setState({labProps: update(this.state.labProps, updateDef)});
    }
  },

  handleLabPropChange(event) {
    let props = {};
    props[event.target.name] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    this.setLabProps(props);
  }
}
