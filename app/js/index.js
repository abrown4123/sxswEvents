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
    const events = this.state.data || [];
    console.log(events);
    return(
        <div>
          <table>
            <tbody>
              <tr>
                <th>Event Id</th>
                <th>Event Name</th>
              </tr>
              {
                events.map((event, idx) => <tr key={idx}>
                  <td>{event.event_id}</td>
                  <td><a href={event.event_link}>{event.event_name}</a></td>
                </tr>)
              }
            </tbody>
          </table>
        </div>
    );
  };
}

window.onload = function() {
  ReactDOM.render( <App />, document.getElementById('container'));
}
