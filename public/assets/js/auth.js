async function createAccount() {
  try {
    const userCredential = await firebase
      .auth()
      .createUserWithEmailAndPassword(email1, pwd.value);
    var user = userCredential.user;
    await user.updateProfile({
      displayName: name,
      email: email1,
      photoURL:
        "https://firebasestorage.googleapis.com/v0/b/nubefilmacademysite.appspot.com/o/profilePictures%2FdefaultProfile.png?alt=media&token=",
    });
    return user.uid;
  } catch (error) {
    feedbackDiv.style.display = "inline";
    feedbackDiv.innerText = error.message;
  }
}

function signIn() {
  firebase
    .auth()
    .signInWithEmailAndPassword(email.value, pwd.value)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;
      user
        .getIdTokenResult()
        .then((idTokenResult) => {
          if (!!idTokenResult.claims.admin) {
            // const form = document.querySelector('#adminRedirect')
            // form.action = "<%=devFun%>/adminConsole/" + user.uid
            // form.submit()
            window.location = redirect + "/adminConsole/" + user.uid;
            // ...
          } else {
            window.location = redirect;
          }
        })
        .catch((error) => {
          console.log(error);
        });
      // ...
    })
    .catch((error) => {
      feedbackDiv.style.display = "inline";
      feedbackDiv.innerText = error.message;
    });
}

function signOut() {
  firebase
    .auth()
    .signOut()
    .then(() => {
      // Sign-out successful.
      window.location = redirect;
    })
    .catch((error) => {
      // An error happened.
      console.log("not signed out", error);
    });
}
