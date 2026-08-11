import {
  COGNITO_REGION,
  COGNITO_CLIENT_ID,
} from "./config.js";

const COGNITO_ENDPOINT =
  `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

export function getIdToken() {
  return sessionStorage.getItem("idToken");
}

export function getRefreshToken() {
  return sessionStorage.getItem("refreshToken");
}

export function getExpiresAt() {
  const value =
    sessionStorage.getItem("expiresAt");

  return value
    ? Number(value)
    : null;
}

export function getAccessToken() {
  return sessionStorage.getItem("accessToken");
}

export function clearSession() {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("idToken");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("expiresAt");
}

export function isSessionExpired() {
  const expiresAt =
    getExpiresAt();

  if (!expiresAt) {
    return true;
  }

  return Date.now() >= expiresAt;
}


export function hasSession() {
  return Boolean(
    getIdToken() &&
    getRefreshToken()
  );
}


export async function refreshSession() {
  const refreshToken =
    getRefreshToken();

  if (!refreshToken) {
    throw new Error(
      "No refresh token is available."
    );
  }


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
        AuthFlow:
          "REFRESH_TOKEN_AUTH",

        ClientId:
          COGNITO_CLIENT_ID,

        AuthParameters: {
          REFRESH_TOKEN:
            refreshToken,
        },
      }),
    }
  );


  const result =
    await response.json();


  if (!response.ok) {
    clearSession();

    throw new Error(
      result.message ||
      result.Message ||
      "Session refresh failed."
    );
  }


  const authenticationResult =
    result.AuthenticationResult;


  if (!authenticationResult) {
    clearSession();

    throw new Error(
      "Cognito did not return refreshed credentials."
    );
  }


  sessionStorage.setItem(
    "accessToken",
    authenticationResult.AccessToken
  );

  sessionStorage.setItem(
    "idToken",
    authenticationResult.IdToken
  );

  sessionStorage.setItem(
    "expiresAt",
    String(
      Date.now() +
      authenticationResult.ExpiresIn * 1000
    )
  );

  return authenticationResult.IdToken;
}

export async function getValidIdToken() {
  if (!hasSession()) {
    return null;
  }

  if (!isSessionExpired()) {
    return getIdToken();
  }

  try {
    await refreshSession();

    return getIdToken();
  }

  catch (error) {
    console.error(
      "Unable to refresh session:",
      error
    );

    return null;
  }
}

export async function requireAuthentication() {
  const token =
    await getValidIdToken();


  if (!token) {
    window.location.href =
      "./login.html";

    return false;
  }
  return true;
}



export function logout() {
  clearSession();

  window.location.href =
    "./login.html";
}