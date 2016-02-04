import update from 'react-addons-update';

export default {
  getInitialState: function (props) {
    return {
      labProps: {}
    };
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
  }
}
