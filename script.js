let map;
let userMarker;
let randomMarker;
let userLocation;
let watchId;
let user;

document.addEventListener("DOMContentLoaded", function() {
    if (localStorage.getItem("currentUser")) {
        user = JSON.parse(localStorage.getItem("currentUser"));
        updateUserInfo();
        showMap();
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

    // Переконуємося, що мінімальний радіус не менше 4 км
    if (isNaN(minRadiusKm) || minRadiusKm < 2) {
        minRadiusKm = 2;
        document.getElementById('min-radius').value = minRadiusKm;
    }

    // Переконуємося, що максимальний радіус не менше мінімального
    if (isNaN(maxRadiusKm) || maxRadiusKm < minRadiusKm) {
        maxRadiusKm = minRadiusKm;
        document.getElementById('max-radius').value = maxRadiusKm;
    }

    const randomPoint = getRandomPoint(userLocation, minRadiusKm, maxRadiusKm);

    randomMarker = L.marker(randomPoint).addTo(map)
        .bindPopup(`Random Position: [${randomPoint[0].toFixed(5)}, ${randomPoint[1].toFixed(5)}]`)
        .openPopup();

    map.setView(randomPoint, 13);
}

function getRandomPoint(center, minRadiusKm, maxRadiusKm) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * (maxRadiusKm - minRadiusKm) + minRadiusKm; // Випадковий радіус в межах заданого діапазону
    const dx = distance * Math.cos(angle);
    const dy = distance * Math.sin(angle);
    const earthRadius = 6371; // Радіус Землі в км
    const newLat = center[0] + (dy / earthRadius) * (180 / Math.PI);
    const newLng = center[1] + (dx / earthRadius) * (180 / Math.PI) / Math.cos(center[0] * Math.PI / 180);
    return [newLat, newLng];
}



function checkProximity() {
    if (!randomMarker) return;

    const userLatLng = L.latLng(userLocation[0], userLocation[1]);
    const randomLatLng = randomMarker.getLatLng();

    if (userLatLng.distanceTo(randomLatLng) < 10) { // 50 метрів для точності
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
}

function logout() {
    // Видаляємо інформацію про поточного користувача
    localStorage.removeItem("currentUser");

    // Очищуємо текстові поля
    document.getElementById('display-username').textContent = '';
    document.getElementById('points-reached').textContent = '';

    document.getElementById('modal-username').textContent = '';
    document.getElementById('modal-points-reached').textContent = '';

    // Показуємо форму реєстрації та ховаємо інші елементи
    document.getElementById('registration').style.display = 'block';
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('map').style.display = 'none';
    document.getElementById('controls').style.display = 'none';

    // Якщо є спостереження за геопозицією, зупиняємо його
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    // Видаляємо маркер випадкової точки, якщо він є
    if (randomMarker) {
        map.removeLayer(randomMarker);
        randomMarker = null;
    }

    // Оновлюємо сторінку, щоб очистити кеш
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

function logout() {
    localStorage.removeItem("currentUser");
    document.getElementById('registration').style.display = 'block';
    document.getElementById('map').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('profile-modal').style.display = 'none';

    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    if (randomMarker) {
        map.removeLayer(randomMarker);
        randomMarker = null;
    }
}
