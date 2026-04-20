/**
 * GasBridge.js
 * Handles communication with Google Apps Script backend.
 * Support for both google.script.run (when hosted on GAS) 
 * and fetch (for local development/custom domains).
 */

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzv9lWlKhHRdmWV2mysU2rQoGiY6IlVtCsbDi-Ij1mDUeyAI-pvP-v3G_MU-ALvIOSX/exec"; // User can fill this in for standalone hosting

export const callGas = (functionName, ...args) => {
  return new Promise((resolve, reject) => {
    // 1. Check if we are inside GAS environment
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)[functionName](...args);
    } else {
      // 2. Fallback for standalone/local environment
      // This assumes a 'postMessage' or 'fetch' bridge is set up on the GAS side
      // For now, we'll implement a Mock or Fetch based on the setup
      if (WEB_APP_URL) {
        fetch(WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify({ functionName, args })
        })
          .then(res => res.json())
          .then(data => resolve(data))
          .catch(err => reject(err));
      } else {
        console.warn(`GasBridge: Called ${functionName} outside GAS and no WEB_APP_URL provided. Returning mock data.`);

        // Improved mock data for common calls
        const mocks = {
          getRounds: [{ id: 'Round_01', name: 'Round 01', isActive: true }],
          getMentors: ['Mentor A', 'Mentor B'],
          getAllCompaniesForForm: [{ name: 'Alpha Corp', isAssigned: true }],
          getFollowUpData: [],
          getAdminStats: { totalMentors: 0, totalReports: 0, totalDiagnoses: 0, mentors: [] }
        };

        resolve(mocks[functionName] || { mock: true });
      }
    }
  });
};

export default callGas;
