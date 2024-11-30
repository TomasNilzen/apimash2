import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Anpassad komponent för att hantera kartan och flytta den
// eslint-disable-next-line react/prop-types
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center); // Uppdaterar kartans position
        }
    }, [center, map]);
    return null;
};

const CountrySearch = () => {
    const [query, setQuery] = useState('');
    const [country, setCountry] = useState(null);
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [weather, setWeather] = useState({});

    const openWeatherApiKey = '6b1c63f14c020e660bc2ea44f5bd07a5';
    const geoNamesUsername = 'tomassthlm';

    const searchCountry = async () => {
        try {
            const response = await axios.get(`https://restcountries.com/v3.1/name/${query}`);
            const countryData = response.data[0];
            setCountry(countryData);
            fetchCities(countryData.cca2);
        } catch (error) {
            console.error('Error fetching country data:', error);
            setCountry(null);
            setCities([]);
        }
    };

    const fetchCities = async (countryCode) => {
        setLoadingCities(true);
        try {
            const response = await axios.get(
                `https://secure.geonames.org/searchJSON?country=${countryCode}&featureClass=P&maxRows=10&orderby=population&username=${geoNamesUsername}`
            );
            const cityList = response.data.geonames;
            setCities(cityList);
            fetchWeatherForCities(cityList);
        } catch (error) {
            console.error('Error fetching city data:', error);
            setCities([]);
        } finally {
            setLoadingCities(false);
        }
    };

    const fetchWeatherForCities = async (cityList) => {
        const weatherData = {};
        try {
            for (const city of cityList) {
                const response = await axios.get(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lng}&units=metric&appid=${openWeatherApiKey}`
                );
                weatherData[city.geonameId] = response.data;
            }
        } catch (error) {
            console.error('Error fetching weather data:', error);
        }
        setWeather(weatherData);
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 text-gray-800">
            <div className="max-w-5xl mx-auto p-6">
                <h1 className="text-4xl font-bold text-center text-blue-600 mb-6">
                    Country & City Explorer
                </h1>
                <div className="bg-gray-100 shadow-lg rounded-lg p-6">
                    <input
                        type="text"
                        placeholder="Enter country name"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={searchCountry}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                    >
                        Search
                    </button>
                    {country && (
                        <div className="mt-6">
                            <div className="flex flex-wrap md:flex-nowrap gap-6">
                                {/* Country Info */}
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold mb-2">{country.name.common}</h2>
                                    <img
                                        src={country.flags.svg}
                                        alt={`${country.name.common} flag`}
                                        className="w-40 h-24 object-cover rounded-md shadow mb-4"
                                    />
                                    <p><strong>Population:</strong> {country.population.toLocaleString()}</p>
                                    <p><strong>Region:</strong> {country.region}</p>
                                    <p><strong>Capital:</strong> {country.capital}</p>
                                    <p><strong>Timezones:</strong> {country.timezones.join(', ')}</p>
                                    <p><strong>Languages:</strong> {Object.values(country.languages).join(', ')}</p>
                                    <p>
                                        <strong>Currency:</strong> {Object.values(country.currencies).map(currency => currency.name).join(', ')}
                                    </p>
                                    <p>
                                        <strong>Neighboring Countries:</strong>{' '}
                                        {country.borders?.join(', ') || 'None'}
                                    </p>
                                </div>
                                {/* Map */}
                                <div className="flex-1">
                                    <MapContainer
                                        center={[0, 0]} // Standardläge
                                        zoom={2} // Fullt utzoomat
                                        scrollWheelZoom={false} // Förhindrar zoom
                                        zoomControl={false} // Inaktiverar zoomkontroller
                                        style={{height: '400px', width: '100%'}}
                                        className="rounded-md shadow"
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        {country.latlng && (
                                            <>
                                                <MapUpdater center={country.latlng}/>
                                                <Marker position={country.latlng}>
                                                    <Popup>
                                                        {country.name.common}
                                                    </Popup>
                                                </Marker>
                                            </>
                                        )}
                                    </MapContainer>
                                </div>
                            </div>
                            {/* Cities Section */}
                            <h3 className="text-xl font-bold mt-6 mb-2">Largest Cities</h3>
                            {loadingCities ? (
                                <p>Loading cities...</p>
                            ) : cities.length > 0 ? (
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {cities.map((city) => (
                                        <li
                                            key={city.geonameId}
                                            className="bg-gray-50 border p-4 rounded-md shadow"
                                        >
                                            <h4 className="font-semibold">{city.name}</h4>
                                            <p>Population: {city.population.toLocaleString()}</p>
                                            {weather[city.geonameId] && (
                                                <div className="mt-2">
                                                    <p>Temperature: {weather[city.geonameId].main.temp}°C</p>
                                                    <p>Weather: {weather[city.geonameId].weather[0].description}</p>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No city data available.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CountrySearch;





