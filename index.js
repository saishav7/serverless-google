/**
 * Responds to any HTTP request.
 *
 * @param {!Object} req HTTP request context.
 * @param {!Object} res HTTP response context.
 */

const sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);

/**
 * Constructs the SendGrid email request from the HTTP request body.
 *
 * @param {string} data.body Body of the email subject line.
 * @returns {object} Payload object.
 */
function constructPayload(request) {
  if (!request.body) {
    const error = new Error(
      'Email content not provided. Make sure you have a "body" property in your request'
    );
    error.code = 400;
    throw error;
  }

  return {
    personalizations: [
      {
        to: [
          {
            email: 'contact@saishav.io'
          }
        ],
        subject: 'New message from your website contact form'
      }
    ],
    from: {
      email: 'no-reply@saishav.io'
    },
    content: [
      {
        type: 'text/plain',
        value: request.body
      }
    ]
  };
}

/**
 * Send an email using SendGrid.
 *
 * @param {object} req Cloud Function request context.
 * @param {object} req.query The parsed querystring.
 * @param {string} req.query.sg_key Your SendGrid API key.
 * @param {object} req.body The request payload.
 * @param {string} req.body.to Email address of the recipient.
 * @param {string} req.body.from Email address of the sender.
 * @param {string} req.body.subject Email subject line.
 * @param {string} req.body.body Body of the email subject line.
 * @param {object} res Cloud Function response context.
 */
exports.emailSender = (req, res) => {
  return Promise.resolve()
    .then(() => {
      if (req.method !== 'POST') {
        const error = new Error('Only POST requests are accepted');
        error.code = 405;
        throw error;
      }

      const emailBody = constructPayload(req.body);

      const request = sendgrid.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: emailBody
      });

      // Make the request to SendGrid's API
      console.log('Sending email');
      return sendgrid.API(request);
    })
    .then(response => {
      if (response.statusCode < 200 || response.statusCode >= 400) {
        const error = Error(response.body);
        error.code = response.statusCode;
        throw error;
      }

      console.log('Email sent');

      // Forward the response back to the requester
      res.status(response.statusCode);
      if (response.headers['content-type']) {
        res.set('content-type', response.headers['content-type']);
      }
      if (response.headers['content-length']) {
        res.set('content-length', response.headers['content-length']);
      }
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (response.body) {
        res.send(response.body);
      } else {
        res.end();
      }
    })
    .catch(err => {
      console.error(err);
      const code =
        err.code || (err.response ? err.response.statusCode : 500) || 500;
      res.status(code).send(err);
      return Promise.reject(err);
    });
};
