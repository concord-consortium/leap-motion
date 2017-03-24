import React from 'react';

export default class ModalLinks extends React.Component {
  constructor(props) {
    super(props);
    this.showModal = this.toggleModal.bind(this);
  }

  toggleModal(event) {
    var modal = document.getElementsByClassName(event.currentTarget.dataset.id)[0];
    if (modal.style.display == 'block') {
      modal.style.display = 'none';
    } else {
      modal.style.display = 'block';
    }
  }

  render() {
    console.log(document.getElementById('status-box'));
    return (
      <ul className="detail-toggle-switches">
        <li className="settings-toggle" data-id="status-box" onClick={this.toggleModal}>Settings</li>
        <li className="about-toggle" data-id="about-box" onClick={this.toggleModal}>About</li>
      </ul>
    );
  }
}
