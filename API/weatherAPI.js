const axios = require('axios');

class Weather {
    constructor(name) {
        this.name = name;
    }

    async getWeatherByCity(city) {
        const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${ city },&APPID=5d02714105c6ccbcf7dd48e43b21b255`);
        return response.data.weather[0];
    }

    async getWeatherByZipcode(zip) {
        const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${ zip },&APPID=5d02714105c6ccbcf7dd48e43b21b255`);
        return response.data.weather[0];
    }
}

module.exports.WeatherAPI = Weather;
