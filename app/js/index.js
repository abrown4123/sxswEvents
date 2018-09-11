import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {data: []}
  }

  getEvents() {
    const URL = 'http://localhost:9000/api/sxswEvents';
    fetch(URL)
      .then(response => response.json())
      .then(json => this.setState({data: json}));
  }

  componentDidMount() {
    this.getEvents();
  }

  render() {
    const event = this.state.data[0] || {};
    return(
        <div>{event.event_id}</div>
    );
  };
}

window.onload = function() {
  ReactDOM.render( <App />, document.getElementById('container'));
}
