import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// --------------------------------------------------
// PAGE ELEMENTS
// --------------------------------------------------

const status =
  document.getElementById("dashboardStatus");

const content =
  document.getElementById("dashboardContent");

const totalSightings =
  document.getElementById("totalSightings");

const kangarooCount =
  document.getElementById("kangarooCount");

const wallabyCount =
  document.getElementById("wallabyCount");

const possumCount =
  document.getElementById("possumCount");

const koalaCount =
  document.getElementById("koalaCount");

const recentSightings =
  document.getElementById("recentSightings");


// --------------------------------------------------
// CHECK THAT ELEMENTS EXIST
// --------------------------------------------------

if (!status) {
  console.error("dashboardStatus element not found.");
}


// --------------------------------------------------
// LOAD SIGHTINGS
// --------------------------------------------------

async function loadSightings() {

  const snapshot =
    await getDocs(
      collection(db, "sightings")
    );


  const sightings = [];


  snapshot.forEach((doc) => {

    const data = doc.data();

    sightings.push({
      id: doc.id,
      ...data
    });

  });


  // Sort newest first.
  // We do this in JavaScript instead of using
  // Firestore orderBy(), so the demo does not
  // depend on a Firestore index.

  sightings.sort((a, b) => {

    const timeA =
      a.timestamp?.toMillis?.() || 0;

    const timeB =
      b.timestamp?.toMillis?.() || 0;

    return timeB - timeA;

  });


  return sightings;

}


// --------------------------------------------------
// CHECK WHETHER SIGHTING IS FROM TODAY
// --------------------------------------------------

function isToday(timestamp) {

  if (!timestamp) {
    return false;
  }


  const date =
    timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);


  const now =
    new Date();


  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );

}


// --------------------------------------------------
// DISPLAY DASHBOARD
// --------------------------------------------------

async function loadDashboard() {

  try {

    status.textContent =
      "Loading sightings...";


    const sightings =
      await loadSightings();


    // ----------------------------------------------
    // TODAY'S SIGHTINGS
    // ----------------------------------------------

    const todaySightings =
      sightings.filter(
        sighting =>
          isToday(sighting.timestamp)
      );


    // ----------------------------------------------
    // COUNTS
    // ----------------------------------------------

    const kangaroos =
      todaySightings.filter(
        s => s.species === "Kangaroo"
      ).length;


    const wallabies =
      todaySightings.filter(
        s => s.species === "Wallaby"
      ).length;


    const possums =
      todaySightings.filter(
        s => s.species === "Possum"
      ).length;


    const koalas =
      todaySightings.filter(
        s => s.species === "Koala"
      ).length;


    // ----------------------------------------------
    // UPDATE NUMBERS
    // ----------------------------------------------

    totalSightings.textContent =
      todaySightings.length;

    kangarooCount.textContent =
      kangaroos;

    wallabyCount.textContent =
      wallabies;

    possumCount.textContent =
      possums;

    koalaCount.textContent =
      koalas;


    // ----------------------------------------------
    // RECENT SIGHTINGS
    // ----------------------------------------------

    recentSightings.innerHTML = "";


    if (sightings.length === 0) {

      recentSightings.textContent =
        "No sightings have been recorded yet.";

    } else {

      const recent =
        sightings.slice(0, 10);


      recent.forEach((sighting) => {

        const item =
          document.createElement("div");


        item.style.padding =
          "12px 0";


        item.style.borderBottom =
          "1px solid #ddd";


        const species =
          document.createElement("strong");


        species.textContent =
          sighting.species || "Unknown animal";


        item.appendChild(
          species
        );


        // Confidence
        if (
          typeof sighting.confidence === "number"
        ) {

          const confidence =
            document.createElement("span");


          confidence.textContent =
            ` — ${(sighting.confidence * 100).toFixed(1)}% confidence`;


          item.appendChild(
            confidence
          );

        }


        // Source
        if (sighting.source) {

          const source =
            document.createElement("div");


          source.style.fontSize =
            "0.9rem";


          source.style.opacity =
            "0.7";


          source.textContent =
            `Source: ${sighting.source}`;


          item.appendChild(
            source
          );

        }


        // Timestamp
        if (sighting.timestamp) {

          const timestamp =
            document.createElement("div");


          timestamp.style.fontSize =
            "0.9rem";


          timestamp.style.opacity =
            "0.7";


          const date =
            sighting.timestamp.toDate
              ? sighting.timestamp.toDate()
              : new Date(sighting.timestamp);


          timestamp.textContent =
            date.toLocaleString();


          item.appendChild(
            timestamp
          );

        }


        recentSightings.appendChild(
          item
        );

      });

    }


    // ----------------------------------------------
    // SHOW DASHBOARD
    // ----------------------------------------------

    status.textContent =
      "";


    content.style.display =
      "block";


  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );


    status.textContent =
      `Could not load dashboard: ${error.message}`;


    content.style.display =
      "none";

  }

}


// --------------------------------------------------
// AUTHENTICATION
// --------------------------------------------------

onAuthStateChanged(
  auth,
  async (user) => {

    console.log(
      "Dashboard auth state:",
      user
        ? user.email
        : "signed out"
    );


    if (!user) {

      status.textContent =
        "Please sign in to view the dashboard.";

      content.style.display =
        "none";

      return;

    }


    await loadDashboard();

  }
);