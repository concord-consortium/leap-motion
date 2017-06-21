import React from 'react';
import LabHeatTransfer from './../lab-heat-transfer/lab-heat-transfer.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';

export default class LabHeatTransferTransparent extends React.Component {
  render() {
    return <LabHeatTransfer interactive={interactive} model={model} spoonEnabled={true} />;
  }
}
