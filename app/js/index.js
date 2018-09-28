import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import EventForm from './Components/EventForm';
import Event from './Components/Event';
import { BrowserRouter, Route, Switch, Link} from 'react-router-dom';

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
                  <td><Link to={`/events/${event.event_id}`}>{event.event_name}</Link></td>
                  <td><Link to={`/events/${event.event_id}/edit`}>Edit</Link></td>
                </tr>)
              }
            </tbody>
          </table>
        </div>
      );
  }
}

window.onload = function() {
  ReactDOM.render(
    <div>
      <BrowserRouter>
        <div>
          <Link to="/events/new"> Add new event </Link>
          <Switch>
            <Route exact path='/' component={App} />
            <Route path='/events/new' component={EventForm} />
            <Route path='/events/:id/edit' component={EventForm} />
            <Route path='/events/:id' component={Event} />
          </Switch>
        </div>
      </BrowserRouter>
    </div>
      , document.getElementById('container'));
}
