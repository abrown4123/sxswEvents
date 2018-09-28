import React, { Component } from 'react';

class EventForm extends Component {
  constructor(props) {
    super(props)

    this.state = {
      event_link: '',
      event_name: '',
      event_time: (new Date()).toISOString(),
      venue_link: '',
      venue_name: '',
      venue_address: '',
      primary_entry: '',
      event_description: ''
    };
  }


PostEvent(event) {
  event.preventDefault();
  const URL = "http://localhost:9000/api/sxswEvents/";
  console.log('Posting to backend...');
  fetch(URL, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // "Content-Type": "application/x-www-form-urlencoded",
    },
    body: JSON.stringify(this.state)
  }).then(function(response) {
    return response.json();
  }).then(function(data) {
    console.log('Created Event:', data);
  });
}

  render() {
    return(
      <div>
        <h1>create a new event</h1>
        <form className="" action="/api/sxswEvents" method="post">
          <input id="event_link" type="text" name="event_link" placeholder="Event Link" value={this.state.event_link} onChange={event => this.setState({ event_link: event.target.value })} />
          <input id="event_name" type="text" name="event_name" placeholder="Event Name" value={this.state.event_name} onChange={event => this.setState({ event_name: event.target.value })} />
          <input id="event_time" type="text" name="event_time" placeholder="Event Time" value={this.state.event_time} onChange={event => this.setState({ event_time: event.target.value })} />
          <input id="venue_link" type="text" name="venue_link" placeholder="Venu Link" value={this.state.venue_link} onChange={event => this.setState({ venue_link: event.target.value })} />
          <input id="venue_name" type="text" name="venue_name" placeholder="Venue Name" value={this.state.venue_name} onChange={event => this.setState({ venue_name: event.target.value })} />
          <input id="venue_address" type="text" name="venue_address" placeholder="Venue Address" value={this.state.venue_address} onChange={event => this.setState({ venue_address: event.target.value })} />
          <input id="primary_entry" type="text" name="primary_entry" placeholder="Primary Entry" value={this.state.primary_entry} onChange={event => this.setState({ primary_entry: event.target.value })} />
          <input id="event_description" type="text" name="event_description" placeholder="Event Description" value={this.state.event_description} onChange={event => this.setState({ event_description: event.target.value })} />
          <button id="submit-button" type="submit" name="button" onClick={event => this.PostEvent(event)}>Create Event!</button>
        </form>
      </div>
    );
  }
}

module.exports = EventForm;
