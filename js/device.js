import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ==================================================
// PAGE ELEMENTS
// ==================================================

const status =
  document.getElementById("deviceStatus");

const content =
  document.getElementById("deviceContent");

const modelUrlInput =
  document.getElementById("modelUrl");

const loadModelButton =
  document.getElementById("loadModelButton");

const startCameraButton =
  document.getElementById("startCameraButton");

const modelStatus =
  document.getElementById("modelStatus");

const webcamContainer =
  document.getElementById("webcam-container");

const predictionDisplay =
  document.getElementById("prediction");

const observationStatus =
  document.getElementById("observationStatus");


// ==================================================
// TEACHABLE MACHINE VARIABLES
// ==================================================

let model = null;

let webcam = null;

let cameraRunning = false;

let maxPredictions = 0;


// ==================================================
// SETTINGS
// ==================================================

// Minimum confidence required before recording.
const CONFIDENCE_THRESHOLD = 0.85;


// Prevent the same animal being recorded
// over and over again while it remains in view.
//
// 10 seconds = 10000 milliseconds.
const OBSERVATION_COOLDOWN = 10000;


// Stores the last recording time for each species.
const lastRecorded = {};


// ==================================================
// CLASSES THAT SHOULD NEVER BE RECORDED
// ==================================================
//
// Your Teachable Machine model should ideally have:
//
// Kangaroo
// Wallaby
// Possum
// Koala
// Nothing
//
// "Nothing" will be ignored.
//

const IGNORED_CLASSES = [

  "nothing",

  "no animal",

  "noanimal",

  "no animal detected",

  "nothing detected",

  "none",

  "background",

  "empty",

  "blank",

  "unknown",

  "no detection"

];


// ==================================================
// CHECK FIRESTORE VERIFICATION
// ==================================================

async function checkVerification(user) {

  if (!user) {
    return false;
  }


  const userRef =
    doc(db, "users", user.uid);


  const userSnap =
    await getDoc(userRef);


  if (!userSnap.exists()) {

    return false;

  }


  return userSnap.data().verified === true;

}


// ==================================================
// AUTHENTICATION
// ==================================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      status.textContent =
        "Please sign in to access the device.";

      content.style.display =
        "none";

      return;

    }


    try {

      const verified =
        await checkVerification(user);


      if (!verified) {

        status.textContent =
          "Your account has not been verified.";

        content.style.display =
          "none";

        return;

      }


      // Account is verified.
      status.textContent = "";

      content.style.display =
        "block";


    } catch (error) {

      console.error(
        "Verification error:",
        error
      );


      status.textContent =
        "Unable to check account access.";

      content.style.display =
        "none";

    }

  }
);


// ==================================================
// LOAD SAVED MODEL URL
// ==================================================

if (modelUrlInput) {

  const savedModelUrl =
    localStorage.getItem(
      "teachableModelUrl"
    );


  if (savedModelUrl) {

    modelUrlInput.value =
      savedModelUrl;

  }


  modelUrlInput.addEventListener(
    "change",
    () => {

      localStorage.setItem(
        "teachableModelUrl",
        modelUrlInput.value.trim()
      );

    }
  );

}


// ==================================================
// GET MODEL URL
// ==================================================

function getModelUrl() {

  let url =
    modelUrlInput.value.trim();


  if (!url) {

    throw new Error(
      "Please enter your Teachable Machine model URL."
    );

  }


  // Make sure the URL ends in /
  if (!url.endsWith("/")) {

    url += "/";

  }


  return url;

}


// ==================================================
// LOAD TEACHABLE MACHINE MODEL
// ==================================================

if (loadModelButton) {

  loadModelButton.addEventListener(
    "click",
    async () => {

      try {

        const baseUrl =
          getModelUrl();


        // Save the URL
        localStorage.setItem(
          "teachableModelUrl",
          baseUrl
        );


        modelStatus.textContent =
          "Loading model...";


        loadModelButton.disabled =
          true;


        startCameraButton.disabled =
          true;


        const modelURL =
          baseUrl + "model.json";


        const metadataURL =
          baseUrl + "metadata.json";


        // Load model
        model =
          await tmImage.load(
            modelURL,
            metadataURL
          );


        maxPredictions =
          model.getTotalClasses();


        // Get the actual class names
        const classLabels =
          model.getClassLabels();


        console.log(
          "Teachable Machine classes:",
          classLabels
        );


        modelStatus.textContent =
          `Model loaded. ${maxPredictions} classes detected.`;


        startCameraButton.disabled =
          false;


      } catch (error) {

        console.error(
          "Model loading error:",
          error
        );


        modelStatus.textContent =
          `Could not load model: ${error.message}`;


        loadModelButton.disabled =
          false;


        startCameraButton.disabled =
          true;

      }

    }
  );

}


// ==================================================
// START CAMERA
// ==================================================

if (startCameraButton) {

  startCameraButton.addEventListener(
    "click",
    async () => {

      if (!model) {

        alert(
          "Please load the Teachable Machine model first."
        );

        return;

      }


      if (cameraRunning) {

        return;

      }


      try {

        startCameraButton.disabled =
          true;


        modelStatus.textContent =
          "Starting camera...";


        // Flip camera horizontally
        const flip = true;


        webcam =
          new tmImage.Webcam(
            400,
            400,
            flip
          );


        await webcam.setup();


        await webcam.play();


        webcamContainer.innerHTML =
          "";


        webcamContainer.appendChild(
          webcam.canvas
        );


        cameraRunning =
          true;


        modelStatus.textContent =
          "Camera running. Looking for animals...";


        predictionDisplay.innerHTML =
          "<strong>Detected animal:</strong> Waiting...";


        observationStatus.textContent =
          "No observation recorded yet.";


        window.requestAnimationFrame(
          predictionLoop
        );


      } catch (error) {

        console.error(
          "Camera error:",
          error
        );


        modelStatus.textContent =
          `Could not start camera: ${error.message}`;


        startCameraButton.disabled =
          false;

      }

    }
  );

}


// ==================================================
// PREDICTION LOOP
// ==================================================

async function predictionLoop() {

  if (
    !cameraRunning ||
    !webcam ||
    !model
  ) {

    return;

  }


  // Get the latest camera frame.
  webcam.update();


  try {

    await predict();

  } catch (error) {

    console.error(
      "Prediction error:",
      error
    );

  }


  window.requestAnimationFrame(
    predictionLoop
  );

}


// ==================================================
// PREDICT
// ==================================================

async function predict() {

  // Teachable Machine returns an array containing
  // className + probability for each class.
  const predictions =
    await model.predict(
      webcam.canvas
    );


  if (
    !predictions ||
    predictions.length === 0
  ) {

    return;

  }


  // ----------------------------------------------
  // FIND HIGHEST PREDICTION
  // ----------------------------------------------

  let bestPrediction =
    predictions[0];


  for (
    let i = 1;
    i < predictions.length;
    i++
  ) {

    if (
      predictions[i].probability >
      bestPrediction.probability
    ) {

      bestPrediction =
        predictions[i];

    }

  }


  const species =
    bestPrediction.className.trim();


  const confidence =
    bestPrediction.probability;


  const percentage =
    (confidence * 100).toFixed(1);


  // ----------------------------------------------
  // DISPLAY CURRENT PREDICTION
  // ----------------------------------------------

  predictionDisplay.innerHTML =
    `<strong>Detected:</strong> ${species}<br>` +
    `<strong>Confidence:</strong> ${percentage}%`;


  // ----------------------------------------------
  // NORMALISE CLASS NAME
  // ----------------------------------------------

  const normalisedSpecies =
    species
      .toLowerCase()
      .trim();


  // ----------------------------------------------
  // IGNORE "NOTHING"
  // ----------------------------------------------

  if (
    IGNORED_CLASSES.includes(
      normalisedSpecies
    )
  ) {

    observationStatus.textContent =
      "No animal detected. Nothing recorded.";

    return;

  }


  // ----------------------------------------------
  // IGNORE LOW CONFIDENCE
  // ----------------------------------------------

  if (
    confidence <
    CONFIDENCE_THRESHOLD
  ) {

    observationStatus.textContent =
      "Animal not detected with enough confidence.";

    return;

  }


  // ----------------------------------------------
  // RECORD REAL ANIMAL
  // ----------------------------------------------

  await automaticallyRecord(
    species,
    confidence
  );

}


// ==================================================
// AUTOMATIC FIRESTORE RECORDING
// ==================================================

async function automaticallyRecord(
  species,
  confidence
) {

  const now =
    Date.now();


  const previousTime =
    lastRecorded[species] || 0;


  // ----------------------------------------------
  // COOLDOWN
  // ----------------------------------------------

  if (
    now - previousTime <
    OBSERVATION_COOLDOWN
  ) {

    return;

  }


  // ----------------------------------------------
  // CHECK USER
  // ----------------------------------------------

  const user =
    auth.currentUser;


  if (!user) {

    return;

  }


  try {

    // Check verification again before writing.
    const verified =
      await checkVerification(user);


    if (!verified) {

      observationStatus.textContent =
        "Account is not verified.";

      return;

    }


    // --------------------------------------------
    // SAVE SIGHTING
    // --------------------------------------------

    await addDoc(
      collection(db, "sightings"),
      {

        species: species,

        confidence: confidence,

        timestamp: serverTimestamp(),

        deviceId: "demo-device",

        recordedBy: user.uid,

        source: "teachable-machine"

      }
    );


    // Only update cooldown after
    // Firestore successfully saves.
    lastRecorded[species] =
      now;


    const percentage =
      (confidence * 100).toFixed(1);


    observationStatus.textContent =
      `Observation recorded: ${species} ` +
      `(${percentage}% confidence)`;


  } catch (error) {

    console.error(
      "Automatic observation error:",
      error
    );


    observationStatus.textContent =
      `Could not save observation: ${error.message}`;

  }

}


// ==================================================
// MANUAL RECORDING
// ==================================================

async function recordSighting(species) {

  const user =
    auth.currentUser;


  if (!user) {

    alert(
      "You must be logged in."
    );

    return;

  }


  try {

    const verified =
      await checkVerification(user);


    if (!verified) {

      alert(
        "Your account is not verified."
      );

      return;

    }


    // ----------------------------------------------
    // SAVE MANUAL SIGHTING
    // ----------------------------------------------

    await addDoc(
      collection(db, "sightings"),
      {

        species: species,

        timestamp: serverTimestamp(),

        deviceId: "demo-device",

        recordedBy: user.uid,

        source: "manual"

      }
    );


    alert(
      `${species} sighting recorded successfully.`
    );


  } catch (error) {

    console.error(
      "Manual observation error:",
      error
    );


    alert(
      `Could not record sighting:\n${error.message}`
    );

  }

}


// ==================================================
// MAKE MANUAL FUNCTION AVAILABLE TO HTML
// ==================================================

window.recordSighting =
  recordSighting;