export function getCurrentLocation(successCallback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successCallback, (err) => {
      alert("Location access denied!");
    });
  } else {
    alert("Geolocation not supported!");
  }
}
