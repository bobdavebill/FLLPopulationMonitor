import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


const status = document.getElementById("chatStatus");
const content = document.getElementById("chatContent");
const form = document.getElementById("chatForm");
const messagesContainer =
  document.getElementById("messages");


// --------------------------------------------------
// CHECK FIRESTORE VERIFICATION
// --------------------------------------------------

async function checkVerification(user) {

  const userRef = doc(db, "users", user.uid);

  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return false;
  }

  return userSnap.data().verified === true;
}


// --------------------------------------------------
// LOAD MESSAGES
// --------------------------------------------------

function loadMessages() {

  const messagesQuery = query(
    collection(db, "messages"),
    orderBy("timestamp", "asc")
  );


  onSnapshot(
    messagesQuery,

    (snapshot) => {

      messagesContainer.innerHTML = "";


      snapshot.forEach((messageDoc) => {

        const data = messageDoc.data();

        const messageElement =
          document.createElement("div");

        messageElement.style.padding = "10px";
        messageElement.style.marginBottom = "8px";
        messageElement.style.borderBottom =
          "1px solid #ddd";


        const emailElement =
          document.createElement("strong");

        emailElement.textContent =
          data.email || "Unknown user";


        const textElement =
          document.createElement("p");

        textElement.textContent =
          data.message || "";


        messageElement.appendChild(
          emailElement
        );

        messageElement.appendChild(
          textElement
        );


        messagesContainer.appendChild(
          messageElement
        );

      });


      messagesContainer.scrollTop =
        messagesContainer.scrollHeight;

    },

    (error) => {

      console.error(error);

      messagesContainer.textContent =
        "Could not load messages.";

    }
  );
}


// --------------------------------------------------
// CHECK LOGIN + VERIFICATION
// --------------------------------------------------

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    status.textContent =
      "Please sign in to access the chat.";

    content.style.display = "none";

    return;
  }


  try {

    const verified =
      await checkVerification(user);


    if (!verified) {

      status.textContent =
        "Your account has not been verified.";

      content.style.display = "none";

      return;
    }


    // Verified
    status.textContent = "";

    content.style.display = "block";

    loadMessages();


  } catch (error) {

    console.error(error);

    status.textContent =
      "Unable to check account access.";

    content.style.display = "none";

  }

});


// --------------------------------------------------
// SEND MESSAGE
// --------------------------------------------------

form.addEventListener("submit", async (event) => {

  event.preventDefault();


  const user = auth.currentUser;


  if (!user) {

    alert("You must be logged in.");

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


    const messageInput =
      document.getElementById("message");


    const message =
      messageInput.value.trim();


    if (!message) {
      return;
    }


    await addDoc(
      collection(db, "messages"),
      {
        message: message,
        email: user.email,
        userId: user.uid,
        timestamp: serverTimestamp()
      }
    );


    messageInput.value = "";


  } catch (error) {

    console.error(error);

    alert(
      `Could not send message:\n${error.message}`
    );

  }

});