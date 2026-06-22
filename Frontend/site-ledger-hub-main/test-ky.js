import ky from 'ky';

const api = ky.create({
  hooks: {
    afterResponse: [
      (request, options, response) => {
        console.log("afterResponse keys:", Object.keys(request));
      }
    ]
  }
});

api.get('http://example.com').catch(() => {});
