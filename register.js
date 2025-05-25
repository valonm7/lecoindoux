// register.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// Added Firestore imports for storing user details
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; // Added serverTimestamp

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCx5tv97A5GBce-iOECUYs_3G_IIm9TKB0", // Replace with your actual API key
  authDomain: "lecoindoux-6fda5.firebaseapp.com",
  projectId: "lecoindoux-6fda5",
  storageBucket: "lecoindoux-6fda5.appspot.com",
  messagingSenderId: "945779817294",
  appId: "1:945779817294:web:aa4940fbeee23e69d8fc1f",
  measurementId: "G-ZNYERDRF1T"
};
console.log("register.js: Config set", firebaseConfig);


// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("register.js: App initialized");
const auth = getAuth(app);
console.log("register.js: Auth initialized");
const db = getFirestore(app);
console.log("register.js: Firestore initialized");


// Get DOM elements
const signupForm = document.getElementById("signup-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const phoneNumberInput = document.getElementById("phoneNumber"); // Make sure this ID exists in your signup.html
const addressInput = document.getElementById("address");       // Make sure this ID exists in your signup.html
const errorMessageDiv = document.getElementById("error-message");

console.log("register.js: DOM Elements Check:", {
    signupForm: !!signupForm, nameInput: !!nameInput, emailInput: !!emailInput,
    passwordInput: !!passwordInput, phoneNumberInput: !!phoneNumberInput,
    addressInput: !!addressInput, errorMessageDiv: !!errorMessageDiv
});


if (signupForm) {
    console.log("register.js: Adding event listener to signup form.");
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        console.log("register.js: Signup form submitted.");

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value; // No trim for password
        const phoneNumber = phoneNumberInput ? phoneNumberInput.value.trim() : '';
        const address = addressInput ? addressInput.value.trim() : '';

        errorMessageDiv.textContent = ""; // Clear previous messages

        console.log("register.js: Form values - Name:", name, "Email:", email, "Phone:", phoneNumber, "Address:", address);


        if (!name || !email || !password) {
            errorMessageDiv.textContent = "Ju lutem plotësoni të gjitha fushat e kërkuara (Emri, Email, Fjalëkalimi).";
            errorMessageDiv.style.color = "red";
            return;
        }
        if (password.length < 6) {
            errorMessageDiv.textContent = "Fjalëkalimi duhet të ketë të paktën 6 karaktere.";
            errorMessageDiv.style.color = "red";
            return;
        }

        // Optional: Basic phone number validation (example)
        // const phoneRegex = /^[0-9\s+()-]*$/; // Allows numbers, spaces, +, (, )
        // if (phoneNumber && !phoneRegex.test(phoneNumber)) {
        //     errorMessageDiv.textContent = "Numri i telefonit nuk është i vlefshëm.";
        //     errorMessageDiv.style.color = "red";
        //     return;
        // }

        console.log("register.js: Attempting to create user...");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("register.js: User created in Auth. UID:", user.uid);

            console.log("register.js: Updating Auth profile display name...");
            await updateProfile(user, {
                displayName: name
            });
            console.log("register.js: Auth profile updated.");

            console.log("register.js: Storing additional user data in Firestore...");
            await setDoc(doc(db, "users", user.uid), {
              uid: user.uid,
              displayName: name, // Storing here too for easier querying if needed, though Auth is primary for this
              email: user.email, // Storing here too for easier querying
              phoneNumber: phoneNumber,
              address: address,
              createdAt: serverTimestamp() // Use Firebase server timestamp
            });
            console.log("register.js: User data stored in Firestore for UID:", user.uid);

            // UX: Display a success message briefly before redirecting
            errorMessageDiv.textContent = "Regjistrimi u krye me sukses! Duke ju ridrejtuar tek faqja e hyrjes...";
            errorMessageDiv.style.color = "green";

            // OPTIONAL: Sign out immediately if you want to force login after registration
            // If you remove this, the user will be auto-logged-in after registration
            // and onAuthStateChanged on index.html (if they were to go there) would pick them up.
            // Forcing a sign-out and then login is a specific UX choice.
            // console.log("register.js: Signing out user to force login...");
            // await signOut(auth);
            // console.log("register.js: User signed out.");

            setTimeout(() => {
                console.log("register.js: Redirecting to login.html");
                window.location.href = "login.html"; // Use href for standard redirection
            }, 2000); // Delay for the user to see the success message

        } catch (error) {
            console.error("register.js: Error during registration:", error);
            errorMessageDiv.textContent = ""; // Clear any previous success messages
            errorMessageDiv.style.color = "red";

            let friendlyMessage = "Regjistrimi dështoi. Ju lutem provoni përsëri.";
            if (error.code) {
                switch (error.code) {
                    case "auth/email-already-in-use":
                        friendlyMessage = "Kjo adresë email-i është tashmë e regjistruar.";
                        break;
                    case "auth/invalid-email":
                        friendlyMessage = "Adresa e email-it nuk është e vlefshme.";
                        break;
                    case "auth/weak-password":
                        friendlyMessage = "Fjalëkalimi është shumë i dobët.";
                        break;
                    default:
                        friendlyMessage = `Gabim: ${error.message} (Kodi: ${error.code})`;
                }
            }
            errorMessageDiv.textContent = friendlyMessage;
        }
    });
} else {
    console.error("register.js: Signup form element (#signup-form) not found!");
}
console.log("register.js: Script loaded.");