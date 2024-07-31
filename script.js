let map;
let userMarker;
let randomMarker;
let userLocation;
let watchId;
let user;

document.addEventListener("DOMContentLoaded", function() {
    if (localStorage.getItem("user")) {
        user = JSON.parse(localStorage.getItem("user"));
        updateUserInfo();
        showMap();
    }
    updateUserList();
});

function register() {
    const username = document.getElementById('username').value;
    if (username) {
        user = {
            username: username,
            pointsReached: 0
        };
        saveUserToStorage(user);
        updateUserInfo();
        showMap();
        updateUserList();
    } else {
        alert("Будь ласка, введіть ім'я користувача.");
    }
}

function saveUserToStorage(user) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    users = users.filter(u => u.username !== user.username);
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("user", JSON.stringify(user));
}

function updateUserInfo() {
    document.getElementById('display-username').textContent = user.username;
    document.getElementById('points-reached').textContent = user.pointsReached;
    document.getElementById('user-info').style.display = 'block';
}

function showMap() {
    document.getElementById('registration').style.display = 'none';
    document.getElementById('map').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
    
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
}

function initializeMap(location) {
    map = L.map('map').setView(location, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    userMarker = L.marker(location).addTo(map)
        .bindPopup('You are here!')
        .openPopup();

    watchId = navigator.geolocation.watchPosition(updateUserLocation, handleGeolocationError, {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000
    });
}

function updateUserLocation(position) {
    const { latitude, longitude } = position.coords;
    userLocation = [latitude, longitude];

    userMarker.setLatLng(userLocation);
    // Прибираємо автоматичне переміщення карти
    // map.panTo(userLocation);

    checkProximity();
    console.log('updated');
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
    alert("Вітаємо! Ви досягли випадкової точки.");
    user.pointsReached += 1;
    saveUserToStorage(user);
    updateUserInfo();
    map.removeLayer(randomMarker);
    randomMarker = null;
    updateUserList();
}

function updateUserList() {
    const userListContainer = document.getElementById('user-table').getElementsByTagName('tbody')[0];
    userListContainer.innerHTML = "";

    let users = JSON.parse(localStorage.getItem("users")) || [];
    users.sort((a, b) => b.pointsReached - a.pointsReached);

    users.forEach(user => {
        const row = userListContainer.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        cell1.textContent = user.username;
        cell2.textContent = user.pointsReached;
    });
}
