import React, {Component} from 'react';

class Event extends Component {
  constructor(props) {
    super(props);

    this.state = {
      event: {}
    }
  }

  componentDidMount() {
    this.getEvent();
  }

  getEvent() {
    const id = this.props.match.params.id
    const URL = 'http://localhost:9000/api/sxswEvents/' + id;
    fetch(URL)
      .then(response => response.json())
      .then(json => this.setState({event: json[0]}));
  }

  render() {
    const { event } = this.state;
    return (
      <div>
        <h2>{event.event_name}</h2>
        <h3>{event.event_venue}</h3>
        <p>{event.event_time}</p>
        <p>{event.event_description}</p>
      </div>
    );
  }
}

module.exports = Event
