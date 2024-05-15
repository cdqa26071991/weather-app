import { fetchLocation, defaultLocation, reverseGeocoding } from "./scripts/locations.js"
import { fetchMeteo } from "./scripts/meteoApi.js"
import { updateDashboard, updateSuggestions, setUserDashboard } from "./scripts/dashboards.js"
import { requestLogin, requestLogout, checkLogin, loggedIn } from "./scripts/login.js"
import { addFavorite, requestUploadPhoto, refreshPhotos } from "./scripts/favorites.js"

let targetLocation = null

window.onload = () => {
    // Add event listeners
    document.querySelector("#searchLocation").addEventListener("input", refreshSuggestions)
    document.querySelector('.search-button').addEventListener('click', searchLocation)
    document.querySelector('.button-login').addEventListener('click', requestLogin)
    document.querySelector('.boton-logout').addEventListener('click', requestLogout)
    document.querySelector('.current-location-button').addEventListener('click', getCurrentLocation)
    document.querySelector('.add-favorite-button').addEventListener('click', addFavoriteButton)
    document.querySelector('#uploadPhotoModal').addEventListener('show.bs.modal',uploadPhotoModalShow)
    document.querySelector('.button-upload-photo').addEventListener('click', requestUploadPhoto)
    document.querySelector('.show-photo-button').addEventListener('click', showOffcanvas)

    //Load default data
    let result = setUserDashboard()

    targetLocation = defaultLocation
    setInterval(refreshDashboard(targetLocation), 5000)
}

function showOffcanvas(event){
    event.preventDefault() 

    refreshPhotos(targetLocation)

    let offCanvas = new bootstrap.Offcanvas(document.querySelector('#offcanvasExample'))
    document.querySelector('#offcanvas-location').innerHTML = targetLocation.name
    document.querySelector('#offcanvas-lat').innerHTML = targetLocation.lat
    document.querySelector('#offcanvas-lon').innerHTML = targetLocation.lon
    offCanvas.show()

}

function uploadPhotoModalShow(){
    document.querySelector('#photoLocation').value = targetLocation.name
}

function addFavoriteButton() {
    let favorite = {
        "name": targetLocation.name,
        "lat": targetLocation.lat,
        "lon": targetLocation.lon
    }
    addFavorite(favorite)
}

function searchLocation() {
    let options = Array.from(document.querySelectorAll("#suggestions option"))
    let searchInput = document.querySelector("#searchLocation")

    let newLocation = {}
    for (let option of options) {
        if (option.value == searchInput.value) {
            newLocation.lon = option.getAttribute("lon")
            newLocation.lat = option.getAttribute("lat")
            newLocation.name = searchInput.value
        }
    }
    console.log(newLocation)
    targetLocation = newLocation
    refreshDashboard(targetLocation)
    obtenerDatos(newLocation.lat, newLocation.lon)
}

function getCurrentLocation() {
    navigator.geolocation.getCurrentPosition((position) => {
        let newLocation = {}
        newLocation.lon = position.coords.longitude
        newLocation.lat = position.coords.latitude
        // Reverse geocoding
        reverseGeocoding(newLocation.lat, newLocation.lon)
            .then(response => response.json())
            .then(data => {
                newLocation.name = data[0]["name"] + " (browser geolocation)"
                targetLocation = newLocation
                refreshDashboard(targetLocation)
            })
        newLocation.name = ""
        newLocation.isFavorite = false
        targetLocation = newLocation
        refreshDashboard(targetLocation)
    })
}

function refreshSuggestions(e) {
    console.log(e.target.value)
    if (e.target.value != "" & e.target.value.length > 1 & e.target.value.length < 8) {
        setTimeout((() => {
            fetchLocation(e.target.value)
                .then(response => response.json())
                .then(data => {
                    updateSuggestions(data["results"])
                })
                .catch((error) => console.log(error))
        }), 250)
    }
}

function refreshDashboard(location) {
    fetchMeteo(location)
        .then(response => response.json())
        .then(((data) => {
            // console.log(data)
            updateDashboard(data, location)
        }))
        .catch((error) => console.log(error)
        )
}

// Esta es la parte donde se integran los codigos adicionales para la calidad del aire desde una API
//-----------------------------------------------------------------------o--------------------------------------------
function obtenerDatos(lat,lon) {
    let apiKey = 'b719b4e1ef2cdee973babc04d670b601';

    let url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        // Almacenar los datos en variables
        let aqi = data.list[0].main.aqi;
        let co = data.list[0].components.co;
        let no = data.list[0].components.no;
        let no2 = data.list[0].components.no2;
        let o3 = data.list[0].components.o3;
        let so2 = data.list[0].components.so2;
        let pm25 = data.list[0].components.pm2_5;
        let pm10 = data.list[0].components.pm10;
        let nh3 = data.list[0].components.nh3;

        // Mostrar valores en la tarjeta
        document.querySelector('.ph-aqi').textContent = aqi;
        document.querySelector('.ph-co').textContent = co;
        document.querySelector('.ph-no').textContent = no;
        document.querySelector('.ph-no2').textContent = no2;
        document.querySelector('.ph-o3').textContent = o3;
        document.querySelector('.ph-so2').textContent = so2;
        document.querySelector('.ph-pm25').textContent = pm25;
        document.querySelector('.ph-pm10').textContent = pm10;
        document.querySelector('.ph-nh3').textContent = nh3;
    })
    .catch(error => {
        console.error('Error al obtener datos:', error);
        document.getElementById('resultado').innerHTML = 'Error al obtener datos';
    });
}

// Llama a la función para obtener los datos cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', obtenerDatos);