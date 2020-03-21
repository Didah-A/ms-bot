const axios = require('axios');

class Covid19Stats {
    async getCovid19StatsByCountry(countryCode) {
        const response = await axios.get(`https://wuhan-coronavirus-api.laeyoung.endpoint.ainize.ai/jhu-edu/latest?iso2=${ countryCode }&onlyCountries=false`);
        return response.data[0];
    }

    async getCovid19Stat() {
        const response = await axios.get('https://wuhan-coronavirus-api.laeyoung.endpoint.ainize.ai/jhu-edu/brief');
        return response.data;
    }
}

module.exports.Covid19API = Covid19Stats;
