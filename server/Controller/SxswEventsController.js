const SxswEventModel = require('../model/SxswEventModel');
const fs = require('fs');
const newHtml = fs.readFileSync(__dirname + '/../../app/sxswEventViews/new.html', 'utf-8');


function promiseReadFile(fileName) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf-8', (err, result) => {
      if (err) return reject(err);
      return resolve(result);
    });
  });
}

class SxswEventsController {
  constructor(params){
    this.params = params;
  }

  // new() {
  //   return promiseReadFile(__dirname + '../../app/sxswEventViews/new.html');
  // }

  new() {
    return Promise.resolve(newHtml);
  }

  show() {
    return SxswEventModel.find(this.params);
  }

  edit() {

  }

  destroy() {

  }

  update() {

  }

  create() {
    return SxswEventModel.createModel(this.params)
      .then(model => model.save())
  }

  index() {

  }
}

module.exports = SxswEventsController;
