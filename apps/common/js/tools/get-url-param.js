export default function getURLParam(name, defaultValue = null) {
  const url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
  const results = regex.exec(url);
  if (!results) return defaultValue;
  if (!results[2]) return true;
  const value = decodeURIComponent(results[2].replace(/\+/g, " "));
  if (value === 'false') return false;
  return value;
}
