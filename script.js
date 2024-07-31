let map;
let userMarker;
let randomMarker;
let userLocation;
let watchId;

navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    userLocation = [latitude, longitude];

    initializeMap(userLocation);
}, () => {
    const defaultLat = 51.505;
    const defaultLng = -0.09;
    userLocation = [defaultLat, defaultLng];

    initializeMap(userLocation);
});

function initializeMap(location) {
    map = L.map('map').setView(location, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    userMarker = L.marker(location).addTo(map)
        .bindPopup('You are here!')
        .openPopup();

    // Почати відслідковувати позицію користувача
    watchId = navigator.geolocation.watchPosition(updateUserLocation, handleGeolocationError);
}

function updateUserLocation(position) {
    const { latitude, longitude } = position.coords;
    userLocation = [latitude, longitude];

    userMarker.setLatLng(userLocation);
    map.panTo(userLocation);  // Оновлення центру карти до поточної позиції користувача

    checkProximity();
    console.log('updated')
}

function handleGeolocationError() {
    alert("Не вдалося отримати геопозицію.");
}

function getRandomPoint(center, radius) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const dx = distance * Math.cos(angle);
    const dy = distance * Math.sin(angle);
    const earthRadius = 6371;
    const newLat = center[0] + (dy / earthRadius) * (180 / Math.PI);
    const newLng = center[1] + (dx / earthRadius) * (180 / Math.PI) / Math.cos(center[0] * Math.PI / 180);
    return [newLat, newLng];
}

function generateRandomPoint() {
    if (randomMarker) {
        map.removeLayer(randomMarker);
    }

    let radiusKm = parseFloat(document.getElementById('radius').value);
    
    if (radiusKm < 4) {
        alert("Мінімальний радіус становить 4 км");
        radiusKm = 4;
        document.getElementById('radius').value = 4;
    }
    
    const randomPoint = getRandomPoint(userLocation, radiusKm);

    randomMarker = L.marker(randomPoint).addTo(map)
        .bindPopup(`Random Position: [${randomPoint[0].toFixed(5)}, ${randomPoint[1].toFixed(5)}]`)
        .openPopup();

    map.setView(randomPoint, 13);
}

function checkProximity() {
    if (!randomMarker) return;

    const userLatLng = L.latLng(userLocation[0], userLocation[1]);
    const randomLatLng = randomMarker.getLatLng();

    if (userLatLng.distanceTo(randomLatLng) < 50) { // 50 метрів для точності
        onReachedRandomPoint();
    }
}

function onReachedRandomPoint() {
    console.log("Вітаємо! Ви досягли випадкової точки.");
    // Можна додати інші дії тут
}
