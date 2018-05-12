const fs = require('fs'),
      express = require('express'),
      app = express(),
      SxswEventsController = require('./Controller/SxswEventsController');
const bodyParser = require('body-parser');

app.use(bodyParser.json())


app.get('/', function(req, res){
  const file = fs.readFileSync(__dirname + '/../app/index.html', 'utf-8');
  res.send(file);
  res.end();
})

// app.get('/api/sxswevents/:event_id', (req, res) => {
//   console.log(req.params);
//   const sxswEventsController = new SxswEventsController(req.params);
//   return sxswEventsController.show()
//     .then(responseBody => {
//       res.send(responseBody);
//       res.end();
//     });
// });

app.get('/api/sxswEvents/new', (req, res) => {
  const controller = new SxswEventsController(req.params);
  return controller.new()
    .then(result => {
      res.send(result);
      res.end();
    })
    .catch(err => {
      console.log('BAD SHIT HAPPENED', err);
      res.send('couldnt find what you wanted');
      res.end();
    });
});

app.get('/api/sxswEvents', (req, res) => {
  const controller = new SxswEventsController(req.params);
  return controller.index()
    .then(result => {
      res.send(result);
      res.end();
    })
    .catch(err => {
      res.end();
      res.send(' did not Show everything');
    });
});

app.get('/api/sxswEvents/:event_id', (req,res) => {
  const controller = new SxswEventsController(req.params);
  return controller.show()
    .then(result => {
      res.send(result);
      res.end();
    })
    .catch(err => {
      res.end();
      res.send('did not Show one Event');
    });
})

app.get('/api/sxswEvents/:sxswEventsId/edit', (req, res) => {
  const controller = new SxswEventsController(req.params);
  return controller.edit()
    .then(result => {
      res.send(result);
      res.end();
    })
    .catch(err => {
      res.end();
      res.send('did not I am Edited');
    });
});

app.put('/api/sxswEvents/:sxswEventsId', (req, res) => {
  const controller = new SxswEventsController(req.params);
  return controller.edit()
    .then(result => {
      res.send(result);
      res.end();
    })
    .catch(err => {
      res.end();
      res.send('did not Updated');
    });
});

app.delete('/api/sxswEvents/:sxswEventsId', (req, res) => {
  const controller = new SxswEventsController(req.params);
  return controller.destroy()
    .then(result => {
      res.send(result);
      res.end();
    })
    .catch(err => {
      res.send('did not deleted');
      res.end();
    });
});

app.post('/api/sxswEvents/', (req, res) => {
  const controller = new SxswEventsController(req.body);
  console.log('posting to sxsw events', req.params, req.body)
  return controller.create()
    .then(result => {
      res.send(JSON.stringify(result));
      return res.end();
    })
    .catch(err => {
      console.log(err);
      res.send('did not created');
      res.end();
    })
});

app.listen(9000);
console.log('Running on port: 9000')
module.exports = app;
