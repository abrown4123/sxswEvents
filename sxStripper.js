const removeList = [
  ' data-status-color="none"',
  ' data-event-status=""',
  ' class="columns small-12 large-6 px1"',
  '<button[^]+?<\/button>',
  '<div class="event_status_wrapper"><\/div>',
  '<div class="indicator-container"><div class="indicator"><\/div><\/div>',
];

const pg = require('pg');

const dbConfig = {
  user: 'swswuser', // env var: PGUSER
  database: 'sxsw2018', // env var: PGDATABASE
  password: 'sxsw2018kitkat', // env var: PGPASSWORD process.env.PGPASSWORD
  max: 100 // max number of clients in the pool
};

/**
 * @name connectToPSQL
 * @description connect to psql
 * @return {Promise} will resolve with db connection
 */
function connectToPSQL() {
  const pool = new pg.Pool(dbConfig);
  pool.on('error', (err, client) => {
    console.log('PSQL pool error', err);
  });

  return new Promise(function (resolve, reject) {
    pool.connect((err, client) => {
      if(err) {
        console.error('error fetching client from pool', err);
        return reject(err);
      }
      console.log('Connected to database');
      return resolve(client);
    });
  });
}



const https = require('https');

function httpsRequest(options, log) {
  return new Promise((resolve, reject) => {
    const request = https.request(options, response => {
      const data = [];

      response.on('data', datum => {
        data.push(new Buffer(datum).toString('utf-8'));
      });

      response.on('end', () => {
        const responseText = data.join('');

        return resolve({
          headers: response.headers,
          contentType: response.headers['content-type'],
          body: responseText
        });
      });

      response.on('error', error => {
        return resolve({ status: 'error', error: error });
      });
    });

    request.on('error', error => {
      console.log(error);
      return resolve({ status: 'error', error: error });
    });
    request.end();
  });
}

const hostname = 'schedule.sxsw.com';
let path = '/2018/03/10/events'
path = '/2018/03/18/events'
connectToPSQL()
  .then(client => {
    httpsRequest({
      hostname: hostname,
      method: 'GET',
      path: path
    })
    .then(result => {
      // const article = result.body.match(/<article>.+<\/article>/g)
      let article = result.body.match(/(<article>[^]+<\/article>)/)[0];
      removeList.forEach(el => {
        const re = new RegExp(el, 'g');
        article = article.replace(re, '')
      });

      article = article.replace(/\s+/g,' ')
      article = article.replace(/<br>/g,' ')
      article = article.replace(/<br \/>/g,' ')
      article = article.replace(/<div class="row single-event"/g,'\n<div class="row single-event"');
      article = article.split('\n')
      article = article.map(a => a.replace(/class=".+?"/g, ''));

      const eventList = {};

      article.forEach(event => {
        const eventLink = event.match(/data-event-url="(.+?)"/);
        const eventName = event.match(/<h4><a.+?>(.+?)<\/a/);
        const eventTime = event.match(/<div ><div >(.+?)<\/div/);
        const venueLink = event.match(/<div ><div ><a href="(.+?venues.+?)">/);
        const venueName = event.match(/<div ><div ><a href=".+?venues.+?">(.+?)<\/a/);
        const venueAddress = event.match(/<a href="\/\d+?\/venues.+?">.+?<\/a> ([\w\d.\s]+?)<\/div/);

        // console.log(eventLink ? eventLink[1] : null)
        // console.log(eventName ? eventName[1] : null)
        // console.log(eventTime ? eventTime[1] : null)
        // console.log(venueLink ? venueLink[1] : null)
        // console.log(venueName ? venueName[1] : null)
        // console.log(venueAddress ? venueAddress[1] : null)
        // console.log();

        if (eventLink) {
          const eventDetails = {
            eventLink: eventLink ? eventLink[1] : null,
            eventName: eventName ? eventName[1] : null,
            eventTime: eventTime ? eventTime[1] : null,
            venueLink: venueLink ? venueLink[1] : null,
            venueName: venueName ? venueName[1] : null,
            venueAddress: venueAddress ? venueAddress[1] : null
          };

          let formattedTime = eventTime[1].split('&')[0];
          const time = formattedTime.match(/(.\d:\d\d(?:am|pm))/)[1]
          const splitTime = time.split(':');
          let hour = splitTime[0];
          hour = Number(hour);
          const marker = splitTime[1].match(/\w\w$/);
          if (marker[0] === 'pm' && hour !== 12) hour += 12;
          splitTime[0] = hour;
          const newTime = splitTime.join(':').match(/(.+)(?:am|pm)/)[1];
          formattedTime = formattedTime.replace(time, ' ' + newTime);
          // console.log(formattedTime, time, newTime)


          eventList[eventLink[1]] = eventDetails;
          // client.query(insertionQuery(), [
          //   eventDetails.eventLink,
          //   eventDetails.eventName,
          //   eventDetails.eventTime,
          //   new Date(formattedTime),
          //   eventDetails.venueLink,
          //   eventDetails.venueName,
          //   eventDetails.venueAddress,
          //   null,
          //   null ]
          // );
        }
      });

      // console.log(eventList)
      const fs = require('fs');
      // fs.writeFile(path.replace(/\//g, '_') + '.json', JSON.stringify(eventList), 'utf-8')
      const paths = Object.keys(eventList)
      return Promise.all(
        paths.map(p =>
          httpsRequest({
          hostname: hostname,
          method: 'GET',
          path: p
        }))
      )
      .then(results => results.map(result => result.body))
      .then(results => {
        results.forEach((body, idx) => {
          let description = body;
          if (!description) return;
          description = description.replace(/\s+/g,' ')
          description = description.replace(/<br>/g,' ')
          description = description.replace(/<br \/>/g,' ')
          description = description.match(/(<div class="row description">.+?<\/div><\/article>)/);
          // console.log(description ? description[1] : null)
          if (!description) return;
          description = description[1];

          const primaryEntry = description.match(/<b>Primary Entry:<\/b>(.+?)</);
          const eventDescription = description.match(/<div class="body"><p>(.+?)</);
          // console.log(primaryEntry ? primaryEntry[1] : null)
          // console.log(eventDescription ? eventDescription[1] : null)
          // console.log()
          client.query(updateQuery(), [ primaryEntry[1], eventDescription[1], paths[idx] ], (err, res) => console.log(err))
        })
      })
      .catch(console.log)
    })
  })


const insertionQuery = () => {
  return `
    INSERT INTO events (event_link, event_name, event_time_string, event_time, venue_link, venue_name, venue_address, primary_entry, event_description)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
  `;
}

const updateQuery = () => {
  return `
    UPDATE events
    SET primary_entry = $1, event_description = $2
    WHERE event_link = $3;
  `;
}
