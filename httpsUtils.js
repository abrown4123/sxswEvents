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

module.exports = httpsRequest;
