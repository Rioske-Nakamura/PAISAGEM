import './style.css';

const cameraView = document.querySelector("#camera--view"),
  cameraOutput = document.querySelector("#camera--output"),
  cameraSensor = document.querySelector("#camera--sensor"),
  cameraTrigger = document.querySelector("#camera--trigger"),
  switchCameraButton = document.createElement("button");

switchCameraButton.innerText = "Trocar Câmera";
switchCameraButton.id = "switch-camera";
document.body.appendChild(switchCameraButton);

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
  
  // Verifica se o contêiner existe antes de adicionar conteúdo
  if (!gallery) return;

  gallery.innerHTML = ""; // Limpa a galeria antes de atualizar

  lastPhotos.forEach((photoWithLocation) => {
    const img = document.createElement("img");
    img.src = photoWithLocation.photo;
    img.classList.add("photo-preview");

    const locationInfo = document.createElement("h3");
    const locationInfo2 = document.createElement("h3");
    locationInfo.innerText = `Latitude: ${photoWithLocation.location.latitude}, Longitude ${photoWithLocation.location.longitude},`;
    locationInfo2.innerText = `LOCALIZAÇÃO:`;
    
    // Criando o iframe para o mapa
    const iframe = document.createElement("iframe");
    iframe.width = "100%";
    iframe.height = "300";
    iframe.frameborder = "0";
    iframe.style.border = "0";
    iframe.allowfullscreen = true;
    iframe.src = `https://www.google.com/maps?q=${photoWithLocation.location.latitude},${photoWithLocation.location.longitude}&z=15&output=embed`;

    // Adicionando elementos ao contêiner correto
    gallery.appendChild(img);
    gallery.appendChild(locationInfo);
    gallery.appendChild(locationInfo2);
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
  cameraSensor.width = cameraView.videoWidth;
  cameraSensor.height = cameraView.videoHeight;
  cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
  const photoData = cameraSensor.toDataURL("image/webp");
  cameraOutput.src = photoData;
  cameraOutput.classList.add("taken");

  navigator.geolocation.getCurrentPosition(async (posicao) => {
    const latitude = posicao.coords.latitude;
    const longitude = posicao.coords.longitude;

    const photoWithLocation = {
      photo: photoData,
      location: { latitude, longitude },
      timestamp: new Date().toISOString()
    };

    lastPhotos.push(photoWithLocation);
    if (lastPhotos.length > 3) lastPhotos.shift();
    
    await savePhoto(photoWithLocation);  // Salva no banco de dados
    updatePhotoGallery();  // Atualiza a galeria de fotos com o mapa
  }, erro);  // Caso haja erro na captura de localização
};

switchCameraButton.onclick = function () {
  cameraMode = cameraMode === "user" ? "environment" : "user";
  cameraStart();
};

window.addEventListener("load", () => {
  cameraStart();
  loadPhotos();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('.../sw.js', { type: "module" });
      console.log('Service Worker registrado!', reg);
      postNews();
    } catch (err) {
      console.log('Registro do Service Worker falhou:', err);
    }
  });
}

const photosData = [
  {
    latitude: -22.214346824182048, 
    longitude: -53.33518339065308,
    imagem: "https://i.pinimg.com/736x/11/aa/23/11aa23c22cd0752a71b7ee1a32f81fcc.jpg"
  },
  {
    latitude: -22.569880096410415, 
    longitude: -53.064891951778144,
    imagem: "https://i.pinimg.com/474x/d1/be/7f/d1be7f6664600b70a5716cb6c93aa450.jpg"
  },
  {
    latitude: -22.096453872803153, 
    longitude: -53.44228944072136,
    imagem: "https://i.pinimg.com/736x/fa/29/4f/fa294f53812229a9443635669afa6c70.jpg"
  },
  {
    latitude: -22.229431858164613, 
    longitude: -53.33654964587059,
    imagem: "https://i.pinimg.com/736x/9d/d1/d4/9dd1d4b9ee4fef428c7ff5c65df9fc72.jpg"
  },
  {
    latitude: -22.343058134790585, 
    longitude: -53.71800579135069,
    imagem: "https://i.pinimg.com/474x/21/0c/0c/210c0c54bb5cc94461b629ae8e944e7e.jpg"
  },
  {
    latitude: -22.211138262011172, 
    longitude: -53.33336583728294,
    imagem: "https://i.pinimg.com/736x/b6/da/20/b6da20d9218f8130062fc15f28d93d76.jpg"
  }
];

const cardsContainer = document.getElementById("cards-container");
const photoMap = document.getElementById("photo-map");

function createPhotoCards() {
  photosData.forEach((photo) => {
    const card = document.createElement("div");
    card.classList.add("photo-card");

    const img = document.createElement("img");
    img.src = photo.imagem;
    img.alt = "Foto com localização";

    card.appendChild(img);
    cardsContainer.appendChild(card);

    // Ao clicar no card, atualiza o iframe do mapa
    card.addEventListener("click", () => {
      const mapUrl = `https://www.google.com/maps?q=${photo.latitude},${photo.longitude}&z=15&output=embed`;
      photoMap.src = mapUrl;
    });
  });
}

// Chamando a função para exibir os cards na tela
createPhotoCards();


let apiKey = '3d8f9d821dc6485286cf6ec2d3871e15';
let url = `https://newsapi.org/v2/top-headlines?country=br&apiKey=${apiKey}`;

async function postNews() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    document.getElementById('news-container').innerHTML = data.articles
      .map(article => `<p>${article.title}</p>`)
      .join('');
  } catch (error) {
    console.error("Erro ao buscar notícias", error);
  }
}

const capturarLocalizacao = document.getElementById('localizacao');
const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');
const iframeMap = document.getElementById('map'); 

const sucesso = (posicao) => { 
  latitude.innerHTML = posicao.coords.latitude;
  longitude.innerHTML = posicao.coords.longitude;

  const mapUrl = `https://www.google.com/maps?q=${posicao.coords.latitude},${posicao.coords.longitude}&z=15&output=embed`;
  iframeMap.src = mapUrl;
};

const erro = (error) => { 
  let errorMessage;

  switch (error.code) {
    case 0:
      errorMessage = "Erro desconhecido";
      break;
    case 1:
      errorMessage = "Permissão negada!";
      break;
    case 2:
      errorMessage = "Captura de posição indisponível!";
      break;
    case 3:
      errorMessage = "Tempo de solicitação excedido!";
      break;
  }
  console.log('Ocorreu um erro: ' + errorMessage);
};

capturarLocalizacao.addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition(sucesso, erro);
});

document.getElementById('btnAtualizarAPI').addEventListener('click', () => {
  const newApiKey = document.getElementById('apiKeyInput').value.trim();
  if (newApiKey) {
    apiKey = newApiKey;
    url = `https://newsapi.org/v2/top-headlines?country=br&apiKey=${apiKey}`;
    postNews();
  } else {
    alert('Por favor, digite uma chave de API válida.');
  }
});
