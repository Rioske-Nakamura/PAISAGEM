import './style.css';

const cameraView = document.querySelector("#camera--view"),
  cameraSensor = document.querySelector("#camera--sensor"),
  cameraTrigger = document.querySelector("#camera--trigger"),
  switchCameraButton = document.getElementById("switch-camera"),
  photoTitleInput = document.getElementById("photo-title");

let cameraMode = "user";
const lastPhotos = [];

const constraints = () => ({ video: { facingMode: cameraMode }, audio: false });

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("cameraDB", 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("photos")) {
        db.createObjectStore("photos", { autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePhoto(photoWithLocation) {
  const db = await openDB();
  const transaction = db.transaction("photos", "readwrite");
  const store = transaction.objectStore("photos");
  store.add(photoWithLocation);
}

async function loadPhotos() {
  const db = await openDB();
  const transaction = db.transaction("photos", "readonly");
  const store = transaction.objectStore("photos");
  const request = store.getAll();
  request.onsuccess = () => {
    const photos = request.result.slice(-10);
    lastPhotos.length = 0;
    lastPhotos.push(...photos);
    updatePhotoGallery();
  };
}

function updatePhotoGallery() {
  let gallery = document.getElementById("photo-gallery");
  if (!gallery) return;

  gallery.innerHTML = ""; // Limpa a galeria antes de atualizar

  lastPhotos.forEach((photoWithLocation) => {
    const img = document.createElement("img");
    img.src = photoWithLocation.photo;
    img.classList.add("photo-preview");

    const title = document.createElement("h3");
    title.innerText = `Título: ${photoWithLocation.title || "Sem título"}`;

    const locationInfo = document.createElement("p");
    locationInfo.innerText = `Latitude: ${photoWithLocation.location.latitude}, Longitude: ${photoWithLocation.location.longitude}`;

    const iframe = document.createElement("iframe");
    iframe.width = "100%";
    iframe.height = "300";
    iframe.frameborder = "0";
    iframe.style.border = "0";
    iframe.allowfullscreen = true;
    iframe.src = `https://www.google.com/maps?q=${photoWithLocation.location.latitude},${photoWithLocation.location.longitude}&z=15&output=embed`;

    gallery.appendChild(img);
    gallery.appendChild(title);
    gallery.appendChild(locationInfo);
    gallery.appendChild(iframe);
  });
}

function cameraStart() {
  navigator.mediaDevices
    .getUserMedia(constraints())
    .then((stream) => {
      cameraView.srcObject = stream;
    })
    .catch((error) => console.error("Ocorreu um erro.", error));
}

cameraTrigger.onclick = async function () {
  const photoTitle = photoTitleInput.value.trim();
  if (!photoTitle) {
    alert("Por favor, insira um título antes de tirar a foto.");
    return;
  }

  cameraSensor.width = cameraView.videoWidth;
  cameraSensor.height = cameraView.videoHeight;
  cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
  const photoData = cameraSensor.toDataURL("image/webp");

  navigator.geolocation.getCurrentPosition(async (posicao) => {
    const latitude = posicao.coords.latitude;
    const longitude = posicao.coords.longitude;

    const photoWithLocation = {
      title: photoTitle, // Salva o título junto com a foto
      photo: photoData,
      location: { latitude, longitude },
      timestamp: new Date().toISOString()
    };

    lastPhotos.push(photoWithLocation);
    if (lastPhotos.length > 3) lastPhotos.shift();

    await savePhoto(photoWithLocation);
    updatePhotoGallery();
  }, erro);
};

switchCameraButton.onclick = function () {
  cameraMode = cameraMode === "user" ? "environment" : "user";
  cameraStart();
};

window.addEventListener("load", () => {
  cameraStart();
  loadPhotos();
});

const capturarLocalizacao = document.getElementById('localizacao');
const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');
const iframeMap = document.getElementById('map'); 

const sucesso = (posicao) => { 
  latitude.innerHTML = posicao.coords.latitude;
  longitude.innerHTML = posicao.coords.longitude;
  iframeMap.src = `https://www.google.com/maps?q=${posicao.coords.latitude},${posicao.coords.longitude}&z=15&output=embed`;
};

const erro = (error) => { 
  let errorMessage;
  switch (error.code) {
    case 0: errorMessage = "Erro desconhecido"; break;
    case 1: errorMessage = "Permissão negada!"; break;
    case 2: errorMessage = "Captura de posição indisponível!"; break;
    case 3: errorMessage = "Tempo de solicitação excedido!"; break;
  }
  console.log('Ocorreu um erro: ' + errorMessage);
};

capturarLocalizacao.addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition(sucesso, erro);
});
