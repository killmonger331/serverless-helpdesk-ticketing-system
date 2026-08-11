import {
  COGNITO_REGION,
  COGNITO_CLIENT_ID,
} from "./config.js";


const loginForm =
  document.getElementById("login-form");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const loginButton =
  document.getElementById("login-button");

const loginMessage =
  document.getElementById("login-message");


const COGNITO_ENDPOINT =
  `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;


function storeSession(authenticationResult) {
  sessionStorage.setItem(
    "accessToken",
    authenticationResult.AccessToken
  );

  sessionStorage.setItem(
    "idToken",
    authenticationResult.IdToken
  );

  sessionStorage.setItem(
    "refreshToken",
    authenticationResult.RefreshToken
  );

  sessionStorage.setItem(
    "expiresAt",
    String(
      Date.now() +
      authenticationResult.ExpiresIn * 1000
    )
  );
}


async function signIn(email, password) {
  const response = await fetch(
    COGNITO_ENDPOINT,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-amz-json-1.1",

        "X-Amz-Target":
          "AWSCognitoIdentityProviderService.InitiateAuth",
      },

      body: JSON.stringify({
        AuthFlow: "USER_PASSWORD_AUTH",

        ClientId:
          COGNITO_CLIENT_ID,

        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      }),
    }
  );


  const result = await response.json();


  if (!response.ok) {
    throw new Error(
      result.message ||
      result.Message ||
      "Sign-in failed."
    );
  }


  if (!result.AuthenticationResult) {
    throw new Error(
      "Cognito did not return an authentication result."
    );
  }


  return result.AuthenticationResult;
}


loginForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";

    loginMessage.textContent =
      "Authenticating...";


    try {
      const authenticationResult =
        await signIn(
          emailInput.value.trim(),
          passwordInput.value
        );


      storeSession(authenticationResult);


      loginMessage.textContent =
        "Sign-in successful.";


      window.location.href =
        "./admin.html";
    }

    catch (error) {
      console.error(error);

      loginMessage.textContent =
        error.message;
    }

    finally {
      loginButton.disabled = false;
      loginButton.textContent = "Sign in";
    }
  }
);