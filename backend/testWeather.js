const { getWeather } = require('./controllers/weatherController');
const req = { query: { location: 'khedi harda mp' } };
const res = { 
  json: (data) => console.log("SUCCESS:", JSON.stringify(data)), 
  status: (code) => ({ json: (data) => console.log("ERROR STATUS:", code, data) }) 
};
getWeather(req, res).catch(console.error);
