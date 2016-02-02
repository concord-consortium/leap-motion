import update from 'react-addons-update';

export default {
  getInitialState: function (props) {
    return {
      labProps: {}
    };
  },

  setLabProps(hash) {
    let updateDef = {};
    Object.keys(hash).forEach(function (key) {
      updateDef[key] = {$set: hash[key]};
    });
    this.setState({labProps: update(this.state.labProps, updateDef)});
  }
}
