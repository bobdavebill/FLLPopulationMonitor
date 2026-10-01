import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// LOGIN
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const msg = document.getElementById("loginMessage");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    window.location.href = "index.html";

  } catch (err) {
    msg.textContent = err.message;
  }
});


// SIGN UP
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const msg = document.getElementById("signupMessage");

  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    // Create Firebase Authentication account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // Create corresponding Firestore user document
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName: "",
      verified: false,
      createdAt: serverTimestamp()
    });

    msg.textContent =
      "Account created successfully. Your account must be verified before you can use the device or chat.";

  } catch (err) {
    msg.textContent = err.message;
  }
});