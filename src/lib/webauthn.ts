/**
 * Local WebAuthn Biometric Lock Utility
 * This creates a privacy lock using the device's platform authenticator (e.g. Face ID, Touch ID, Windows Hello).
 * It generates local credentials and verifies them without a backend.
 */

// Helper to convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to convert Uint8Array to base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Generate a random challenge
function generateChallenge(): Uint8Array {
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  return challenge;
}

/**
 * Checks if the platform authenticator is available.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (
    !window.PublicKeyCredential ||
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function'
  ) {
    return false;
  }
  return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

/**
 * Prompts the user to register their biometrics for local lock.
 * Returns the base64-encoded credential ID on success.
 */
export async function registerBiometricLock(): Promise<string> {
  if (!await isBiometricAvailable()) {
    throw new Error('Biometric authentication is not available on this device.');
  }

  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  const createOptions: PublicKeyCredentialCreationOptions = {
    challenge: generateChallenge(),
    rp: {
      name: "ClearLedger Local Lock",
      id: window.location.hostname
    },
    user: {
      id: userId,
      name: "local_user",
      displayName: "Local App User"
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 }, // ES256
      { type: "public-key", alg: -257 } // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred"
    },
    timeout: 60000,
    attestation: "none"
  };

  const credential = await navigator.credentials.create({
    publicKey: createOptions
  }) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Failed to create biometric credential.');
  }

  // Save the rawId for later authentication
  return uint8ArrayToBase64(new Uint8Array(credential.rawId));
}

/**
 * Prompts the user to authenticate using their previously registered biometrics.
 * Throws an error if authentication fails or is cancelled.
 */
export async function verifyBiometricLock(credentialIdBase64: string): Promise<boolean> {
  const credentialId = base64ToUint8Array(credentialIdBase64);

  const requestOptions: PublicKeyCredentialRequestOptions = {
    challenge: generateChallenge(),
    rpId: window.location.hostname,
    allowCredentials: [
      {
        type: "public-key",
        id: credentialId,
      }
    ],
    userVerification: "required",
    timeout: 60000
  };

  const assertion = await navigator.credentials.get({
    publicKey: requestOptions
  }) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error('Failed to verify biometric credential.');
  }

  // If we get an assertion, the user successfully verified locally.
  return true;
}
