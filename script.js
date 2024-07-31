let map;
let userMarker;
let randomMarker;
let routeControl;
let userLocation;

navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    userLocation = [latitude, longitude];

    // Ініціалізація карти з позицією користувача
    map = L.map('map').setView(userLocation, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    // Додаємо маркер для поточної локації користувача
    userMarker = L.marker(userLocation).addTo(map)
        .bindPopup('You are here!')
        .openPopup();

}, () => {
    // Якщо користувач відмовився надати геопозицію, використовуємо значення за замовчуванням
    const defaultLat = 51.505;
    const defaultLng = -0.09;
    userLocation = [defaultLat, defaultLng];

    map = L.map('map').setView(userLocation, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    userMarker = L.marker(userLocation).addTo(map)
        .bindPopup('You are here!')
        .openPopup();
});

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
    // Видалення попереднього маршруту та маркера
    if (randomMarker) {
        map.removeLayer(randomMarker);
    }
    if (routeControl) {
        map.removeControl(routeControl);
        routeControl = null;
    }

    let radiusKm = parseFloat(document.getElementById('radius').value);
    
    // Перевірка мінімального радіуса
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

function buildRoute() {
    if (routeControl) {
        map.removeControl(routeControl);
    }

    routeControl = L.Routing.control({
        waypoints: [
            L.latLng(userLocation[0], userLocation[1]),
            L.latLng(randomMarker.getLatLng().lat, randomMarker.getLatLng().lng)
        ],
        routeWhileDragging: true
    }).addTo(map);
}
