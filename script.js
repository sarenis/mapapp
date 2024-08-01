let map;
let userMarker;
let randomMarker;
let userLocation;
let watchId;
let user;
let routingControl;

document.addEventListener("DOMContentLoaded", function() {
    const toggleRoutingButton = document.getElementById('toggle-routing');
    const routingContainer = document.querySelector('.leaflet-routing-container');

    toggleRoutingButton.addEventListener('click', function() {
        if (routingContainer.style.display === 'none' || routingContainer.style.display === '') {
            routingContainer.style.display = 'block';
        } else {
            routingContainer.style.display = 'none';
        }
    });

    if (localStorage.getItem("currentUser")) {
        user = JSON.parse(localStorage.getItem("currentUser"));
        updateUserInfo();
        showMap();
        document.getElementById('user-profile').style.display = 'block';
    }
});

function register() {
    const username = document.getElementById('username').value;
    if (username) {
        user = {
            username: username,
            pointsReached: 0
        };
        localStorage.setItem("currentUser", JSON.stringify(user));
        saveUser(user);
        updateUserInfo();
        showMap();

        // Показуємо кнопку особистого кабінету після реєстрації
        document.getElementById('user-profile').style.display = 'block';
    } else {
        alert("Будь ласка, введіть ім'я користувача.");
    }
}

function saveUser(newUser) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const existingUserIndex = users.findIndex(u => u.username === newUser.username);
    if (existingUserIndex !== -1) {
        users[existingUserIndex] = newUser;
    } else {
        users.push(newUser);
    }
    localStorage.setItem("users", JSON.stringify(users));
}

function updateUserInfo() {
    const usernameElement = document.getElementById('display-username');
    const pointsElement = document.getElementById('points-reached');
    const userInfoElement = document.getElementById('user-info');

    if (usernameElement && pointsElement && userInfoElement) {
        usernameElement.textContent = user.username;
        pointsElement.textContent = user.pointsReached;
        userInfoElement.style.display = 'block';
    }

    const modalUsernameElement = document.getElementById('modal-username');
    const modalPointsElement = document.getElementById('modal-points-reached');

    if (modalUsernameElement && modalPointsElement) {
        modalUsernameElement.textContent = user.username;
        modalPointsElement.textContent = user.pointsReached;
    }
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
        .bindPopup('Ти тут!')
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

    checkProximity();
    console.log('updated');
}

function handleGeolocationError() {
    alert("Не вдалося отримати геопозицію.");
}

function generateRandomPoint() {
    if (randomMarker) {
        map.removeLayer(randomMarker);
    }

    let minRadiusKm = parseFloat(document.getElementById('min-radius').value);
    let maxRadiusKm = parseFloat(document.getElementById('max-radius').value);

    if (isNaN(minRadiusKm) || minRadiusKm < 2) {
        minRadiusKm = 2;
        document.getElementById('min-radius').value = minRadiusKm;
    }

    if (isNaN(maxRadiusKm) || maxRadiusKm < minRadiusKm) {
        maxRadiusKm = minRadiusKm;
        document.getElementById('max-radius').value = maxRadiusKm;
    }

    const randomPoint = getRandomPoint(userLocation, minRadiusKm, maxRadiusKm);

    randomMarker = L.marker(randomPoint).addTo(map)
        .bindPopup(`Рандомна позиція`)
        .openPopup();

    map.setView(randomPoint, 13);

    if (routingControl) {
        routingControl.setWaypoints([L.latLng(userLocation), L.latLng(randomPoint)]);
    } else {
        routingControl = L.Routing.control({
            waypoints: [L.latLng(userLocation), L.latLng(randomPoint)],
            routeWhileDragging: true,
            serviceUrl: 'https://router.project-osrm.org/route/v1'
        }).addTo(map);
    }
}

function getRandomPoint(center, minRadiusKm, maxRadiusKm) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * (maxRadiusKm - minRadiusKm) + minRadiusKm;
    const dx = distance * Math.cos(angle);
    const dy = distance * Math.sin(angle);
    const earthRadius = 6371;
    const newLat = center[0] + (dy / earthRadius) * (180 / Math.PI);
    const newLng = center[1] + (dx / earthRadius) * (180 / Math.PI) / Math.cos(center[0] * Math.PI / 180);
    return [newLat, newLng];
}

function checkProximity() {
    if (!randomMarker) return;

    const userLatLng = L.latLng(userLocation[0], userLocation[1]);
    const randomLatLng = randomMarker.getLatLng();

    if (userLatLng.distanceTo(randomLatLng) < 25) {
        onReachedRandomPoint();
    }
}

function onReachedRandomPoint() {
    alert("Вітаємо! Ви досягли випадкової точки.");
    user.pointsReached += 1;
    localStorage.setItem("currentUser", JSON.stringify(user));
    saveUser(user);
    updateUserInfo();
    updateUserList();
    map.removeLayer(randomMarker);
    randomMarker = null;

    if (routingControl) {
        routingControl.setWaypoints([]);
    }
}

function logout() {
    localStorage.removeItem("currentUser");

    const displayUsername = document.getElementById('display-username');
    const pointsReached = document.getElementById('points-reached');
    const modalUsername = document.getElementById('modal-username');
    const modalPointsReached = document.getElementById('modal-points-reached');
    const userProfile = document.getElementById('user-profile');
    const registration = document.getElementById('registration');
    const userInfo = document.getElementById('user-info');
    const map = document.getElementById('map');
    const controls = document.getElementById('controls');

    if (displayUsername) displayUsername.textContent = '';
    if (pointsReached) pointsReached.textContent = '';
    if (modalUsername) modalUsername.textContent = '';
    if (modalPointsReached) modalPointsReached.textContent = '';

    if (userProfile) userProfile.style.display = 'none';
    if (registration) registration.style.display = 'block';
    if (userInfo) userInfo.style.display = 'none';
    if (map) map.style.display = 'none';
    if (controls) controls.style.display = 'none';

    if (typeof watchId !== 'undefined' && watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    if (typeof randomMarker !== 'undefined' && randomMarker !== null) {
        map.removeLayer(randomMarker);
        randomMarker = null;
    }

    location.reload();
}

function openProfile() {
    document.getElementById('modal-username').textContent = user.username;
    document.getElementById('modal-points-reached').textContent = user.pointsReached;
    document.getElementById('profile-modal').style.display = 'block';
}

function closeProfile() {
    document.getElementById('profile-modal').style.display = 'none';
}
